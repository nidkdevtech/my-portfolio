// src/components/TimeLine.tsx
// "Deployment Console": career as a git graph. Main trunk to the latest release,
// side projects branch out and merge back. Each commit is an expandable PR card.
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ACCENT = '#3abf00';
const TRUNK_X = 24;
const BRANCH_X = 72;
const DOT_Y = 28;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Tag = 'feat' | 'perf' | 'fix' | 'chore' | 'release';
type Commit = {
  lane: 'T' | 'B';
  branch?: string;
  tag: Tag;
  ver: string;
  year: string;
  title: string;
  body: string;
  stats: [string, string][];
  stack: string[];
  diff?: string[];
};

// T = main trunk commit, B = side branch (forks from the previous trunk commit, merges into the next)
const commits: Commit[] = [
  { lane: 'T', tag: 'chore', ver: '0.1.0', year: '2019', title: 'Start B.Tech at GL Bajaj Institute of Technology and Management',
    body: 'Bachelor of Technology in Electronics and Communication Engineering, Greater Noida, 2019 to 2023.',
    stats: [['Degree', 'B.Tech (ECE)']], stack: [] },
  { lane: 'T', tag: 'release', ver: '1.0.0', year: '2023', title: 'Graduate and move into software engineering',
    body: 'Completed the B.Tech in June 2023 and went into software development.', stats: [['Degree', 'B.Tech']], stack: [] },
  { lane: 'T', tag: 'feat', ver: '1.1.0', year: 'Dec 2023', title: 'Join Cognizant as a Backend Software Engineer (client: LexisNexis)',
    body: 'Backend development with Java / Spring Boot and C# / ASP.NET Core, with exposure to React.js on the front end.',
    stats: [['Role', 'Software Engineer, Backend'], ['Where', 'Bengaluru']], stack: ['Java', 'Spring Boot', 'C#', 'ASP.NET Core', 'React.js'] },
  { lane: 'T', tag: 'feat', ver: '1.2.0', year: '2023-now', title: 'Build a database automation platform for 250+ SQL Server instances',
    body: 'Automated health checks and anomaly detection across 250+ SQL Server instances, with automated API tests and Azure DevOps CI/CD deployments.',
    stats: [['Instances', '250+'], ['Manual DBA work', '40% less']], stack: ['SQL Server', 'Azure DevOps', 'CI/CD'] },
  { lane: 'T', tag: 'feat', ver: '1.3.0', year: '2023-now', title: 'Ship a React + Spring Boot dashboard on Azure DevOps APIs',
    body: 'Real-time ticket throughput and SLA compliance tracking, replacing manual reporting.',
    stats: [['Reporting overhead', '40% lower']], stack: ['React.js', 'Spring Boot', 'Azure DevOps'] },
  { lane: 'B', branch: 'feat/resumatch', tag: 'feat', ver: '1.4.0', year: 'Side project', title: 'Build ResuMatch, a RAG-based job recommendation engine',
    body: 'Semantic resume-to-job matching with LangChain4j and pgvector across 1,100+ real job listings, with hybrid search and Groq LLaMA 3 explanations.',
    stats: [['Listings', '1,100+'], ['Search', 'pgvector hybrid']], stack: ['Java', 'LangChain4j', 'pgvector', 'React.js', 'Docker'] },
  { lane: 'T', tag: 'perf', ver: '2.0.0', year: '2023-now', title: 'Upgrade a legacy Spring Boot app from Java 7 to Java 17',
    body: 'Migrated 12 modules to Streams, lambdas and Optional during a scaling initiative, cutting boilerplate by roughly a third and removing a recurring class of null-pointer defects.',
    stats: [['Modules', '12'], ['Boilerplate', '~1/3 less']], stack: ['Java 17', 'Spring Boot'],
    diff: ['- Java 7: manual loops, null checks', '+ Java 17: Streams, lambdas, Optional', '  // 12 modules migrated'] },
  { lane: 'T', tag: 'feat', ver: '2.1.0', year: '2023-now', title: 'Add OAuth2 single sign-on and stateless JWT auth',
    body: 'Role-based access (USER / ADMIN) enforced on every endpoint that handles personal user data.',
    stats: [['Auth', 'OAuth2 + JWT'], ['Roles', 'USER / ADMIN']], stack: ['Spring Security', 'OAuth2', 'JWT'] },
  { lane: 'B', branch: 'feat/expense-tracker', tag: 'feat', ver: '2.2.0', year: 'Side project', title: 'Build Smart Expense Tracker with Stripe and AI insights',
    body: 'JWT with role-based access, Stripe subscriptions and webhooks, and Groq LLaMA 3 monthly financial insights.',
    stats: [['Payments', 'Stripe'], ['Auth', 'JWT + RBAC']], stack: ['Spring Security', 'Stripe', 'PostgreSQL', 'React.js'] },
  { lane: 'T', tag: 'feat', ver: '3.0.0', year: '2023-now', title: 'Build the multi-agent pipeline that writes document-parsing configs',
    body: 'Court websites used to need hand-coded extractors, about 4 weeks each. Now Generator, Verifier and Coordinator agents draft the config in minutes, and 1 to 2 days of testing gets a source live. Built for 250+ legal data sources, with a SQL Server job queue behind it.',
    stats: [['Delivery', '4 wks > under 2 days'], ['Match vs ground truth', '90%+'], ['Sources', '250+']],
    stack: ['C#', 'ASP.NET Core', 'SQL Server', 'LLM agents'],
    diff: ['+ Generator, Verifier and Coordinator agents', '+ refine loop per section, whole config re-scored', '+ Need Human fallback: a person is emailed, the rest ships', '+ job queue: one run at a time, duplicate requests merge'] },
  { lane: 'T', tag: 'feat', ver: '3.1.0', year: '2023-now', title: 'Build the AI gateway microservice',
    body: 'Apps call one gateway instead of the models. It gives each app a key, checks upstream limits, tries models in a set order, pauses failing ones with a circuit breaker, and caches large prompts. Used by 4+ applications.',
    stats: [['Cached input tokens', '~90% cheaper'], ['Applications', '4+']], stack: ['C#', 'ASP.NET Core', 'Azure AI Foundry'],
    diff: ['+ ordered model fallback, never silent', '+ circuit breaker with one-probe recovery', '+ 5-minute prompt caching', '+ one audit log for every attempt'] },
  { lane: 'T', tag: 'release', ver: '3.2.0', year: 'Sep 2025', title: 'Recognised as Project Key Contributor at Cognizant',
    body: 'Awarded for designing and leading development of the AI-powered config generation system.',
    stats: [['Award', 'Project Key Contributor']], stack: [] },
  { lane: 'T', tag: 'release', ver: '4.0.0', year: 'Jul 2026', title: 'Earn Anthropic certifications',
    body: 'Claude Certified Architect - Foundations, and Claude Code in Action: production LLM application architecture and AI-assisted development with coding agents.',
    stats: [['Certs', '2'], ['Issuer', 'Anthropic']], stack: [] },
];

const tagStyle: Record<Tag, string> = { feat: ACCENT, perf: '#a3e635', fix: '#fbbf24', chore: '#6b7280', release: '#ffffff' };
const last = commits[commits.length - 1];

function Rail({ i, head }: { i: number; head: number }) {
  const c = commits[i];
  const prev = commits[i - 1];
  const isBranch = c.lane === 'B';
  const mergeRow = prev && prev.lane === 'B'; // merge curve arrives at this trunk commit
  const reached = head >= i;
  const x = isBranch ? BRANCH_X : TRUNK_X;
  return (
    <svg className="absolute left-0 top-0 h-full" width="96" aria-hidden="true">
      <line x1={TRUNK_X} y1={i === 0 ? DOT_Y : 0} x2={TRUNK_X} y2={i === commits.length - 1 ? DOT_Y : '100%'} stroke={ACCENT} strokeOpacity="0.45" strokeWidth="2" />
      {isBranch && (
        <>
          <path d={`M${TRUNK_X} 0 C${TRUNK_X} 22 ${BRANCH_X} 8 ${BRANCH_X} ${DOT_Y}`} fill="none" stroke={ACCENT} strokeOpacity="0.45" strokeWidth="2" />
          <line x1={BRANCH_X} y1={DOT_Y} x2={BRANCH_X} y2="100%" stroke={ACCENT} strokeOpacity="0.45" strokeWidth="2" />
        </>
      )}
      {mergeRow && <path d={`M${BRANCH_X} 0 C${BRANCH_X} 18 ${TRUNK_X} 10 ${TRUNK_X} ${DOT_Y}`} fill="none" stroke={ACCENT} strokeOpacity="0.45" strokeWidth="2" />}
      {head === i && <circle cx={x} cy={DOT_Y} r="13" fill={ACCENT} opacity="0.25" className="animate-ping" style={{ transformOrigin: `${x}px ${DOT_Y}px` }} />}
      <circle cx={x} cy={DOT_Y} r={c.tag === 'release' ? 9 : 7} fill={reached ? ACCENT : '#111827'} stroke={ACCENT} strokeWidth="2.5" />
    </svg>
  );
}

function Card({ c, isOpen, isHead, onToggle }: { c: Commit; isOpen: boolean; isHead: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border bg-gray-900/70 backdrop-blur" style={{ borderColor: isHead ? ACCENT : '#1f2937' }}>
      <button onClick={onToggle} aria-expanded={isOpen} className="w-full text-left p-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ color: '#000', background: tagStyle[c.tag] }}>{c.tag}</span>
        <span className="font-semibold text-sm text-white">{c.title}</span>
        <span className="ml-auto text-[11px] font-mono text-gray-500">v{c.ver} / {c.year}</span>
        {c.branch && <span className="basis-full text-[11px] font-mono" style={{ color: ACCENT }}>branch: {c.branch}, merged</span>}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-3">
              <p className="text-sm text-gray-300">{c.body}</p>
              {c.stats.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {c.stats.map(([k, v]) => (
                    <span key={k} className="text-[11px] font-mono px-2 py-1 rounded border border-gray-700 text-gray-300">
                      {k}: <span style={{ color: ACCENT }}>{v}</span>
                    </span>
                  ))}
                </div>
              )}
              {c.diff && (
                <div>
                  <pre className="text-xs font-mono rounded-lg bg-black/60 border border-gray-800 p-3 overflow-x-auto">
                    {c.diff.map((l, k) => (
                      <div key={k} style={{ color: l[0] === '+' ? ACCENT : l[0] === '-' ? '#f87171' : '#6b7280' }}>{l}</div>
                    ))}
                  </pre>
                  <p className="text-[10px] text-gray-600 mt-1">illustrative diff</p>
                </div>
              )}
              {c.stack.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {c.stack.map((s) => <span key={s} className="text-[11px] px-2 py-0.5 rounded-full text-black font-medium" style={{ background: ACCENT }}>{s}</span>)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimeLine() {
  const [cmd, setCmd] = useState('start-my-journey --year=2019');
  const [log, setLog] = useState('Ready. Press Enter to deploy.');
  const [running, setRunning] = useState(false);
  const [head, setHead] = useState(-1);
  const [open, setOpen] = useState(-1);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const cancelled = useRef(false);
  useEffect(() => () => { cancelled.current = true; }, []);

  const run = async () => {
    if (running) return;
    if (!cmd.trim().startsWith('start-my-journey')) { setLog(`command not found: ${cmd.trim().split(' ')[0] || '(empty)'}`); return; }
    const m = cmd.match(/--year=(\d{4})/);
    const year = m ? Number(m[1]) : 2019;
    const start = commits.findIndex((c) => parseInt(c.year.match(/\d{4}/)?.[0] ?? '0', 10) >= year);
    if (start < 0) { setLog(`no commits found for year ${year}`); return; }

    cancelled.current = false;
    setRunning(true);
    for (let i = start; i < commits.length; i++) {
      const c = commits[i];
      setHead(i);
      setOpen(i);
      setLog(`deploying v${c.ver}  ${c.title}`);
      rows.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(2400);
      if (cancelled.current) return;
    }
    setLog(`Release v${last.ver} deployed. Welcome to production.`);
    setRunning(false);
  };

  return (
    <section id="timeline" className="relative min-h-screen py-20 px-4 sm:px-8 overflow-hidden text-white">
      {/* perspective grid floor */}
      <div className="absolute inset-x-0 top-0 h-[420px] pointer-events-none opacity-40" aria-hidden="true"
        style={{
          backgroundImage: 'linear-gradient(rgba(58,191,0,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(58,191,0,.28) 1px, transparent 1px)',
          backgroundSize: '48px 48px', transform: 'perspective(500px) rotateX(62deg)', transformOrigin: 'top',
          maskImage: 'linear-gradient(black, transparent)', WebkitMaskImage: 'linear-gradient(black, transparent)',
        }} />

      <div className="relative mx-auto max-w-3xl">
        <p className="font-mono text-xs tracking-widest mb-2" style={{ color: ACCENT }}>DEPLOYMENT CONSOLE</p>
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl mb-6" style={{ color: ACCENT }}>Release History</h2>

        {/* terminal */}
        <div className="rounded-xl border border-gray-800 bg-gray-950/90 backdrop-blur p-4 mb-10 font-mono text-sm">
          <label className="flex items-center gap-2">
            <span style={{ color: ACCENT }}>&gt;</span>
            <input value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()}
              disabled={running} spellCheck={false} aria-label="Console command"
              className="flex-1 bg-transparent outline-none text-white disabled:opacity-60" />
            <button onClick={run} disabled={running} className="px-3 py-1 rounded text-xs font-semibold text-black disabled:opacity-50" style={{ background: ACCENT }}>
              {running ? 'Running' : 'Run'}
            </button>
          </label>
          <p className="mt-3 text-xs text-gray-400">{log}</p>
          <p className="mt-1 text-[11px] text-gray-600">Try: start-my-journey --year=2023</p>
        </div>

        {/* git graph */}
        <div>
          {commits.map((c, i) => (
            <div key={i} ref={(el) => { rows.current[i] = el; }} className="relative pl-[104px] pb-4">
              <Rail i={i} head={head} />
              <Card c={c} isOpen={open === i} isHead={head === i} onToggle={() => setOpen(open === i ? -1 : i)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TimeLine;
