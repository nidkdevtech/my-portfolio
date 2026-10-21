// src/data.ts: single source of truth, taken from the resume
export type Project = {
  id: string; name: string; icon: string; period: string; badge: string;
  headline: string; subtitle: string;
  metric: { value: string; label: string };
  points: string[]; stack: string[]; repo: string;
};

export const profile = {
  name: 'Nidhish Kumar Singh',
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
  'Java', 'Spring Boot', 'Spring Security', 'C#', 'React.js', 'JavaScript', 'SQL Server', 'PostgreSQL',
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
    headline: 'Multi-agent pipeline that writes document-parsing configs',
    subtitle: 'Generator and Verifier agents replace hand-written extraction code across 250+ legal data sources',
    metric: { value: '4 wks > 2 days', label: 'new-source delivery time, at 90%+ accuracy' },
    points: [
      'Architected a multi-agent AI pipeline (Generator + Verifier agents) that auto-generates document-parsing configurations.',
      'Replaced hand-written extraction code across 250+ legal data sources.',
      'Cut new-source delivery from 4 weeks to under 2 days at 90%+ accuracy.',
      'Designed a durable job queue on SQL Server with a dedicated worker service: safe job claiming across instances, automatic recovery of abandoned jobs, and quality and token tracking per request.',
      'Recognised as Project Key Contributor (Sep 2025) for designing and leading development of the system.',
    ],
    stack: ['Java', 'Spring Boot', 'SQL Server', 'LLM agents', 'Azure AI Foundry'],
    repo: '',
  },
  {
    id: 'ai-gateway', name: 'AI Gateway', icon: 'network', period: 'Cognizant / LexisNexis', badge: 'MICROSERVICE',
    headline: 'One gateway in front of multiple LLM providers',
    subtitle: 'Priority-based fallback, circuit-breaker health checks and provider-agnostic prompt caching',
    metric: { value: '90%', label: 'approx. cut in cached-input token cost' },
    points: [
      'Built a centralised AI gateway microservice routing across OpenAI, Anthropic and DeepSeek via Azure AI Foundry.',
      'Priority-based fallback with circuit-breaker health checks, so a failing provider is skipped automatically.',
      'Provider-agnostic prompt caching that cut cached-input token cost by ~90%.',
      'Used by 4+ consumer applications. Try the simulator below to see the fallback logic.',
    ],
    stack: ['Java', 'Spring Boot', 'Azure AI Foundry', 'OpenAI', 'Anthropic', 'DeepSeek'],
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
