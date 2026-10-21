// src/components/GatewaySimulator.tsx
// "AI Gateway simulator": an interactive, in-browser model of the gateway's routing rules
// (ordered model fallback, circuit breaker with a single probe, opt-in prompt caching).
// Everything here is simulated. No model is called, and time is sped up so you can watch it.
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const ACCENT = '#3abf00';
const glass = 'rounded-xl border bg-gray-950/70 backdrop-blur shadow-[0_0_24px_rgba(58,191,0,0.12)]';
const glassBorder = { borderColor: 'rgba(58,191,0,0.35)' };
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Mode = 'healthy' | 'rate-limit' | 'overloaded' | 'erroring';
type Circuit = 'closed' | 'open' | 'half-open';
type Breaker = { state: Circuit; openedAt: number; pauseMs: number; reopens: number; window: boolean[] }; // window: true = failed
type Line = { id: number; text: string; color: string };

// Tried in this order, like the real gateway's ordered model list
const MODELS = [
  { id: 'primary', name: 'Claude Opus', role: 'PRIMARY', lat: [600, 1400] },
  { id: 'fallback', name: 'Claude Sonnet', role: 'FALLBACK', lat: [400, 1000] },
];
const MODES: { id: Mode; label: string }[] = [
  { id: 'healthy', label: 'Healthy' },
  { id: 'rate-limit', label: 'Rate-limited (429)' },
  { id: 'overloaded', label: 'Overloaded' },
  { id: 'erroring', label: 'Erroring (500)' },
];

// Real rules, in real milliseconds. The simulator divides pauses by SPEED so they are watchable.
const SPEED = 5;
const OVERLOADED_PAUSE_MS = 15_000; // "overloaded" pauses that model for 15s
const BASE_PAUSE_MS = 30_000;       // otherwise the provider's retry-after, else 30s...
const MAX_PAUSE_MS = 300_000;       // ...doubling up to 5 minutes
const WINDOW = 20;                  // judge error rate over the last 20 calls
const MIN_CALLS = 10;               // never trip on error rate before 10 calls
const FAIL_RATE = 0.5;              // trip when half of those calls failed
const INPUT_TOKENS = 2000;          // input tokens per simulated request
const CACHE_READ = 0.1;             // cache read costs 0.1x
const CACHE_WRITE = 1.25;           // cache write costs 1.25x

const backoff = (reopens: number) => Math.min(BASE_PAUSE_MS * 2 ** reopens, MAX_PAUSE_MS);

const fresh = () => ({
  mode: Object.fromEntries(MODELS.map((m) => [m.id, 'healthy'])) as Record<string, Mode>,
  breakers: Object.fromEntries(MODELS.map((m) => [m.id, { state: 'closed', openedAt: 0, pauseMs: 0, reopens: 0, window: [] }])) as Record<string, Breaker>,
  warm: new Set<string>(), // models whose marked prompt is already cached
  cache: true,
  stats: { requests: 0, fallbacks: 0, failed: 0, billed: 0, baseline: 0 },
});

const shownState = (b: Breaker, now: number): Circuit =>
  b.state === 'open' && now - b.openedAt >= b.pauseMs ? 'half-open' : b.state;

function GatewaySimulator() {
  const sim = useRef(fresh());
  const uid = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const [, setVersion] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const bump = () => setVersion((v) => v + 1);

  useEffect(() => {
    // scroll the log container itself (not the page) so new lines stay in view
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);

  const s = sim.current;
  const now = Date.now();
  const anyOpen = Object.values(s.breakers).some((b) => b.state === 'open');
  useEffect(() => {
    if (!anyOpen) return;
    const id = setInterval(bump, 500); // keep the pause countdown fresh
    return () => clearInterval(id);
  }, [anyOpen]);

  const log = (text: string, color = '#d1d5db') =>
    setLines((l) => [...l, { id: (uid.current += 1), text, color }].slice(-100));

  const sendRequest = () => {
    const { mode, breakers, warm, stats } = sim.current;
    const t = Date.now();
    stats.requests += 1;
    log(`#${stats.requests} request in (${INPUT_TOKENS} input tokens)`, '#9ca3af');

    for (let i = 0; i < MODELS.length; i++) {
      const m = MODELS[i];
      const b = breakers[m.id];
      const trip = (realMs: number, why: string) => {
        b.state = 'open';
        b.openedAt = t;
        b.pauseMs = realMs / SPEED;
        log(`   ${m.name}: ${why}, paused ${realMs / 1000}s`, '#f87171');
      };

      if (b.state === 'open') {
        if (t - b.openedAt < b.pauseMs) { log(`   ${m.name}: paused, skipped`, '#fbbf24'); continue; }
        b.state = 'half-open';
        log(`   ${m.name}: pause over, sending one probe`, '#fbbf24');
      }
      const probe = b.state === 'half-open';

      if (mode[m.id] === 'healthy') {
        b.window = [...b.window, false].slice(-WINDOW);
        if (probe) { b.state = 'closed'; b.window = []; b.reopens = 0; log(`   ${m.name}: probe ok, circuit CLOSED`, ACCENT); }
        const hit = sim.current.cache && warm.has(m.id);
        const rate = !sim.current.cache ? 1 : hit ? CACHE_READ : CACHE_WRITE;
        if (sim.current.cache) warm.add(m.id);
        stats.billed += INPUT_TOKENS * rate;
        stats.baseline += INPUT_TOKENS;
        const ms = Math.round(m.lat[0] + Math.random() * (m.lat[1] - m.lat[0]));
        const cacheNote = !sim.current.cache ? 'no caching' : hit ? 'cache read 0.1x' : 'cache write 1.25x';
        if (i > 0) {
          stats.fallbacks += 1;
          log(`   FALLBACK to ${m.name} (logged, flagged on the response) in ${ms}ms, ${cacheNote}, billed ${INPUT_TOKENS * rate} tokens`, ACCENT);
        } else {
          log(`   served by ${m.name} in ${ms}ms, ${cacheNote}, billed ${INPUT_TOKENS * rate} tokens`, ACCENT);
        }
        bump();
        return;
      }

      // a failed attempt
      b.window = [...b.window, true].slice(-WINDOW);
      if (probe) {
        b.reopens += 1;
        log(`   ${m.name}: probe failed`, '#f87171');
        trip(backoff(b.reopens), 'circuit reopened for longer');
      } else if (mode[m.id] === 'rate-limit') {
        log(`   ${m.name}: rate limited (429)`, '#f87171');
        trip(backoff(b.reopens), 'circuit OPEN at once');
      } else if (mode[m.id] === 'overloaded') {
        log(`   ${m.name}: overloaded`, '#f87171');
        trip(OVERLOADED_PAUSE_MS, 'model');
      } else {
        const fails = b.window.filter(Boolean).length;
        log(`   ${m.name}: error (500), ${fails} of last ${b.window.length} calls failed`, '#f87171');
        if (b.window.length >= MIN_CALLS && fails / b.window.length >= FAIL_RATE) {
          trip(backoff(b.reopens), 'half the recent calls failed, circuit OPEN');
        }
      }
    }
    stats.failed += 1;
    log('   503: no model available', '#f87171');
    bump();
  };

  const send = async (count: number) => {
    if (busy) return;
    setBusy(true);
    for (let i = 0; i < count; i++) {
      sendRequest();
      if (i < count - 1) await sleep(300);
    }
    setBusy(false);
  };

  const setMode = (id: string, m: Mode) => {
    s.mode[id] = m;
    log(`${MODELS.find((x) => x.id === id)?.name} set to: ${MODES.find((x) => x.id === m)?.label}`, '#9ca3af');
    bump();
  };
  const toggleCache = () => { s.cache = !s.cache; bump(); };
  const reset = () => { sim.current = fresh(); setLines([]); bump(); };

  const saved = s.stats.baseline > 0 ? Math.round((1 - s.stats.billed / s.stats.baseline) * 100) : 0;
  const btn = 'px-3 py-2 rounded-lg text-xs font-semibold border border-gray-700 text-gray-200 hover:bg-gray-800 disabled:opacity-50';
  const circuitColor: Record<Circuit, string> = { closed: ACCENT, open: '#f87171', 'half-open': '#fbbf24' };

  return (
    <section id="gateway" className="relative min-h-screen py-20 px-4 sm:px-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs sm:text-sm tracking-wide mb-2" style={{ color: ACCENT }}>// PLAYGROUND: AI GATEWAY SIMULATOR</p>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-2" style={{ color: ACCENT }}>Take a model down</h2>
        <p className="text-sm text-gray-400 mb-6 max-w-2xl">
          A simplified model of the AI gateway I built. Make a model rate-limited, overloaded or erroring, send some requests, and watch the fallback and the circuit breaker react.
          Simulated in your browser, with time sped up {SPEED}x. Not the production code.
        </p>

        {/* toolbar */}
        <div className={`${glass} p-3 mb-4 flex flex-wrap items-center gap-3`} style={glassBorder}>
          <motion.button onClick={() => send(1)} disabled={busy} whileHover={{ boxShadow: `0 0 24px ${ACCENT}99` }} whileTap={{ scale: 0.97 }}
            className="px-4 py-2 rounded-lg text-xs font-bold text-black disabled:opacity-60" style={{ background: ACCENT }}>
            SEND REQUEST
          </motion.button>
          <button onClick={() => send(10)} disabled={busy} className={btn}>SEND 10</button>
          <button onClick={reset} className={btn}>RESET</button>
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
            <input type="checkbox" checked={s.cache} onChange={toggleCache} className="accent-[#3abf00]" />
            Mark prompt for caching
          </label>
          <div className="ml-auto flex flex-wrap items-center gap-4 text-[11px] font-mono text-gray-400">
            <span>REQUESTS <b style={{ color: ACCENT }}>{s.stats.requests}</b></span>
            <span>FALLBACKS <b style={{ color: ACCENT }}>{s.stats.fallbacks}</b></span>
            <span>FAILED <b style={{ color: s.stats.failed ? '#f87171' : ACCENT }}>{s.stats.failed}</b></span>
            <span title="Input cost versus sending the same requests with no caching. Negative while cache writes (1.25x) outweigh reads (0.1x).">
              VS NO CACHE <b style={{ color: saved >= 0 ? ACCENT : '#fbbf24' }}>{saved > 0 ? `-${saved}` : saved < 0 ? `+${-saved}` : 0}%</b>
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4">
          {/* models */}
          <div className="space-y-3">
            {MODELS.map((m) => {
              const b = s.breakers[m.id];
              const st = shownState(b, now);
              const bad = s.mode[m.id] !== 'healthy';
              const wait = Math.max(0, Math.ceil((b.pauseMs - (now - b.openedAt)) / 1000));
              const fails = b.window.filter(Boolean).length;
              return (
                <div key={m.id} className={`${glass} p-4`} style={{ borderColor: bad ? 'rgba(248,113,113,0.5)' : glassBorder.borderColor }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{m.name} <span className="ml-2 text-[10px] font-mono text-gray-500">{m.role}</span></p>
                      <p className="text-[11px] font-mono mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span style={{ color: circuitColor[st] }}>circuit: {st}{b.state === 'open' && st === 'open' ? ` (${wait}s)` : ''}</span>
                        <span className="text-gray-500">recent failures: {fails}/{b.window.length}</span>
                        <span className="text-gray-500">cache: {s.warm.has(m.id) ? 'warm' : 'cold'}</span>
                      </p>
                    </div>
                    <select value={s.mode[m.id]} onChange={(e) => setMode(m.id, e.target.value as Mode)} aria-label={`${m.name} behaviour`}
                      className="bg-gray-900 border rounded-lg px-2 py-1.5 text-[11px] font-mono outline-none"
                      style={{ borderColor: bad ? '#f87171' : ACCENT, color: bad ? '#f87171' : ACCENT }}>
                      {MODES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              );
            })}
            <ul className="text-[11px] text-gray-500 leading-relaxed list-disc pl-4 space-y-1">
              <li>Models are tried in order. A fallback is never silent: it is logged and flagged on the response.</li>
              <li>A rate limit trips the circuit at once. "Overloaded" pauses that model for 15s.</li>
              <li>Other errors trip it when half of the last {WINDOW} calls failed, and never before {MIN_CALLS} calls. Try SEND 10 with an erroring model.</li>
              <li>The pause is the provider's retry-after, else 30s doubling up to 5 minutes. After it, exactly one probe request decides if the circuit closes.</li>
              <li>Caching is opt-in per request. A cache read costs {CACHE_READ}x, a write {CACHE_WRITE}x, and each model has its own cache, so a fallback starts cold.</li>
            </ul>
          </div>

          {/* audit log */}
          <div className={`${glass} h-[460px] flex flex-col overflow-hidden`} style={glassBorder}>
            <div className="px-4 py-2 border-b border-gray-800 text-[11px] font-mono text-gray-500 flex justify-between">
              <span>audit log: every attempt</span><span>simulated</span>
            </div>
            <div ref={logRef} className="flex-1 overflow-auto p-3 text-[12px] font-mono space-y-0.5" aria-live="polite">
              {lines.length === 0 && <p className="text-gray-600">Press SEND REQUEST to route a request.</p>}
              {lines.map((l) => <pre key={l.id} className="whitespace-pre-wrap" style={{ color: l.color }}>{l.text}</pre>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GatewaySimulator;
