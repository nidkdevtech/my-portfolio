// src/components/GatewaySimulator.tsx
// "AI Gateway simulator": an interactive, in-browser model of the routing logic behind a
// multi-provider LLM gateway (priority fallback, circuit breakers, prompt caching).
// Everything here is simulated. No real provider is called and the numbers are illustrative.
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const ACCENT = '#3abf00';
const glass = 'rounded-xl border bg-gray-950/70 backdrop-blur shadow-[0_0_24px_rgba(58,191,0,0.12)]';
const glassBorder = { borderColor: 'rgba(58,191,0,0.35)' };
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Health = 'up' | 'down';
type Circuit = 'closed' | 'open' | 'half-open';
type Breaker = { state: Circuit; fails: number; openedAt: number };
type Line = { id: number; text: string; color: string };

// Illustrative priority order and latency ranges (ms)
const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', lat: [350, 800] },
  { id: 'anthropic', name: 'Anthropic', lat: [400, 900] },
  { id: 'deepseek', name: 'DeepSeek', lat: [500, 1100] },
];
const THRESHOLD = 3;        // consecutive failures before the circuit opens
const COOLDOWN_MS = 6000;   // how long a circuit stays open before a probe request is allowed
const INPUT_TOKENS = 2000;  // input tokens per simulated request
const CACHED_RATE = 0.1;    // cached input billed at ~10% (about a 90% cut)

const fresh = () => ({
  health: Object.fromEntries(PROVIDERS.map((p) => [p.id, 'up'])) as Record<string, Health>,
  breakers: Object.fromEntries(PROVIDERS.map((p) => [p.id, { state: 'closed', fails: 0, openedAt: 0 }])) as Record<string, Breaker>,
  warm: new Set<string>(), // providers whose prompt prefix is already cached
  cache: true,
  stats: { requests: 0, fallbacks: 0, failed: 0, billed: 0, baseline: 0 },
});

const shownState = (b: Breaker, now: number): Circuit =>
  b.state === 'open' && now - b.openedAt >= COOLDOWN_MS ? 'half-open' : b.state;

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

  const s = sim.current;
  const now = Date.now();
  const anyOpen = Object.values(s.breakers).some((b) => b.state === 'open');
  useEffect(() => {
    if (!anyOpen) return;
    const id = setInterval(bump, 500); // keep the cooldown countdown fresh
    return () => clearInterval(id);
  }, [anyOpen]);

  const log = (text: string, color = '#d1d5db') =>
    setLines((l) => [...l, { id: (uid.current += 1), text, color }].slice(-80));

  const sendRequest = () => {
    const { health, breakers, warm, stats } = sim.current;
    const t = Date.now();
    const n = stats.requests + 1;
    stats.requests = n;
    log(`#${n} request in (${INPUT_TOKENS} input tokens)`, '#9ca3af');

    for (let i = 0; i < PROVIDERS.length; i++) {
      const p = PROVIDERS[i];
      const b = breakers[p.id];
      if (b.state === 'open') {
        if (t - b.openedAt < COOLDOWN_MS) { log(`   ${p.name}: circuit open, skipped`, '#fbbf24'); continue; }
        b.state = 'half-open';
        log(`   ${p.name}: half-open, sending probe`, '#fbbf24');
      }

      if (health[p.id] === 'down') {
        b.fails += 1;
        log(`   ${p.name}: failed (timeout)`, '#f87171');
        if (b.state === 'half-open' || b.fails >= THRESHOLD) {
          b.state = 'open';
          b.openedAt = t;
          log(`   ${p.name}: circuit OPEN for ${COOLDOWN_MS / 1000}s`, '#f87171');
        }
        continue;
      }

      b.fails = 0;
      if (b.state === 'half-open') { b.state = 'closed'; log(`   ${p.name}: probe ok, circuit CLOSED`, ACCENT); }
      const hit = sim.current.cache && warm.has(p.id);
      if (sim.current.cache) warm.add(p.id);
      const billed = hit ? INPUT_TOKENS * CACHED_RATE : INPUT_TOKENS;
      stats.billed += billed;
      stats.baseline += INPUT_TOKENS;
      if (i > 0) stats.fallbacks += 1;
      const ms = Math.round(p.lat[0] + Math.random() * (p.lat[1] - p.lat[0]));
      log(`   served by ${p.name} in ${ms}ms${i > 0 ? ' (fallback)' : ''}, cache ${sim.current.cache ? (hit ? 'HIT' : 'miss') : 'off'}, billed ${billed} tokens`, ACCENT);
      bump();
      return;
    }
    stats.failed += 1;
    log('   503: no provider available', '#f87171');
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

  const toggleHealth = (id: string) => {
    s.health[id] = s.health[id] === 'up' ? 'down' : 'up';
    log(`${PROVIDERS.find((p) => p.id === id)?.name} marked ${s.health[id] === 'down' ? 'DOWN (simulated outage)' : 'healthy again'}`, '#9ca3af');
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
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-2" style={{ color: ACCENT }}>Take a provider down</h2>
        <p className="text-sm text-gray-400 mb-6 max-w-2xl">
          A simplified model of the routing logic in the AI gateway I built at Cognizant: priority fallback, circuit breakers and prompt caching.
          Take a provider down, send some requests and see what happens. Simulated in your browser, not the production code.
        </p>

        {/* toolbar */}
        <div className={`${glass} p-3 mb-4 flex flex-wrap items-center gap-3`} style={glassBorder}>
          <motion.button onClick={() => send(1)} disabled={busy} whileHover={{ boxShadow: `0 0 24px ${ACCENT}99` }} whileTap={{ scale: 0.97 }}
            className="px-4 py-2 rounded-lg text-xs font-bold text-black disabled:opacity-60" style={{ background: ACCENT }}>
            SEND REQUEST
          </motion.button>
          <button onClick={() => send(5)} disabled={busy} className={btn}>SEND 5</button>
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
          {/* providers */}
          <div className="space-y-3">
            {PROVIDERS.map((p, i) => {
              const b = s.breakers[p.id];
              const st = shownState(b, now);
              const down = s.health[p.id] === 'down';
              const wait = Math.max(0, Math.ceil((COOLDOWN_MS - (now - b.openedAt)) / 1000));
              return (
                <div key={p.id} className={`${glass} p-4 flex items-center gap-4`} style={{ borderColor: down ? 'rgba(248,113,113,0.5)' : glassBorder.borderColor }}>
                  <span className="font-display font-extrabold text-2xl w-8 text-gray-600">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-[11px] font-mono mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span style={{ color: circuitColor[st] }}>circuit: {st}{b.state === 'open' && st === 'open' ? ` (${wait}s)` : ''}</span>
                      <span className="text-gray-500">failures: {b.fails}/{THRESHOLD}</span>
                      <span className="text-gray-500">cache: {s.warm.has(p.id) ? 'warm' : 'cold'}</span>
                    </p>
                  </div>
                  <button onClick={() => toggleHealth(p.id)} aria-pressed={down}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-colors"
                    style={down ? { borderColor: '#f87171', color: '#f87171' } : { borderColor: ACCENT, color: ACCENT }}>
                    {down ? 'OUTAGE' : 'HEALTHY'}
                  </button>
                </div>
              );
            })}
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Requests go to the highest-priority provider whose circuit is closed. After {THRESHOLD} consecutive failures a circuit opens and that provider is skipped
              for {COOLDOWN_MS / 1000}s, then one probe request decides whether it closes again. Cached input is billed at about {CACHED_RATE * 100}%, but the cache is per provider,
              so a fallback starts cold. The priority order and numbers here are illustrative.
            </p>
          </div>

          {/* request log */}
          <div className={`${glass} h-[420px] flex flex-col overflow-hidden`} style={glassBorder}>
            <div className="px-4 py-2 border-b border-gray-800 text-[11px] font-mono text-gray-500 flex justify-between">
              <span>gateway.log</span><span>simulated</span>
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
