// src/components/Hero.jsx: split layout. Left: intro + concept snippets. Right: tiltable live gateway console.
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { profile, stats } from '../data';
import SnakeBackground from './SnakeBackground';

const ACCENT = '#3abf00';

/* ---------- Live console: a looping, illustrative request log ---------- */
const SCRIPT = [
  { t: 'POST /v1/generate-config', c: '#d1d5db' },
  { t: '  agent=generator  provider=primary', c: '#9ca3af' },
  { t: '  cache: prompt prefix HIT (cached input ~90% cheaper)', c: ACCENT },
  { t: '  agent=verifier   checks=schema,sample-docs', c: '#9ca3af' },
  { t: '  provider=primary  503 > circuit OPEN', c: '#f87171' },
  { t: '  fallback > secondary  200 OK', c: ACCENT },
  { t: '  job=done  quality=pass  tokens tracked', c: ACCENT },
];

function LiveConsole() {
  const [n, setN] = useState(1);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 15 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 150, damping: 15 });

  useEffect(() => {
    const id = setInterval(() => setN((v) => (v >= SCRIPT.length + 3 ? 1 : v + 1)), 1100);
    return () => clearInterval(id);
  }, []);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <div onMouseMove={onMove} onMouseLeave={() => { mx.set(0); my.set(0); }} className="p-4 w-full max-w-md">
      <motion.div style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
        className="rounded-2xl border bg-gray-950/80 backdrop-blur overflow-hidden shadow-[0_30px_80px_-20px_rgba(58,191,0,0.35)]"
        >
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
          <span className="ml-2 text-[11px] font-mono text-gray-500">ai-gateway / request log (illustrative)</span>
        </div>
        <div className="p-4 h-64 font-mono text-[12px] leading-6 overflow-hidden">
          {SCRIPT.slice(0, n).map((l, i) => (
            <motion.p key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="whitespace-pre-wrap" style={{ color: l.c }}>{l.t}</motion.p>
          ))}
          {n <= SCRIPT.length && <span className="animate-pulse text-gray-500">_</span>}
        </div>
        <div className="grid grid-cols-2 border-t border-gray-800 divide-x divide-gray-800">
          {stats.slice(1, 3).map(([v, k]) => (
            <div key={k} className="px-4 py-3">
              <div className="font-display font-extrabold text-lg" style={{ color: ACCENT }}>{v}</div>
              <div className="text-[10px] text-gray-500">{k}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Left canvas ---------- */
const SNIPPETS = {
  'AI Gateway': '// One gateway, many LLM providers (C#)\nforeach (var p in byPriority) {\n  if (p.Circuit.IsOpen) continue;        // skip unhealthy\n  try { return await p.Client.GetResponseAsync(prompt); }\n  catch { p.Circuit.RecordFailure(); }\n}',
  'Multi-agent': '// Generator + Verifier loop\nconfig = generator.draft(sourceDocs);\nwhile (!verifier.passes(config, samples))\n  config = generator.revise(config, verifier.feedback());\n// 250+ sources, 4 weeks > under 2 days',
  'RAG': '-- ResuMatch hybrid search (pgvector)\nSELECT job_id, 1 - (embedding <=> :q) AS score\nFROM job_chunks\nWHERE location = :loc\nORDER BY embedding <=> :q LIMIT 20;\n-- window function de-duplicates chunks per job',
  'Spring Security': '// Stateless JWT + role-based access\nhttp.sessionManagement(s -> s.sessionCreationPolicy(STATELESS))\n    .authorizeHttpRequests(a -> a\n      .requestMatchers("/admin/**").hasRole("ADMIN")\n      .anyRequest().authenticated());',
};

function Hero() {
  const [open, setOpen] = useState('AI Gateway');
  const badge = 'px-2.5 py-1 rounded-full border text-[11px] font-mono';

  return (
    <section id="hero" className="relative min-h-screen pt-24 pb-20 px-6 lg:px-16 overflow-hidden" style={{ color: ACCENT }}>
      <SnakeBackground />
      <div className="relative z-10 mx-auto max-w-7xl grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-10rem)]">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <div className="flex flex-wrap gap-2 mb-6">
            <span className={badge} style={{ borderColor: ACCENT }}><span className="animate-pulse">●</span> OPEN TO OPPORTUNITIES</span>
            <span className={badge} style={{ borderColor: '#374151' }}>{profile.location.toUpperCase()}</span>
          </div>

          <p className="font-mono text-sm text-gray-400 mb-3">{profile.role} / {profile.company}</p>
          <h1 className="font-display font-extrabold uppercase leading-[0.9] tracking-tight text-6xl md:text-8xl" style={{ textShadow: `0 0 40px ${ACCENT}40` }}>
            NIDHISH<br />KUMAR<br />SINGH
          </h1>

          <p className="mt-6 text-sm text-gray-400 max-w-md">
            I build backends in C# / ASP.NET Core and Java / Spring Boot, plus AI-powered systems, from REST APIs and microservices to multi-agent LLM pipelines, with React on the front end. Tap a concept to see how I work:
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.keys(SNIPPETS).map((k) => (
              <button key={k} onClick={() => setOpen(open === k ? '' : k)} className="px-3 py-1 rounded-md text-xs border"
                style={open === k ? { background: ACCENT, color: '#000', borderColor: ACCENT } : { borderColor: '#374151', color: '#d1d5db' }}>
                {k}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-gray-600">Illustrative snippets of the ideas, not production code.</p>
          <AnimatePresence initial={false}>
            {open && (
              <motion.pre key={open} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mt-3 max-w-md overflow-hidden rounded-lg bg-gray-900/80 border border-gray-800 p-3 text-xs text-gray-300 whitespace-pre-wrap font-mono">
                {SNIPPETS[open]}
              </motion.pre>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="flex justify-center">
          <LiveConsole />
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
