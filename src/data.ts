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
  'pgvector', 'LangChain4j', 'Azure AI Foundry', 'Docker', 'Azure DevOps',
];

export const stats: [string, string][] = [
  ['3 yrs', 'At Cognizant (nearly)'],
  ['250+', 'Legal data sources automated'],
  ['4 wks > 2 days', 'New-source delivery time'],
  ['90%', 'Cached-input token cost cut (approx.)'],
];

export const projects: Project[] = [
  {
    id: 'config-pipeline', name: 'AI Config Pipeline', icon: 'bot', period: 'Cognizant / LexisNexis', badge: 'MULTI-AGENT',
    headline: 'AI agents that write document-parsing configs',
    subtitle: 'Every court website needs a parser config. Engineers used to hand-code them. Now agents draft and test them.',
    metric: { value: '4 wks > 2 days', label: 'per new source, at 90%+ match against ground truth' },
    points: [
      'The problem: each new court website (HTML, XML or JSON) needed line-by-line extraction code, about 4 weeks to get one source into production.',
      'Three parts work together. The Generator proposes extraction selectors for one section of a document. The Verifier runs them through the real parser on a sample and reports pass, fail with feedback, or needs a human. The Coordinator decides what happens next.',
      'Each section loops generate, check, refine (up to 10 turns). The whole config is then scored and any failing section is re-run (up to 3 attempts).',
      'Accuracy is measured against ground truth, which a purpose-built prompt extracts from the sample document first. The score is content-aware, with an acceptance threshold set per run (95 for JSON).',
      'Sections the agents cannot fix are marked Need Human, a person is emailed, and the rest of the config is still delivered.',
      'A config now generates in minutes and takes 1 to 2 days to test, which is where the 4 weeks to under 2 days comes from. Built for 250+ legal data sources.',
      'Job queue on SQL Server: one generation at a time (one AI credential, one token budget), repeat requests for the same court merge into one row, and a crashed service cannot block the queue because its claim fails after a timeout.',
      'Recognised as Project Key Contributor (Sep 2025) for designing and leading the system.',
    ],
    stack: ['C#', 'ASP.NET Core', 'SQL Server', 'LLM agents', 'Azure AI Foundry'],
    repo: '',
  },
  {
    id: 'ai-gateway', name: 'AI Gateway', icon: 'network', period: 'Cognizant / LexisNexis', badge: 'MICROSERVICE',
    headline: 'One gateway for every AI model call',
    subtitle: 'Apps call my gateway instead of the models. It handles keys, limits, fallback, health and caching.',
    metric: { value: '~90%', label: 'cheaper cached input tokens with prompt caching' },
    points: [
      'Why a gateway: one upstream credential, one key per application, and a single audit log of every attempt. Each call is checked against the upstream limits before it is sent.',
      'Models are tried in a set order, for example Opus first and Sonnet as the fallback. The default and the fallbacks are configurable, and new models can be added.',
      'A fallback is never silent. It is logged and flagged on the response.',
      'Circuit breaker: a rate limit trips it at once, an overloaded model is paused for 15 seconds, and other errors trip it when half of the last 20 calls failed. After a pause, one probe request decides whether it closes again.',
      'Prompt caching: the caller marks a large, unchanging prompt and keeps it identical. Repeat calls within 5 minutes reuse it, which cuts cached-input token cost by about 90%.',
      'Used by 4+ applications today. Try the simulator below to see the fallback and circuit breaker at work.',
    ],
    stack: ['C#', 'ASP.NET Core', 'Microsoft.Extensions.AI', 'Azure AI Foundry', 'Claude'],
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
