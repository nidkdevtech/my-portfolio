// src/data.ts: single source of truth, taken from the resume
export type Project = {
  id: string; name: string; icon: string; period: string; badge: string;
  headline: string; subtitle: string;
  metric: { value: string; label: string };
  points: string[]; stack: string[]; repo: string;
};

export const profile = {
  name: 'Nidhish Singh',
  firstName: 'Nidhish',
  initials: 'NS',
  role: 'Full-Stack Software Engineer',
  company: 'Software Engineer @ Cognizant (client: LexisNexis)',
  location: 'Bengaluru, India',
  email: 'singhnidhishkumar@gmail.com',
  linkedin: 'https://linkedin.com/in/nidhish-kumarsingh',
  github: 'https://github.com/nidkdevtech',
  leetcode: 'https://leetcode.com/u/Nidhish986',
  resume: `${import.meta.env.BASE_URL}resume.pdf`, // PDF lives at public/resume.pdf
};

export const skills = [
  'Java', 'Spring Boot', 'Spring Security', 'C#', 'ASP.NET Core', 'React.js', 'JavaScript', 'SQL Server', 'PostgreSQL',
  'pgvector', 'LangChain4j', 'Docker', 'Azure DevOps',
];

export const stats: [string, string][] = [
  ['3 yrs', 'At Cognizant (nearly)'],
  ['250+', 'Legal data sources automated'],
  ['4 wks > 2 days', 'New-source delivery time'],
  ['0.1x', 'Cached-input read price (opt-in)'],
];

export const projects: Project[] = [
  {
    id: 'config-pipeline', name: 'AI Config Pipeline', icon: 'bot', period: 'Cognizant / LexisNexis', badge: 'MULTI-AGENT',
    headline: 'Multi-agent pipeline that writes document-parsing configs',
    subtitle: 'A Generator proposes, a Verifier tests the result on a real sample, and a Coordinator decides what happens next',
    metric: { value: '4 wks > 2 days', label: 'new-source delivery time, across 250+ legal data sources' },
    points: [
      'Replaced hand-written extraction code for 250+ legal data sources. New-source delivery went from 4 weeks to under 2 days, at 90%+ accuracy.',
      'The Generator proposes extraction selectors for one section of a document. The Verifier runs them through the real parser on a sample document and answers: pass, fail with feedback, or needs a human.',
      'Two loops: for each section it generates, checks and refines for up to 10 turns. Then the whole config is scored, and any section that still fails is re-run, up to 3 outer attempts.',
      'Accuracy is scored against a ground truth the AI first extracts from the sample document, with an acceptance threshold set per run (95 for JSON). A section it cannot fix is marked Needs Human and a person is emailed, while the rest of the config is still produced.',
      'Built the job queue on SQL Server: one generation at a time (one AI credential and token budget), repeat requests for the same source merge into one row, and a crashed worker\'s claim times out so it cannot block the rest. Without that guard, one case looped 414 times in a day.',
    ],
    stack: ['C#', 'ASP.NET Core', 'SQL Server', 'LLM agents'],
    repo: '',
  },
  {
    id: 'ai-gateway', name: 'AI Gateway', icon: 'network', period: 'Cognizant / LexisNexis', badge: 'MICROSERVICE',
    headline: 'One gateway in front of the LLM, with fallback and a circuit breaker',
    subtitle: 'An ASP.NET Core service between applications and the client\'s upstream GenAI gateway',
    metric: { value: '0.1x', label: 'price of a cached-input read vs normal input (opt-in per request)' },
    points: [
      'One upstream credential, one key per application. Each call is checked against the upstream\'s real limits before it is sent, and every attempt goes into one audit log.',
      'Models are tried in order (a primary, then a fallback). A fallback is never silent: it is logged and flagged on the response.',
      'Circuit breaker: a rate limit trips it at once, an "overloaded" error pauses that model for 15s, and other errors trip it when half of the last 20 calls failed (never before 10 calls). After the pause, exactly one probe request decides whether it closes.',
      'Prompt caching is opt-in: the caller marks a large, unchanging prompt and keeps everything above the marker identical. A cache read costs 0.1x and a write 1.25x of normal input price. Try the simulator below.',
    ],
    stack: ['C#', 'ASP.NET Core', 'Microsoft.Extensions.AI', 'Circuit breaker', 'Prompt caching', 'Audit logging'],
    repo: '',
  },
  {
    id: 'resumatch', name: 'ResuMatch', icon: 'search', period: 'Personal project', badge: 'RAG',
    headline: 'AI-powered job recommendation engine',
    subtitle: 'Semantic resume-to-job matching across 1,100+ real job listings',
    metric: { value: '1,100+', label: 'real job listings matched with vector similarity' },
    points: [
      'End-to-end RAG pipeline with LangChain4j and pgvector, replacing keyword search with vector similarity.',
      'Provider-agnostic embedding layer (Ollama and OpenAI) switched by configuration using the Strategy pattern, with zero code changes.',
      'Hybrid search combining pgvector cosine similarity with SQL filters and window functions, so each job appears exactly once.',
      'Groq LLaMA 3 match explanations with batched prompts (5 jobs per call) to use the context window efficiently.',
    ],
    stack: ['Java', 'Spring Boot', 'LangChain4j', 'PostgreSQL', 'pgvector', 'Ollama', 'Groq', 'React.js', 'Docker'],
    repo: 'https://github.com/nidkdevtech/resumatch',
  },
  {
    id: 'expense', name: 'Smart Expense Tracker', icon: 'wallet', period: 'Personal project', badge: 'FULL-STACK',
    headline: 'Expense tracker with payments and AI insights',
    subtitle: 'Spring Security, Stripe subscriptions and LLM-written monthly summaries',
    metric: { value: 'JWT + RBAC', label: 'USER / ADMIN access on every endpoint' },
    points: [
      'JWT authentication with Spring Security and role-based access control (USER / ADMIN) on all API endpoints.',
      'Stripe subscriptions: webhook handling, payment history, and premium features gated on subscription status.',
      'Groq LLaMA 3 via an OpenAI-compatible API to generate personalised monthly financial insights from categorised spending.',
    ],
    stack: ['Java', 'Spring Boot', 'Spring Security', 'PostgreSQL', 'Stripe', 'Groq', 'React.js'],
    repo: 'https://github.com/nidkdevtech/SmartExpenseTracker',
  },
  {
    id: 'platform', name: 'Platform Work', icon: 'layers', period: 'Cognizant / LexisNexis', badge: 'BACKEND',
    headline: 'Modernisation, security and internal tooling',
    subtitle: 'Java 17 migration, OAuth2 SSO, an engineering dashboard and database automation',
    metric: { value: '250+', label: 'SQL Server instances under automated monitoring' },
    points: [
      'Upgraded a legacy Spring Boot application from Java 7 to Java 17 across 12 modules (Streams, lambdas, Optional), cutting boilerplate by roughly a third and removing a recurring class of null-pointer defects.',
      'Implemented OAuth2 single sign-on with stateless JWT authentication and role-based access on every endpoint that handles personal user data.',
      'Built a React + Spring Boot dashboard over Azure DevOps APIs for ticket throughput and SLA compliance, reducing reporting overhead by 40%.',
      'Built a database automation platform monitoring 250+ SQL Server instances with health checks and anomaly detection, reducing manual DBA work by 40%.',
    ],
    stack: ['Java 17', 'Spring Boot', 'Spring Security', 'OAuth2', 'React.js', 'SQL Server', 'Azure DevOps'],
    repo: '',
  },
];
