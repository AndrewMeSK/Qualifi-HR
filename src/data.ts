export type RequirementImportance = 'mandatory' | 'important' | 'preferred' | 'nice-to-have';
export type EvidenceStrength = 'strong' | 'moderate' | 'none';
export type CandidateStatus =
  | 'processing' | 'matched' | 'reviewed' | 'selected'
  | 'assessment-draft' | 'assessment-approved' | 'assessment-sent'
  | 'assessment-completed' | 'verified' | 'processing-failed';
export type AssessmentStatus = 'none' | 'generating' | 'draft' | 'approved' | 'sent' | 'opened' | 'completed' | 'evaluated';
export type ProfileStatus = 'draft' | 'ai-conversation' | 'ready-for-review' | 'approved' | 'active';

export interface Requirement {
  id: string;
  name: string;
  category: 'technical' | 'experience' | 'soft';
  importance: RequirementImportance;
  weight: number;
  description: string;
}

export interface Evidence {
  requirementId: string;
  strength: EvidenceStrength;
  quote: string;
  source: string;
}

export interface AssessmentQuestion {
  id: string;
  skill: string;
  question: string;
  cvClaim: string;
  answer?: string;
  score?: number;
  feedback?: string;
}

export interface Assessment {
  id: string;
  questions: AssessmentQuestion[];
  status: AssessmentStatus;
  skillScores?: Record<string, number>;
  overallScore?: number;
  timeLimit: number;
  difficulty: 'standard' | 'advanced';
  sentAt?: string;
  completedAt?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  currentRole: string;
  company: string;
  location: string;
  cvMatchScore: number;
  verifiedSkillScore: number | null;
  assessmentScore: number | null;
  status: CandidateStatus;
  assessmentStatus: AssessmentStatus;
  skills: string[];
  experience: string;
  evidence: Evidence[];
  assessment?: Assessment;
  resumeUrl?: string;
  resumeFileName?: string;
}

export interface PositionProfile {
  id: string;
  title: string;
  seniority: string;
  location: string;
  employmentType: string;
  status: ProfileStatus;
  requirements: Requirement[];
  threshold: number;
  candidates: Candidate[];
  lastUpdated: string;
  createdAt: string;
  description?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const backendRequirements: Requirement[] = [
  { id: 'r1', name: 'Python', category: 'technical', importance: 'mandatory', weight: 5, description: 'Strong Python development experience in production systems' },
  { id: 'r2', name: 'Django', category: 'technical', importance: 'mandatory', weight: 4, description: 'Production Django application development including APIs and background tasks' },
  { id: 'r3', name: 'AWS', category: 'technical', importance: 'preferred', weight: 3, description: 'Cloud deployment and infrastructure on AWS; equivalent cloud experience considered' },
  { id: 'r4', name: 'PostgreSQL', category: 'technical', importance: 'important', weight: 3, description: 'Advanced PostgreSQL including schema design and query optimisation' },
  { id: 'r5', name: 'System Design', category: 'technical', importance: 'important', weight: 3, description: 'Distributed systems and architecture design at scale' },
  { id: 'r6', name: '6+ Years Backend', category: 'experience', importance: 'mandatory', weight: 2, description: 'At least 6 years of professional backend engineering experience' },
];

const omarAssessment: Assessment = {
  id: 'a-omar',
  status: 'evaluated',
  timeLimit: 45,
  difficulty: 'advanced',
  sentAt: '2026-08-28T10:00:00Z',
  completedAt: '2026-08-28T11:23:00Z',
  overallScore: 58,
  skillScores: { Python: 52, Django: 54, 'System Design': 51, AWS: 71 },
  questions: [
    {
      id: 'q1', skill: 'Django',
      cvClaim: 'Led development of Django REST API serving 2M+ daily requests',
      question: 'Your CV describes leading the development of a Django REST API at 2M+ daily requests. Walk through the primary architectural bottlenecks you encountered at that scale and the specific changes you made to address them.',
      answer: 'We used Redis caching and added more servers for horizontal scaling. We also used a CDN for static files to reduce load.',
      score: 42,
      feedback: 'Response lacks architectural depth. No discussion of Django-specific bottlenecks such as ORM N+1 queries, connection pooling, or async task offloading. Caching and scaling are mentioned but not substantiated with any specifics or outcomes. Inconsistent with the level of ownership claimed.'
    },
    {
      id: 'q2', skill: 'Python',
      cvClaim: '8+ years Python including performance-critical data pipelines',
      question: 'Describe a concrete scenario where you diagnosed and resolved a Python performance bottleneck in a production system. What profiling tools did you use, what did you discover, and what was the measurable outcome?',
      answer: 'I used print statements and timing to identify slow parts of the code. Then I rewrote the loops to be more efficient and it ran faster.',
      score: 38,
      feedback: 'Concerning. No mention of professional profiling tools (cProfile, py-spy, line_profiler, Scalene). "Print statements and timing" for production performance diagnostics indicates limited systematic debugging experience. The claim of performance-critical pipelines appears unsupported by this response.'
    },
    {
      id: 'q3', skill: 'System Design',
      cvClaim: 'Designed microservices architecture for e-commerce order management platform',
      question: 'For the microservices architecture you designed, explain how you handled inter-service communication and what specific trade-offs you considered between synchronous and asynchronous messaging patterns.',
      answer: 'We used REST APIs between services and a message queue for some things like notifications. Async was better for things that could wait.',
      score: 55,
      feedback: "Candidate is aware of the pattern but unable to articulate concrete design decisions. No mention of specific technologies (Kafka, RabbitMQ, SQS), failure handling strategies, consistency trade-offs, or what drove the synchronous vs asynchronous decision for specific service interactions."
    },
    {
      id: 'q4', skill: 'AWS',
      cvClaim: 'Deployed services on AWS EC2, S3, CloudFront, and RDS',
      question: 'Describe a situation where an AWS service failure impacted your application. How did you design the system for resilience in response, and what monitoring did you put in place?',
      answer: 'We had an EC2 instance go down once. We set up auto-scaling groups after that and put things in multiple availability zones so it would be more reliable.',
      score: 71,
      feedback: 'Adequate response. Demonstrates basic AWS resilience concepts (ASGs, multi-AZ). Could have gone deeper on monitoring strategy, alerting thresholds, runbooks, or RDS multi-AZ configuration — but this is plausible operational experience.'
    },
  ]
};

const sarahAssessment: Assessment = {
  id: 'a-sarah',
  status: 'evaluated',
  timeLimit: 45,
  difficulty: 'advanced',
  sentAt: '2026-08-25T09:00:00Z',
  completedAt: '2026-08-25T10:18:00Z',
  overallScore: 91,
  skillScores: { Python: 94, Django: 91, 'System Design': 96, AWS: 88 },
  questions: [
    {
      id: 'q1', skill: 'Django',
      cvClaim: 'Built real-time data pipeline using Django Channels and Celery serving 50k concurrent users',
      question: "Your CV describes building a real-time pipeline at 50k concurrent connections. Explain the key trade-offs you considered when choosing between WebSocket and long-polling for this use case.",
      answer: "At 50k concurrent connections we needed sub-200ms updates which polling couldn't reliably achieve — so WebSockets were the right call for latency. The primary cost was infrastructure complexity: Django Channels requires Redis as a channel layer, which added operational overhead and a new failure point. We benchmarked long-polling at 2s intervals and found the HTTP overhead was creating backpressure on our Django ORM connection pool around 30k concurrent clients. We implemented WebSockets with an automatic polling fallback for clients behind restrictive corporate firewalls, using exponential backoff to avoid thundering herd if the WebSocket cluster had issues during a deploy.",
      score: 94,
      feedback: 'Exceptional. Demonstrates real architectural decision-making at scale. Mentions specific technologies, quantified trade-offs with actual numbers, and proactively considered an edge case (corporate firewalls) that signals genuine production experience rather than theoretical knowledge.'
    },
    {
      id: 'q2', skill: 'System Design',
      cvClaim: 'Architected event-driven order processing system handling 15k orders/day',
      question: 'Describe the most complex consistency challenge you faced in designing the event-driven order system and how you resolved it.',
      answer: "The hardest problem was the payment → inventory → fulfilment chain. If payment succeeded but inventory reservation failed we had a partial transaction needing cleanup. We used an outbox pattern: payment writes an event to a local outbox table within the same DB transaction, a separate poller publishes to Kafka, and downstream services carry idempotency keys. The inventory service only decrements stock on first processing of a given event ID. This gave us eventual consistency with a recovery path rather than relying on distributed transactions, which would have been fragile under network partitions. We chose at-least-once delivery plus idempotency over exactly-once guarantees because the former is achievable without sacrificing throughput — exactly-once at our scale would have required either 2PC or significant coordination overhead.",
      score: 96,
      feedback: 'Exceptional. Outbox pattern, Kafka, idempotency keys, at-least-once vs exactly-once trade-offs — all explained clearly with genuine design reasoning. Candidate understands the limitations of distributed transactions and has an articulate position on why they made the choices they did.'
    },
    {
      id: 'q3', skill: 'Python',
      cvClaim: 'Performance-critical Python data processing pipeline (500k records/batch)',
      question: 'Walk through how you profiled and optimised your batch processing pipeline. What tooling did you use and what was the most surprising bottleneck you found?',
      answer: "Started with py-spy attached to a production-like staging run to get a flamegraph. The top hotspot wasn't the processing logic — it was repeated SQLAlchemy ORM instantiation inside the inner loop. Each record was triggering a query and deserializing a full model object even though we only needed three fields. Rewrote that section using Core-level select statements with yield_per to stream the cursor rather than loading the entire result set into memory. Throughput went from ~40k records/minute to ~310k. The second bottleneck was JSON serialization — replaced stdlib json with orjson and got another 15% on that step.",
      score: 94,
      feedback: 'Strong answer. Py-spy, SQLAlchemy Core vs ORM, cursor streaming with yield_per, orjson — these are specific, correct, and indicate hands-on experience with real Python performance work.'
    },
  ]
};

const marcusAssessment: Assessment = {
  id: 'a-marcus',
  status: 'evaluated',
  timeLimit: 45,
  difficulty: 'standard',
  sentAt: '2026-08-29T14:00:00Z',
  completedAt: '2026-08-29T15:10:00Z',
  overallScore: 81,
  skillScores: { Python: 84, Django: 82, 'System Design': 77, PostgreSQL: 81 },
  questions: [
    {
      id: 'q1', skill: 'Django',
      cvClaim: 'Built multi-tenant SaaS platform on Django serving enterprise clients',
      question: 'Describe how you implemented multi-tenancy in your Django SaaS platform — schema isolation, row-level security, or a shared schema approach? What drove that decision?',
      answer: "We used a shared schema with a tenant_id column on all relevant tables. Schema-per-tenant was evaluated but would have made migrations extremely painful — we had 200+ tenants by the time we launched and couldn't manage 200 separate schema migrations. Row-level security in Postgres was appealing but we wanted the isolation logic in the application layer where it was easier to test. We used a custom middleware to inject the tenant context and a base queryset manager that always applied the tenant_id filter automatically. The main risk was developer error — forgetting to use the custom manager — so we added a test that checked all queries hit the tenant filter.",
      score: 88,
      feedback: 'Good answer. Clear decision rationale, mentions the trade-offs across all three approaches, and importantly mentions the developer error risk and how they mitigated it with automated testing. Demonstrates real product thinking.'
    },
    {
      id: 'q2', skill: 'System Design',
      cvClaim: 'Led backend architecture for financial reporting system with compliance requirements',
      question: 'What were the most challenging audit and compliance requirements in your financial reporting system, and how did they influence your architectural decisions?',
      answer: "The audit trail requirement was the most impactful — every state change needed to be immutable and attributable to a specific user. We used append-only event tables rather than updating records in place. The compliance team also required that we could reproduce the exact state of any report at any point in time, which meant we couldn't do soft deletes. PostgreSQL's BRIN indexes were useful for the time-series queries on the event tables. For data retention we implemented tiered storage — hot data in Postgres, warm in S3 with Parquet, cold compressed in Glacier.",
      score: 79,
      feedback: 'Solid answer. Append-only events, immutable audit trail, and tiered storage are all appropriate choices. Could have gone further on access control patterns and how they handled sensitive data encryption at rest, but the answer demonstrates experience with compliance-driven design.'
    },
  ]
};

const elenaAssessment: Assessment = {
  id: 'a-elena',
  status: 'draft',
  timeLimit: 45,
  difficulty: 'advanced',
  overallScore: undefined,
  skillScores: undefined,
  questions: [
    {
      id: 'q1', skill: 'Python',
      cvClaim: 'Led Python backend team delivering high-throughput data ingestion service processing 10M events/day',
      question: 'Your CV mentions leading the delivery of a high-throughput Python data ingestion service. Describe the concurrency model you chose and why — threading, multiprocessing, asyncio, or a hybrid approach?',
      answer: undefined, score: undefined, feedback: undefined
    },
    {
      id: 'q2', skill: 'Django',
      cvClaim: 'Built Django API platform with complex permission model for enterprise clients',
      question: "Describe the most complex permission model you've implemented in Django. How did you structure it, and what were the performance implications at scale?",
      answer: undefined, score: undefined, feedback: undefined
    },
    {
      id: 'q3', skill: 'System Design',
      cvClaim: 'Designed event-driven notification system',
      question: "Walk through the reliability challenges in your event-driven notification system. How did you handle duplicate delivery, ordering guarantees, and failed notification retries?",
      answer: undefined, score: undefined, feedback: undefined
    },
    {
      id: 'q4', skill: 'AWS',
      cvClaim: 'Managed AWS infrastructure for production systems',
      question: 'Describe how you approached cost optimisation on AWS. What tooling or strategies did you use and what was the outcome?',
      answer: undefined, score: undefined, feedback: undefined
    },
  ]
};

export const initialPositions: PositionProfile[] = [
  {
    id: 'pos-1',
    title: 'Senior Backend Engineer',
    seniority: 'Senior',
    location: 'London, UK (Hybrid)',
    employmentType: 'Full-time',
    status: 'active',
    requirements: backendRequirements,
    threshold: 80,
    lastUpdated: '2026-09-06T14:30:00Z',
    createdAt: '2026-08-20T09:00:00Z',
    description: 'Python/Django backend engineer to lead API development and scale our core platform.',
    candidates: [
      {
        id: 'c-sarah', name: 'Sarah Chen', email: 'sarah.chen@email.com',
        currentRole: 'Staff Backend Engineer', company: 'Stripe', location: 'London, UK',
        cvMatchScore: 92, verifiedSkillScore: 91, assessmentScore: null,
        status: 'verified', assessmentStatus: 'evaluated',
        experience: '9 years',
        skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Redis', 'AWS', 'Kafka', 'System Design'],
        evidence: [
          { requirementId: 'r1', strength: 'strong', quote: '9 years of Python across fintech and infrastructure, including async frameworks, data pipelines, and performance-critical systems.', source: 'Professional Summary' },
          { requirementId: 'r2', strength: 'strong', quote: 'Built real-time data pipeline using Django Channels and Celery serving 50k concurrent users. Led Django API migration to v4 with zero downtime.', source: 'Experience — Stripe' },
          { requirementId: 'r3', strength: 'strong', quote: 'Managed AWS infrastructure including Lambda, ECS, RDS, and SQS. Achieved 40% cost reduction through right-sizing and Spot Instance adoption.', source: 'Experience — Stripe' },
          { requirementId: 'r4', strength: 'strong', quote: 'Deep PostgreSQL experience: partitioning strategy for 3TB table, custom GIN indexes for search, pg_stat_statements for query analysis.', source: 'Technical Skills' },
          { requirementId: 'r5', strength: 'strong', quote: 'Architected event-driven order processing system handling 15k orders/day using outbox pattern and Kafka. Resolved distributed transaction consistency challenges.', source: 'Project — Order Platform' },
          { requirementId: 'r6', strength: 'strong', quote: '9 years of professional backend engineering experience across high-growth startups and public companies.', source: 'Professional Summary' },
        ],
        assessment: sarahAssessment,
      },
      {
        id: 'c-omar', name: 'Omar Khalid', email: 'omar.khalid@email.com',
        currentRole: 'Senior Backend Developer', company: 'TechCorp International', location: 'London, UK',
        cvMatchScore: 96, verifiedSkillScore: 58, assessmentScore: null,
        status: 'verified', assessmentStatus: 'evaluated',
        experience: '9 years',
        skills: ['Python', 'Django', 'REST APIs', 'PostgreSQL', 'AWS', 'Redis', 'Docker'],
        evidence: [
          { requirementId: 'r1', strength: 'strong', quote: '8+ years of Python development across financial services and e-commerce platforms, including async frameworks and performance-critical data pipelines.', source: 'Professional Summary' },
          { requirementId: 'r2', strength: 'strong', quote: 'Led a team delivering a Django REST API serving 2M+ daily requests. Responsible for architecture decisions, performance optimisation, and production deployment.', source: 'Experience — TechCorp' },
          { requirementId: 'r3', strength: 'moderate', quote: 'Deployed services on AWS EC2, S3, and CloudFront. Experience with RDS configuration and basic CloudWatch monitoring.', source: 'Skills Section' },
          { requirementId: 'r4', strength: 'strong', quote: 'Extensive PostgreSQL experience including advanced schema design, indexing strategy, and query optimisation for high-traffic production applications.', source: 'Experience — TechCorp' },
          { requirementId: 'r5', strength: 'moderate', quote: 'Designed microservices architecture for e-commerce order management platform serving 500k users.', source: 'Project Summary' },
          { requirementId: 'r6', strength: 'strong', quote: 'Over 9 years of professional backend development experience across enterprise and startup environments.', source: 'Professional Summary' },
        ],
        assessment: omarAssessment,
      },
      {
        id: 'c-marcus', name: 'Marcus Johnson', email: 'marcus.j@techmail.io',
        currentRole: 'Backend Engineer', company: 'Monzo', location: 'London, UK',
        cvMatchScore: 88, verifiedSkillScore: 81, assessmentScore: null,
        status: 'verified', assessmentStatus: 'evaluated',
        experience: '7 years',
        skills: ['Python', 'Django', 'PostgreSQL', 'Celery', 'Docker', 'GCP'],
        evidence: [
          { requirementId: 'r1', strength: 'strong', quote: '7 years of Python development, primarily in Django and Flask. Led Python 2 to 3 migration across a 200k LOC codebase.', source: 'Professional Summary' },
          { requirementId: 'r2', strength: 'strong', quote: 'Built multi-tenant SaaS platform on Django serving 200+ enterprise clients. Implemented complex permission model and audit logging system.', source: 'Experience — Monzo' },
          { requirementId: 'r3', strength: 'moderate', quote: 'Experience with GCP Cloud Run and Cloud SQL. Limited direct AWS experience but strong cloud fundamentals.', source: 'Skills Section' },
          { requirementId: 'r4', strength: 'strong', quote: 'Advanced PostgreSQL: BRIN indexes for time-series data, custom aggregation functions, partitioning for financial compliance data.', source: 'Technical Skills' },
          { requirementId: 'r5', strength: 'moderate', quote: 'Led backend architecture for financial reporting system with strict audit and compliance requirements.', source: 'Experience — Monzo' },
          { requirementId: 'r6', strength: 'strong', quote: '7 years of professional backend engineering.', source: 'Professional Summary' },
        ],
        assessment: marcusAssessment,
      },
      {
        id: 'c-elena', name: 'Elena Torres', email: 'elena.torres@devmail.co',
        currentRole: 'Lead Backend Engineer', company: 'Deliveroo', location: 'London, UK',
        cvMatchScore: 85, verifiedSkillScore: null, assessmentScore: null,
        status: 'assessment-draft', assessmentStatus: 'draft',
        experience: '8 years',
        skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Kafka', 'AWS', 'Kubernetes'],
        evidence: [
          { requirementId: 'r1', strength: 'strong', quote: '8 years of Python in production — Django, FastAPI, and data engineering with Pandas/Dask. Led Python 3.10+ migration.', source: 'Professional Summary' },
          { requirementId: 'r2', strength: 'strong', quote: 'Built and maintained Django API platform with complex RBAC permission model serving 300+ enterprise clients.', source: 'Experience — Deliveroo' },
          { requirementId: 'r3', strength: 'strong', quote: 'Managed AWS infrastructure: ECS, Lambda, RDS Aurora, SQS, SNS. Implemented blue-green deployments with CodeDeploy.', source: 'Technical Skills' },
          { requirementId: 'r4', strength: 'strong', quote: 'PostgreSQL expert: replication setup, VACUUM tuning, partial indexes, jsonb for semi-structured data.', source: 'Technical Skills' },
          { requirementId: 'r5', strength: 'strong', quote: 'Designed event-driven notification system handling 5M events/day. Evaluated Kafka vs SQS trade-offs for exactly-once delivery requirements.', source: 'Experience — Deliveroo' },
          { requirementId: 'r6', strength: 'strong', quote: '8 years backend engineering, 3 years in a lead capacity.', source: 'Professional Summary' },
        ],
        assessment: elenaAssessment,
      },
      {
        id: 'c-priya', name: 'Priya Patel', email: 'priya.patel@inbox.dev',
        currentRole: 'Senior Python Developer', company: 'HSBC Digital', location: 'London, UK',
        cvMatchScore: 82, verifiedSkillScore: null, assessmentScore: null,
        status: 'assessment-sent', assessmentStatus: 'sent',
        experience: '6 years',
        skills: ['Python', 'Django', 'REST APIs', 'PostgreSQL', 'Azure', 'Docker'],
        evidence: [
          { requirementId: 'r1', strength: 'strong', quote: '6 years Python development in financial services. Specialist in regulatory reporting APIs.', source: 'Professional Summary' },
          { requirementId: 'r2', strength: 'strong', quote: 'Senior developer on core banking API platform built with Django. Developed payment processing modules and compliance reporting.', source: 'Experience — HSBC' },
          { requirementId: 'r3', strength: 'moderate', quote: 'Azure experience (App Service, Azure SQL). Some AWS exposure through personal projects.', source: 'Skills' },
          { requirementId: 'r4', strength: 'strong', quote: 'PostgreSQL in financial reporting context. Experience with schema migrations for compliance requirements.', source: 'Experience — HSBC' },
          { requirementId: 'r5', strength: 'moderate', quote: 'Contributed to architecture decisions for payment processing microservices.', source: 'Experience — HSBC' },
          { requirementId: 'r6', strength: 'strong', quote: '6 years professional backend experience.', source: 'Professional Summary' },
        ],
        assessment: {
          id: 'a-priya', status: 'sent', timeLimit: 45, difficulty: 'standard',
          sentAt: '2026-09-05T11:00:00Z', questions: []
        },
      },
      {
        id: 'c-david', name: 'David Kim', email: 'david.kim@protonmail.com',
        currentRole: 'Backend Developer', company: 'Freelance', location: 'Manchester, UK',
        cvMatchScore: 78, verifiedSkillScore: null, assessmentScore: null,
        status: 'matched', assessmentStatus: 'none',
        experience: '5 years',
        skills: ['Python', 'Flask', 'MySQL', 'AWS EC2', 'Docker'],
        evidence: [
          { requirementId: 'r1', strength: 'strong', quote: '5 years Python. Flask and some Django exposure.', source: 'Professional Summary' },
          { requirementId: 'r2', strength: 'moderate', quote: 'Limited Django experience — used Flask primarily. Completed two Django projects.', source: 'Projects' },
          { requirementId: 'r3', strength: 'moderate', quote: 'AWS EC2 and S3 deployment experience for client projects.', source: 'Skills' },
          { requirementId: 'r4', strength: 'moderate', quote: 'MySQL and some PostgreSQL experience.', source: 'Skills' },
          { requirementId: 'r5', strength: 'none', quote: '', source: '' },
          { requirementId: 'r6', strength: 'strong', quote: '5 years backend development experience.', source: 'Professional Summary' },
        ],
      },
      {
        id: 'c-aisha', name: 'Aisha Williams', email: 'a.williams@email.co.uk',
        currentRole: 'Python Developer', company: 'NHS Digital', location: 'Leeds, UK',
        cvMatchScore: 74, verifiedSkillScore: null, assessmentScore: null,
        status: 'matched', assessmentStatus: 'none',
        experience: '4 years',
        skills: ['Python', 'Django', 'SQLite', 'Docker', 'Linux'],
        evidence: [
          { requirementId: 'r1', strength: 'strong', quote: '4 years Python development in healthcare tech.', source: 'Professional Summary' },
          { requirementId: 'r2', strength: 'strong', quote: 'Django experience in internal NHS reporting tools.', source: 'Experience' },
          { requirementId: 'r3', strength: 'none', quote: '', source: '' },
          { requirementId: 'r4', strength: 'moderate', quote: 'PostgreSQL in NHS internal systems.', source: 'Skills' },
          { requirementId: 'r5', strength: 'none', quote: '', source: '' },
          { requirementId: 'r6', strength: 'moderate', quote: '4 years experience — slightly under the 6-year requirement.', source: 'Professional Summary' },
        ],
      },
      {
        id: 'c-james', name: 'James Murphy', email: null as unknown as string,
        currentRole: 'Unknown', company: 'Unknown', location: 'Unknown',
        cvMatchScore: 0, verifiedSkillScore: null, assessmentScore: null,
        status: 'processing', assessmentStatus: 'none',
        experience: '',
        skills: [],
        evidence: [],
      },
    ],
  },
  {
    id: 'pos-2',
    title: 'Senior Frontend Engineer',
    seniority: 'Senior',
    location: 'Remote (UK)',
    employmentType: 'Full-time',
    status: 'active',
    requirements: [
      { id: 'rf1', name: 'React', category: 'technical', importance: 'mandatory', weight: 5, description: 'Expert-level React with hooks, context, and performance optimisation' },
      { id: 'rf2', name: 'TypeScript', category: 'technical', importance: 'mandatory', weight: 4, description: 'Strong TypeScript — generics, utility types, strict mode' },
      { id: 'rf3', name: 'CSS / Design Systems', category: 'technical', importance: 'important', weight: 3, description: 'Component libraries, design tokens, accessible UI' },
      { id: 'rf4', name: 'Testing', category: 'technical', importance: 'important', weight: 2, description: 'Unit and integration testing with Jest/Vitest and Testing Library' },
      { id: 'rf5', name: '5+ Years Frontend', category: 'experience', importance: 'mandatory', weight: 2, description: 'At least 5 years of professional frontend engineering' },
    ],
    threshold: 75,
    lastUpdated: '2026-09-04T16:00:00Z',
    createdAt: '2026-08-28T10:00:00Z',
    candidates: [
      {
        id: 'cf1', name: 'Lena Hoffmann', email: 'lena.h@devnet.io',
        currentRole: 'Senior Frontend Engineer', company: 'Figma', location: 'Remote, Germany',
        cvMatchScore: 94, verifiedSkillScore: 89, assessmentScore: null,
        status: 'verified', assessmentStatus: 'evaluated',
        experience: '8 years',
        skills: ['React', 'TypeScript', 'CSS', 'Storybook', 'Vite', 'Testing Library'],
        evidence: [
          { requirementId: 'rf1', strength: 'strong', quote: '8 years React, contributor to open-source React performance tooling.', source: 'Professional Summary' },
          { requirementId: 'rf2', strength: 'strong', quote: 'TypeScript strict mode across all projects. Author of internal TypeScript style guide.', source: 'Technical Skills' },
          { requirementId: 'rf3', strength: 'strong', quote: 'Built design system adopted across 4 product teams. Design token architecture and Storybook documentation.', source: 'Projects' },
          { requirementId: 'rf4', strength: 'strong', quote: '90%+ test coverage on component library using Vitest and Testing Library.', source: 'Technical Skills' },
          { requirementId: 'rf5', strength: 'strong', quote: '8 years professional frontend engineering experience.', source: 'Professional Summary' },
        ],
        assessment: { id: 'a-lena', status: 'evaluated', timeLimit: 40, difficulty: 'advanced', overallScore: 89, skillScores: { React: 91, TypeScript: 92, 'Design Systems': 88, Testing: 86 }, sentAt: '2026-09-02T10:00:00Z', completedAt: '2026-09-02T11:05:00Z', questions: [] },
      },
      {
        id: 'cf2', name: 'Tom Ashworth', email: 'tom.ashworth@email.com',
        currentRole: 'Frontend Developer', company: 'Agency', location: 'London, UK',
        cvMatchScore: 76, verifiedSkillScore: null, assessmentScore: null,
        status: 'matched', assessmentStatus: 'none',
        experience: '5 years',
        skills: ['React', 'JavaScript', 'CSS', 'Next.js'],
        evidence: [
          { requirementId: 'rf1', strength: 'strong', quote: '5 years React development in agency context.', source: 'Experience' },
          { requirementId: 'rf2', strength: 'moderate', quote: 'Some TypeScript use but primarily JavaScript projects.', source: 'Skills' },
          { requirementId: 'rf3', strength: 'moderate', quote: 'CSS experience, no design system work mentioned.', source: 'Skills' },
          { requirementId: 'rf4', strength: 'none', quote: '', source: '' },
          { requirementId: 'rf5', strength: 'strong', quote: '5 years frontend experience.', source: 'Professional Summary' },
        ],
      },
    ],
  },
  {
    id: 'pos-3',
    title: 'AI Product Manager',
    seniority: 'Senior',
    location: 'Remote',
    employmentType: 'Full-time',
    status: 'active',
    threshold: 75,
    lastUpdated: '2026-09-08T10:00:00Z',
    createdAt: '2026-09-08T10:00:00Z',
    candidates: [],
    requirements: [
      {
        id: 'apm-r1',
        name: 'AI Product Experience',
        category: 'experience',
        importance: 'mandatory',
        weight: 5,
        description: 'Proven track record building or managing AI-powered products — HRIS, copilots, recommendation systems, or similar. Must have shipped something real.',
      },
      {
        id: 'apm-r2',
        name: 'Prototype & Build Ability',
        category: 'technical',
        importance: 'mandatory',
        weight: 5,
        description: 'Can use AI tools (Cursor, Claude, ChatGPT, no-code) to independently build working prototypes. Does not wait for engineering to validate an idea.',
      },
      {
        id: 'apm-r3',
        name: 'Technical Fluency',
        category: 'technical',
        importance: 'mandatory',
        weight: 4,
        description: 'Understands how LLMs, APIs, and AI pipelines work at a practical level. Can read code, write specs engineers respect, and debug product–model integration issues.',
      },
      {
        id: 'apm-r4',
        name: 'UX & Flow Design',
        category: 'technical',
        importance: 'important',
        weight: 3,
        description: 'Designs simple, intuitive flows for complex AI interactions. Has reduced cognitive load on AI-facing surfaces — knows when to hide complexity from the user.',
      },
      {
        id: 'apm-r5',
        name: 'Stakeholder Communication',
        category: 'soft',
        importance: 'important',
        weight: 3,
        description: 'Translates AI capabilities and limitations clearly to non-technical stakeholders. Sets realistic expectations around model behaviour and edge cases.',
      },
      {
        id: 'apm-r6',
        name: 'Data & Metrics Thinking',
        category: 'technical',
        importance: 'preferred',
        weight: 2,
        description: 'Defines success metrics for AI features — not just engagement but accuracy, trust, and fallback rates. Comfortable running evals and iterating on prompts.',
      },
      {
        id: 'apm-r7',
        name: 'Agile / Cross-functional Leadership',
        category: 'experience',
        importance: 'preferred',
        weight: 2,
        description: 'Has led cross-functional teams including engineers, designers, and data scientists. Comfortable with fast-moving, ambiguous AI product cycles.',
      },
    ],
  },
];
