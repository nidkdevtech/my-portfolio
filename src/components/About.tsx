// src/components/About.tsx: "Diagnostics & System Architecture" spec sheet + command hub
import { useState, useEffect, useRef } from 'react';
import type { ReactNode, MouseEvent } from 'react';
import { motion, animate, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { Download, Linkedin, Github, Mail, Code2 } from 'lucide-react';
import { profile } from '../data';

const ACCENT = '#3abf00';
const glass = 'rounded-2xl border bg-gray-950/60 backdrop-blur-md shadow-[0_0_30px_rgba(58,191,0,0.10)]';
const edge = { borderColor: 'rgba(58,191,0,0.28)' };
const ROTATE_MS = 6000; // how long each tech-stack category stays on screen

const impact = [
  { tag: 'AI SYSTEMS', text: 'Architected a multi-agent pipeline (Generator + Verifier) that cut new-source delivery from 4 weeks to under 2 days across 250+ legal data sources, at 90%+ accuracy.' },
  { tag: 'PLATFORM', text: 'Built a multi-provider AI gateway (OpenAI, Anthropic, DeepSeek) with priority fallback, circuit breakers and prompt caching that cut cached-input token cost by ~90%.' },
  { tag: 'MODERNISATION', text: 'Upgraded a legacy Spring Boot application from Java 7 to Java 17 across 12 modules, and added OAuth2 SSO with stateless JWT and role-based access.' },
  { tag: 'FULL-STACK', text: 'Shipped a React + Spring Boot dashboard on Azure DevOps APIs and a database automation platform monitoring 250+ SQL Server instances, each cutting manual work by 40%.' },
];

const stack = [
  { cat: 'Languages', tags: ['Java', 'C#', 'SQL', 'Python', 'JavaScript'],
    ctx: 'Java and C# are my two main backend languages at Cognizant: the Java 17 migration and SSO work are Java, the AI pipeline and gateway are C#. SQL across SQL Server and PostgreSQL.', pill: 'Java / C# / SQL' },
  { cat: 'Backend', tags: ['Spring Boot', 'Spring Security', 'Spring Data JPA', 'Hibernate', 'ASP.NET Core', 'REST APIs', 'Microservices', 'Dependency Injection', 'Middleware Pipelines', 'Swagger/OpenAPI'],
    ctx: 'REST APIs and microservices on Spring Boot and ASP.NET Core, secured with OAuth2 SSO, stateless JWT and role-based access.', flow: 'request > middleware / filter chain > JWT > role check > controller' },
  { cat: 'AI & LLM', tags: ['RAG', 'pgvector', 'LangChain4j', 'Prompt Engineering', 'Agentic Workflows', 'Azure AI Foundry'],
    ctx: 'Multi-agent pipelines and a multi-provider gateway in production, plus ResuMatch as a personal RAG project. Comfortable with AI-assisted development (Claude Code, Cursor).', pill: 'Anthropic certified' },
  { cat: 'Frontend', tags: ['React.js', 'JavaScript', 'HTML', 'CSS'],
    ctx: 'React front ends for internal dashboards and personal projects, wired to Spring Boot APIs.' },
  { cat: 'Data', tags: ['PostgreSQL', 'SQL Server'],
    ctx: 'A durable job queue on SQL Server, vector search on PostgreSQL with pgvector, and monitoring of 250+ SQL Server instances.' },
  { cat: 'Tools & DevOps', tags: ['Docker', 'Git', 'Azure DevOps CI/CD', 'Postman'],
    ctx: 'Automated API tests and Azure DevOps CI/CD deployments.' },
  { cat: 'Fundamentals', tags: ['Data Structures & Algorithms', 'OOP', 'Multithreading', 'Design Patterns', 'System Design'],
    ctx: 'Problem-solving practice on LeetCode alongside work, and design patterns such as Strategy, used in ResuMatch for swappable embedding providers.' },
];

/* ---------- small helpers ---------- */
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.4, ease: 'easeOut', onUpdate: (l) => setV(Math.round(l)) });
    return () => c.stop();
  }, [inView, to]);
  return <span ref={ref}>{v}{suffix}</span>;
}

function Gauge({ value, label }: { value: number; label: string }) {
  return (
    <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden" role="img" aria-label={label}>
      <motion.div className="h-full rounded-full" style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }}
        initial={{ width: 0 }} whileInView={{ width: `${value}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: 'easeOut' }} />
    </div>
  );
}

const Pill = ({ children }: { children: ReactNode }) => (
  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border" style={{ borderColor: ACCENT, color: ACCENT }}>{children}</span>
);

/* ---------- tilting initials badge ---------- */
function AvatarCard() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [14, -14]), { stiffness: 150, damping: 15 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 150, damping: 15 });
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <div onMouseMove={onMove} onMouseLeave={() => { mx.set(0); my.set(0); }} className={`${glass} p-6 flex items-center gap-5`} style={edge}>
      <motion.div style={{ rotateX: rx, rotateY: ry, transformPerspective: 600 }} className="relative w-28 h-28 shrink-0">
        <motion.div className="absolute inset-0 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ background: `conic-gradient(from 0deg, ${ACCENT}, transparent 40%, ${ACCENT} 70%, transparent)`, filter: 'blur(1px)' }} />
        <div className="absolute inset-[3px] rounded-full bg-black overflow-hidden flex items-center justify-center" style={{ boxShadow: `0 0 30px ${ACCENT}55` }}>
          {/* To use a photo instead: import it from './avatar.png' and render an <img> here */}
          <span className="font-display font-extrabold text-3xl" style={{ color: ACCENT }} aria-label={profile.name}>{profile.initials}</span>
        </div>
      </motion.div>
      <div>
        <p className="font-display font-extrabold text-xl text-white">{profile.name}</p>
        <p className="text-xs text-gray-400">{profile.role}</p>
        <p className="text-xs mt-1" style={{ color: ACCENT }}>{profile.company}</p>
      </div>
    </div>
  );
}

/* ---------- main ---------- */
function About({ notify }: { notify: (msg: string) => void }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [meta, setMeta] = useState('PDF');
  const stackRef = useRef<HTMLDivElement>(null);
  const stackInView = useInView(stackRef, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  // Carousel: rotate through the categories while visible, and hold still on hover/touch or reduced-motion
  const auto = stackInView && !paused && !reduceMotion;
  useEffect(() => {
    if (!auto) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % stack.length), ROTATE_MS);
    return () => clearTimeout(id);
  }, [auto, active]);

  // Real file details for the resume button (size, last updated), when the file is served
  useEffect(() => {
    fetch(profile.resume, { method: 'HEAD' }).then((r) => {
      if (!r.ok || !(r.headers.get('content-type') || '').includes('pdf')) return;
      const size = r.headers.get('content-length');
      const mod = r.headers.get('last-modified');
      const parts = ['PDF'];
      if (size) parts.push(`${Math.round(Number(size) / 1024)} KB`);
      if (mod) parts.push('updated ' + new Date(mod).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }));
      setMeta(parts.join(' / '));
    }).catch(() => {});
  }, []);

  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(profile.email); notify('Email copied to clipboard'); }
    catch { notify(profile.email); }
  };
  const ctx = stack[active];
  const key = 'flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-700 bg-gray-900/70 hover:border-[#3abf00] transition-colors text-sm text-white';

  return (
    <section id="about" className="relative min-h-screen py-20 px-4 sm:px-8 text-white overflow-hidden">
      <div className="absolute -top-20 right-0 w-[60vw] h-[60vw] pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(58,191,0,0.14), transparent 65%)' }} />

      <div className="relative mx-auto max-w-7xl grid lg:grid-cols-[1.25fr_1fr] gap-8">
        {/* ---------- left: narrative + dependency matrix ---------- */}
        <div>
          <p className="font-mono text-xs sm:text-sm tracking-wide mb-4" style={{ color: ACCENT }}>// ABOUT & TECH STACK</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight mb-3 text-white">
            I'm {profile.firstName}. I build things that run in production.
          </h2>
          <p className="text-sm text-gray-300 max-w-xl mb-2">
            Backend systems and automation tools in Java and C#, plus the AI services that sit on top of them.
          </p>
          <p className="font-mono text-xs text-gray-500 mb-8">Spring Boot · ASP.NET Core · React · SQL Server · Azure DevOps · Azure AI Foundry</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {impact.map((c, i) => (
              <motion.div key={c.tag} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`${glass} p-4`} style={edge}>
                <Pill>{c.tag}</Pill>
                <p className="mt-3 text-sm text-gray-300">{c.text}</p>
              </motion.div>
            ))}
          </div>

          <div ref={stackRef} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} className={`${glass} p-4`} style={edge}>
            <p className="font-mono text-[11px] text-gray-500 mb-3">TECH STACK (rotates automatically, hover or tap to pick)</p>
            <div className="divide-y divide-gray-800">
              {stack.map((row, i) => (
                <button key={row.cat} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}
                  className="w-full text-left py-3 grid sm:grid-cols-[150px_1fr] gap-2 items-start">
                  <span className="text-xs font-mono" style={{ color: active === i ? ACCENT : '#9ca3af' }}>{row.cat}</span>
                  <span className="flex flex-wrap gap-1.5">
                    {row.tags.map((t) => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-md border transition-colors"
                        style={active === i ? { borderColor: ACCENT, color: ACCENT, background: 'rgba(58,191,0,0.08)' } : { borderColor: '#374151', color: '#d1d5db' }}>
                        {t}
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
            <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} aria-live="off" className="mt-3 rounded-xl bg-black/50 border border-gray-800 overflow-hidden text-xs text-gray-300">
              {/* loader: fills over ROTATE_MS, then the next category appears */}
              <div className="h-0.5 bg-gray-800" role="presentation">
                {auto && (
                  <motion.div className="h-full origin-left" style={{ background: ACCENT }}
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: ROTATE_MS / 1000, ease: 'linear' }} />
                )}
              </div>
              <div className="flex items-center justify-between px-3 pt-2 font-mono text-[10px] text-gray-500">
                <span style={{ color: ACCENT }}>{ctx.cat}</span>
                <span>{active + 1} / {stack.length} · {auto ? 'auto-rotating' : 'paused'}</span>
              </div>
              <div className="p-3 pt-2">
              <p>{ctx.ctx}</p>
              {ctx.flow && <p className="mt-2 font-mono" style={{ color: ACCENT }}>{ctx.flow}</p>}
              {ctx.pill && <div className="mt-2"><Pill>{ctx.pill}</Pill></div>}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ---------- right: badge, metrics, command hub ---------- */}
        <div className="space-y-4">
          <AvatarCard />

          <div className="grid grid-cols-2 gap-3">
            <div className={`${glass} p-4`} style={edge}>
              <div className="text-3xl font-display font-extrabold" style={{ color: ACCENT }}><CountUp to={3} />yrs</div>
              <p className="text-xs text-gray-400 mb-3">Nearly 3 years at Cognizant</p>
              <Gauge value={60} label="Nearly three years of experience" />
              <div className="flex gap-1.5 mt-3"><Pill>LexisNexis</Pill></div>
            </div>

            <div className={`${glass} p-4`} style={edge}>
              <div className="text-3xl font-display font-extrabold" style={{ color: ACCENT }}><CountUp to={250} suffix="+" /></div>
              <p className="text-xs text-gray-400 mb-3">Legal data sources automated</p>
              <Gauge value={85} label="250 plus data sources" />
              <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-gray-300">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full animate-ping" style={{ background: ACCENT, opacity: 0.6 }} />
                  <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                </span>
                IN PRODUCTION
              </div>
            </div>

            <div className={`${glass} p-4`} style={edge}>
              <div className="text-3xl font-display font-extrabold" style={{ color: ACCENT }}>2d</div>
              <p className="text-xs text-gray-400 mb-3">New-source delivery (was 4 weeks)</p>
              <div className="space-y-1.5 text-[10px] font-mono text-gray-400">
                <div>Before: 4 weeks<Gauge value={100} label="Before: four weeks" /></div>
                <div>After: under 2 days<Gauge value={7} label="After: under two days" /></div>
              </div>
              <p className="text-[10px] text-gray-600 mt-2">relative delivery time</p>
            </div>

            <div className={`${glass} p-4`} style={edge}>
              <div className="text-3xl font-display font-extrabold" style={{ color: ACCENT }}><CountUp to={90} suffix="%" /></div>
              <p className="text-xs text-gray-400 mb-3">Cached-input token cost cut (approx.)</p>
              <Gauge value={90} label="Roughly ninety percent token cost reduction" />
              <div className="flex gap-1.5 mt-3"><Pill>AI gateway</Pill></div>
            </div>
          </div>

          {/* command hub */}
          <div className={`${glass} p-4 space-y-3`} style={edge}>
            <p className="font-mono text-[11px] text-gray-500">COMMAND HUB / GET IN TOUCH</p>
            <motion.a href={profile.resume} download="Nidhish_Singh_Resume.pdf" onClick={() => notify('Resume downloading')}
              initial="rest" whileHover="hover" whileTap={{ scale: 0.98 }}
              variants={{ rest: { boxShadow: `0 0 0 0 ${ACCENT}00` }, hover: { boxShadow: `0 0 28px ${ACCENT}aa` } }}
              className="flex items-center justify-between gap-3 px-5 py-4 rounded-xl font-semibold text-black" style={{ background: ACCENT }}>
              <span className="flex items-center gap-3">
                <motion.span variants={{ rest: { y: 0 }, hover: { y: [0, 3, 0], transition: { repeat: Infinity, duration: 0.8 } } }}><Download size={20} /></motion.span>
                Download Resume
              </span>
              <span className="text-[10px] font-mono font-normal">{meta}</span>
            </motion.a>

            <button onClick={copyEmail} className={`${key} w-full`}>
              <span className="flex items-center gap-3"><Mail size={18} style={{ color: ACCENT }} /> Copy email</span>
              <span className="text-xs text-gray-500">{profile.email}</span>
            </button>

            <div className="grid grid-cols-3 gap-3">
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className={key}>
                <span className="flex items-center gap-2"><Linkedin size={18} style={{ color: ACCENT }} /> LinkedIn</span>
              </a>
              <a href={profile.github} target="_blank" rel="noopener noreferrer" className={key}>
                <span className="flex items-center gap-2"><Github size={18} style={{ color: ACCENT }} /> GitHub</span>
              </a>
              <a href={profile.leetcode} target="_blank" rel="noopener noreferrer" className={key}>
                <span className="flex items-center gap-2"><Code2 size={18} style={{ color: ACCENT }} /> LeetCode</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <p className="relative mt-16 text-center text-[11px] font-mono text-gray-600">
        © 2026 {profile.name} / built with React, Tailwind and Framer Motion
      </p>
    </section>
  );
}

export default About;
