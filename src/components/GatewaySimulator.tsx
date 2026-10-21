// src/components/GatewaySimulator.tsx
// "AI Gateway simulator": an interactive, in-browser model of the routing rules in the AI gateway
// (ordered model fallback, circuit breaker, 5-minute prompt cache). Everything here is simulated:
// no model is called, latencies and token counts are illustrative, and a "skip ahead" clock lets
// you see pauses that would otherwise take up to five minutes.
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const ACCENT = '#3abf00';
const glass = 'rounded-xl border bg-gray-950/70 backdrop-blur shadow-[0_0_24px_rgba(58,191,0,0.12)]';
const glassBorder = { borderColor: 'rgba(58,191,0,0.35)' };
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Mode = 'ok' | 'overloaded' | 'rate' | 'error';
type Circuit = 'closed' | 'open' | 'half-open';
type Breaker = { state: Circuit; win: boolean[]; openedAt: number; pauseMs: number; backoff: number };
type Line = { id: number; text: string; color: string };
type Model = { id: string; name: string; enabled: boolean; lat: [number, number] };

// Illustrative setup: Opus first, Sonnet as the fallback, GPT-4.1 configured but switched off.
const MODELS: Model[] = [
  { id: 'opus', name: 'Claude Opus', enabled: true, lat: [900, 1800] },
  { id: 'sonnet', name: 'Claude Sonnet', enabled: true, lat: [500, 1100] },
  { id: 'gpt41', name: 'GPT-4.1', enabled: false, lat: [400, 900] },
];
const MODE_LABEL: Record<Mode, string> = { ok: 'Healthy', overloaded: 'Overloaded', rate: 'Rate limited', error: 'Erroring' };
const OVERLOAD_PAUSE = 15_000;   // an "overloaded" error pauses that model for 15s
const BACKOFF_START = 30_000;    // otherwise 30s, doubling...
const BACKOFF_MAX = 300_000;     // ...up to 5 minutes
const WINDOW = 20;               // recent calls considered for the error-rate rule
const MIN_CALLS = 10;            // never trip on error rate before this many calls
const TRIP_RATE = 0.5;           // trip when half of the recent calls failed
const CACHE_TTL = 300_000;       // cached prompt is reused for 5 minutes
const INPUT_TOKENS = 2000;       // input tokens per simulated request
const CACHED_RATE = 0.1;         // cached input billed at ~10% (about a 90% cut)

const newBreaker = (): Breaker => ({ state: 'closed', win: [], openedAt: 0, pauseMs: 0, backoff: BACKOFF_START });

const fresh = () => ({
  mode: Object.fromEntries(MODELS.map((m) => [m.id, 'ok'])) as Record<string, Mode>,
  breakers: Object.fromEntries(MODELS.map((m) => [m.id, newBreaker()])) as Record<string, Breaker>,
  cacheUntil: {} as Record<string, number>, // model id -> virtual time its cached prompt expires
  cache: true,
  swapped: false, // default model order can be changed in configuration
  skew: 0,        // virtual clock offset in ms
  stats: { requests: 0, fallbacks: 0, failed: 0, billed: 0, baseline: 0 },
});

const shownState = (b: Breaker, now: number): Circuit =>
  b.state === 'open' && now - b.openedAt >= b.pauseMs ? 'half-open' : b.state;

const secs = (ms: number) => (ms >= 60_000 ? `${Math.round(ms / 6000) / 10}m` : `${Math.ceil(ms / 1000)}s`);

function GatewaySimulator() {
  const sim = useRef(fresh());
  const uid = useRef(0);
  const [, setVersion] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const bump = () => setVersion((v) => v + 1);
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // scroll the log container itself (not the page) so new lines stay in view
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);

  const vnow = () => Date.now() + sim.current.skew;
  const s = sim.current;
  const now = vnow();
  const order = s.swapped ? [MODELS[1], MODELS[0], MODELS[2]] : MODELS;
  const anyOpen = Object.values(s.breakers).some((b) => b.state === 'open');
  useEffect(() => {
    if (!anyOpen) return;
    const id = setInterval(bump, 500); // keep the pause countdown fresh
    return () => clearInterval(id);
  }, [anyOpen]);

  const log = (text: string, color = '#d1d5db') =>
    setLines((l) => [...l, { id: (uid.current += 1), text, color }].slice(-100));

  const open = (m: Model, b: Breaker, t: number, pause: number, why: string) => {
    b.state = 'open';
    b.openedAt = t;
    b.pauseMs = pause;
    log(`   ${m.name}: ${why}, paused ${secs(pause)}`, '#f87171');
  };
  const nextBackoff = (b: Breaker) => { const p = b.backoff; b.backoff = Math.min(b.backoff * 2, BACKOFF_MAX); return p; };

  const sendRequest = () => {
    const st = sim.current;
    const t = vnow();
    const n = st.stats.requests + 1;
    st.stats.requests = n;
    log(`#${n} request in, key ok, within upstream limits (${INPUT_TOKENS} input tokens)`, '#9ca3af');
    const list = st.swapped ? [MODELS[1], MODELS[0], MODELS[2]] : MODELS;
    let attempts = 0;

    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (!m.enabled) { log(`   ${m.name}: disabled in config, skipped`, '#6b7280'); continue; }
      const b = st.breakers[m.id];
      let probing = false;
      if (b.state === 'open') {
        if (t - b.openedAt < b.pauseMs) { log(`   ${m.name}: circuit open, skipped`, '#fbbf24'); continue; }
        b.state = 'half-open';
        probing = true;
        log(`   ${m.name}: pause over, sending one probe request`, '#fbbf24');
      } else if (b.state === 'half-open') {
        probing = true;
      }

      attempts += 1;
      const mode = st.mode[m.id];
      if (mode !== 'ok') {
        b.win = [...b.win, true].slice(-WINDOW);
        log(`   ${m.name}: ${mode === 'overloaded' ? '529 overloaded' : mode === 'rate' ? '429 rate limited' : '500 error'}`, '#f87171');
        if (mode === 'rate') open(m, b, t, nextBackoff(b), 'rate limit trips the circuit at once');
        else if (mode === 'overloaded') open(m, b, t, OVERLOAD_PAUSE, 'overloaded');
        else if (probing) open(m, b, t, nextBackoff(b), 'probe failed, circuit reopened');
        else if (b.win.length >= MIN_CALLS && b.win.filter(Boolean).length / b.win.length >= TRIP_RATE) {
          open(m, b, t, nextBackoff(b), `${b.win.filter(Boolean).length} of last ${b.win.length} calls failed`);
        }
        continue;
      }

      b.win = [...b.win, false].slice(-WINDOW);
      if (probing) {
        b.state = 'closed';
        b.win = [];
        b.backoff = BACKOFF_START;
        log(`   ${m.name}: probe succeeded, circuit CLOSED`, ACCENT);
      }
      const hit = st.cache && (st.cacheUntil[m.id] ?? 0) > t;
      if (st.cache) st.cacheUntil[m.id] = t + CACHE_TTL;
      const billed = hit ? INPUT_TOKENS * CACHED_RATE : INPUT_TOKENS;
      st.stats.billed += billed;
      st.stats.baseline += INPUT_TOKENS;
      const fallback = attempts > 1 || i > 0;
      if (fallback) st.stats.fallbacks += 1;
      const ms = Math.round(m.lat[0] + Math.random() * (m.lat[1] - m.lat[0]));
      log(`   served by ${m.name} in ${ms}ms${fallback ? '  FALLBACK (logged and flagged on the response)' : ''}`, ACCENT);
      log(`   cache ${st.cache ? (hit ? 'HIT' : 'miss') : 'off'}, billed ${billed} input tokens, ${attempts} attempt${attempts > 1 ? 's' : ''} written to the audit log`, '#86efac');
      bump();
      return;
    }
    st.stats.failed += 1;
    log(`   503: no model available (${attempts} attempt${attempts === 1 ? '' : 's'} logged)`, '#f87171');
    bump();
  };

  const send = async (count: number) => {
    if (busy) return;
    setBusy(true);
    for (let i = 0; i < count; i++) {
      sendRequest();
      if (i < count - 1) await sleep(350);
    }
    setBusy(false);
  };

  const setMode = (id: string, mode: Mode) => {
    s.mode[id] = mode;
    log(`${MODELS.find((m) => m.id === id)?.name} set to: ${MODE_LABEL[mode]}`, '#9ca3af');
    bump();
  };
  const skip = (ms: number) => { s.skew += ms; log(`>> clock skipped ahead ${secs(ms)}`, '#9ca3af'); bump(); };
  const toggleCache = () => { s.cache = !s.cache; bump(); };
  const swap = () => { s.swapped = !s.swapped; log(`Default model changed to ${(s.swapped ? MODELS[1] : MODELS[0]).name} (configuration)`, '#9ca3af'); bump(); };
  const reset = () => { sim.current = fresh(); setLines([]); bump(); };

  const saved = s.stats.baseline > 0 ? Math.round((1 - s.stats.billed / s.stats.baseline) * 100) : 0;
  const btn = 'px-3 py-2 rounded-lg text-xs font-semibold border border-gray-700 text-gray-200 hover:bg-gray-800 disabled:opacity-50';
  const circuitColor: Record<Circuit, string> = { closed: ACCENT, open: '#f87171', 'half-open': '#fbbf24' };

  return (
    <section id="gateway" className="relative min-h-screen py-20 px-4 sm:px-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs sm:text-sm tracking-wide mb-2" style={{ color: ACCENT }}>// PLAYGROUND: AI GATEWAY SIMULATOR</p>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-2" style={{ color: ACCENT }}>Break a model, watch the gateway cope</h2>
        <p className="text-sm text-gray-400 mb-6 max-w-2xl">
          A simplified model of the rules in the AI gateway I built at Cognizant: ordered model fallback, a circuit breaker and prompt caching.
          Make a model fail, send some requests and see what happens. It runs in your browser and calls no real model.
        </p>

        {/* toolbar */}
        <div className={`${glass} p-3 mb-4 flex flex-wrap items-center gap-3`} style={glassBorder}>
          <motion.button onClick={() => send(1)} disabled={busy} whileHover={{ boxShadow: `0 0 24px ${ACCENT}99` }} whileTap={{ scale: 0.97 }}
            className="px-4 py-2 rounded-lg text-xs font-bold text-black disabled:opacity-60" style={{ background: ACCENT }}>
            SEND REQUEST
          </motion.button>
          <button onClick={() => send(5)} disabled={busy} className={btn}>SEND 5</button>
          <button onClick={() => skip(15_000)} className={btn} title="Move the simulated clock forward">SKIP 15s</button>
          <button onClick={() => skip(60_000)} className={btn} title="Move the simulated clock forward">SKIP 1 MIN</button>
          <button onClick={reset} className={btn}>RESET</button>
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
            <input type="checkbox" checked={s.cache} onChange={toggleCache} className="accent-[#3abf00]" />
            Prompt caching
          </label>
          <div className="ml-auto flex flex-wrap items-center gap-4 text-[11px] font-mono text-gray-400">
            <span>REQUESTS <b style={{ color: ACCENT }}>{s.stats.requests}</b></span>
            <span>FALLBACKS <b style={{ color: ACCENT }}>{s.stats.fallbacks}</b></span>
            <span>FAILED <b style={{ color: s.stats.failed ? '#f87171' : ACCENT }}>{s.stats.failed}</b></span>
            <span title="Input-token cost saved by caching, versus no cache">SAVED <b style={{ color: ACCENT }}>{saved}%</b></span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4">
          {/* models */}
          <div className="space-y-3">
            {order.map((m, i) => {
              const b = s.breakers[m.id];
              const state = shownState(b, now);
              const mode = s.mode[m.id];
              const wait = Math.max(0, b.pauseMs - (now - b.openedAt));
              const warm = (s.cacheUntil[m.id] ?? 0) > now;
              return (
                <div key={m.id} className={`${glass} p-4 flex items-center gap-4 ${m.enabled ? '' : 'opacity-50'}`}
                  style={{ borderColor: mode !== 'ok' && m.enabled ? 'rgba(248,113,113,0.5)' : glassBorder.borderColor }}>
                  <span className="font-display font-extrabold text-2xl w-8 text-gray-600">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{m.name}{!m.enabled && <span className="ml-2 text-[10px] font-mono text-gray-500">DISABLED IN CONFIG</span>}</p>
                    {m.enabled && (
                      <p className="text-[11px] font-mono mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span style={{ color: circuitColor[state] }}>circuit: {state}{b.state === 'open' && state === 'open' ? ` (${secs(wait)})` : ''}</span>
                        <span className="text-gray-500">recent failures: {b.win.filter(Boolean).length}/{b.win.length}</span>
                        <span className="text-gray-500">cache: {warm ? 'warm' : 'cold'}</span>
                      </p>
                    )}
                  </div>
                  {m.enabled && (
                    <select value={mode} onChange={(e) => setMode(m.id, e.target.value as Mode)} aria-label={`${m.name} behaviour`}
                      className="px-2 py-1.5 rounded-lg text-[11px] font-mono border bg-black"
                      style={mode === 'ok' ? { borderColor: ACCENT, color: ACCENT } : { borderColor: '#f87171', color: '#f87171' }}>
                      {(Object.keys(MODE_LABEL) as Mode[]).map((k) => <option key={k} value={k}>{MODE_LABEL[k]}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
            <button onClick={swap} className={`${btn} w-full`}>SWAP DEFAULT MODEL (configuration)</button>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Models are tried in order, skipping any that are disabled or paused. A rate limit trips a model's circuit at once. Overloaded pauses it for 15s.
              Other errors trip it when half of the last {WINDOW} calls failed (never before {MIN_CALLS} calls). Other pauses start at 30s and double up to 5 minutes.
              After a pause, one probe request decides whether the circuit closes. A cached prompt is reused for 5 minutes and billed at about {CACHED_RATE * 100}%,
              and each model has its own cache, so a fallback starts cold. Rules are from the real gateway. Models, latencies and token counts are illustrative.
            </p>
          </div>

          {/* request log */}
          <div className={`${glass} h-[460px] flex flex-col overflow-hidden`} style={glassBorder}>
            <div className="px-4 py-2 border-b border-gray-800 text-[11px] font-mono text-gray-500 flex justify-between">
              <span>gateway.log</span><span>simulated</span>
            </div>
            <div ref={logRef} className="flex-1 overflow-auto p-3 text-[12px] font-mono space-y-0.5" aria-live="polite">
              {lines.length === 0 && <p className="text-gray-600">Set Claude Opus to Overloaded, then press SEND REQUEST.</p>}
              {lines.map((l) => <pre key={l.id} className="whitespace-pre-wrap" style={{ color: l.color }}>{l.text}</pre>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GatewaySimulator;
