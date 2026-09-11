// OpenAI Responses API integration for Position Profile AI conversation

const API_URL = 'https://api.openai.com/v1/responses';
const CHAT_API_URL = 'https://api.openai.com/v1/chat/completions';
const PRIMARY_MODEL = 'gpt-6-astra';
const FALLBACK_MODELS = ['gpt-4o', 'gpt-4o-mini'];

// Reliable Chat Completions endpoint for utility calls (scoring, JD gen, questions)
async function callChat(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any;
  const text = data?.choices?.[0]?.message?.content as string | undefined;
  if (!text) throw new Error('Empty response from chat completions');
  return text;
}

async function callChatWithFallback(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  models = ['gpt-4o-mini', 'gpt-4o'],
): Promise<string | null> {
  for (const model of models) {
    try {
      const result = await callChat(model, systemPrompt, userPrompt, apiKey);
      return result;
    } catch (e) {
      console.warn(`[openai] ${model} chat failed:`, e);
    }
  }
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileRequirement {
  id: string;
  name: string;
  category: 'technical' | 'functional' | 'domain' | 'behavioral' | 'experience';
  importance: 'mandatory' | 'important' | 'preferred' | 'nice_to_have';
  status: 'confirmed' | 'needs_clarification' | 'ai_recommendation';
  description?: string;
  source?: 'recruiter' | 'ai';
  evidenceExpected?: string[];
  acceptableAlternatives?: string[];
  verificationRelevant?: boolean;
}

export interface ClarificationItem {
  topic: string;
  question: string;
}

export interface ProfileState {
  position: {
    title: string;
    seniority: string | null;
    employmentType: string | null;
    location: string | null;
  };
  responsibilities: string[];
  requirements: ProfileRequirement[];
  experience: string[];
  competencies: string[];
  differentiators: string[];
  verificationFocus: string[];
  needsClarification: ClarificationItem[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AIResponse {
  conversationalText: string;
  profileState: ProfileState | null;
  error?: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI assistant helping technical recruiters define structured Position Profiles for candidate qualification.

You operate on two outputs simultaneously:
1. A CONVERSATIONAL response asking the recruiter targeted questions
2. A STRUCTURED JSON state representing the current Position Profile

═══ CORE RULES ═══

RULE 1 — EXTRACT FIRST, ASK SECOND
Before every question, check if the information is already present in the initial request or confirmed in conversation. If yes: do not ask again. Extract all explicit information from the initial request before asking anything.

RULE 2 — FIXED FIRST MESSAGE
Your first conversational message must always be exactly:
"I'll help you define the requirements for this position and build the Position Profile as we go. I'll ask a few targeted questions to clarify what's essential, what's preferred, and what evidence would demonstrate the required capabilities.

What are the most important things this person will be responsible for or expected to accomplish?"
Do not prepend or append additional text to this first message.

RULE 3 — NEVER RE-ASK INITIAL INFORMATION
If the initial context contains "Senior Backend Engineer", do not ask "What position are you hiring for?"
If it contains "Full-time", do not ask "Is this full-time or part-time?"
If it contains "Berlin", do not ask "Where is the role located?"

RULE 4 — REQUIREMENT IMPORTANCE LEVELS AND WEIGHTS
mandatory = must have, role cannot succeed without it → assign weight 5
important = strongly preferred, significant disadvantage without it → assign weight 3
preferred = nice to have, advantage but not essential → assign weight 2
nice_to_have = minor plus, minimal weight → assign weight 1

Weights are stored as integers (1–5). They are displayed to the recruiter as percentages of the total weight across all requirements. For example, if there are 2 mandatory (w:5 each) and 1 important (w:3), the total is 13 and each mandatory shows as ~38%, the important as ~23%. Always assign weights that reflect the real relative importance — do not give every requirement the same weight.

RULE 5 — REQUIREMENT STATUS
confirmed = recruiter explicitly stated this
needs_clarification = mentioned but depth/context unclear
ai_recommendation = AI is suggesting this (not yet confirmed by recruiter)

RULE 6 — LIVE STATE UPDATES
After every meaningful recruiter response, update the structured state immediately. The conversational understanding and the Position Profile must never diverge.

RULE 7 — PARTIAL CAPTURE
If a requirement is mentioned but unclear, capture it with status "needs_clarification". Ask a single targeted clarification question about it.

RULE 8 — AI RECOMMENDATIONS
If you believe an additional criterion is important based on context, suggest it explicitly and mark as "ai_recommendation" with a clear reason. Wait for recruiter confirmation before marking as "confirmed".

RULE 9 — CONVERSATION EFFICIENCY
Ask at most 2 focused questions per turn. After 3-5 exchanges, aim to present a complete enough profile for review. Do not interrogate unnecessarily.

RULE 10 — DO NOT INVENT VALUES
If seniority is not provided, leave it null. If location is not provided, leave it null. Never invent values not given by the recruiter.

═══ RESPONSE FORMAT — CRITICAL ═══

EVERY response must follow this exact format:

<profile_state>
{
  "position": {
    "title": "string",
    "seniority": "string or null",
    "employmentType": "string or null",
    "location": "string or null"
  },
  "responsibilities": ["string"],
  "requirements": [
    {
      "id": "r1",
      "name": "string",
      "category": "technical|functional|domain|behavioral|experience",
      "importance": "mandatory|important|preferred|nice_to_have",
      "status": "confirmed|needs_clarification|ai_recommendation",
      "description": "string",
      "source": "recruiter|ai",
      "verificationRelevant": true
    }
  ],
  "experience": ["string"],
  "competencies": [],
  "differentiators": [],
  "verificationFocus": ["skills most important to verify"],
  "needsClarification": [
    { "topic": "string", "question": "string" }
  ]
}
</profile_state>

[Your conversational response here — following RULE 2 for the first message]

The <profile_state> block must always come FIRST, before the conversational text. The JSON must be valid. Do not include markdown formatting inside the JSON values.`;

// ─── Parse response ────────────────────────────────────────────────────────────

function parseAIResponse(rawText: string): AIResponse {
  const stateMatch = rawText.match(/<profile_state>([\s\S]*?)<\/profile_state>/);
  let profileState: ProfileState | null = null;
  let conversationalText = rawText;

  if (stateMatch) {
    try {
      profileState = JSON.parse(stateMatch[1].trim());
    } catch (e) {
      console.warn('Failed to parse profile_state JSON:', e);
    }
    conversationalText = rawText.replace(/<profile_state>[\s\S]*?<\/profile_state>/, '').trim();
  }

  return { conversationalText, profileState };
}

// ─── Build input messages ──────────────────────────────────────────────────────

function buildInput(messages: ConversationMessage[], positionContext: string) {
  const contextMessage = `Initial position information provided by the recruiter:\n\n${positionContext}\n\nPlease extract all relevant information from this before your first response.`;

  return [
    { role: 'user', content: contextMessage },
    ...messages.map(m => ({ role: m.role, content: m.text })),
  ];
}

// ─── Main API call ─────────────────────────────────────────────────────────────

async function callAPI(model: string, input: object[], apiKey: string, instructions?: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = { model, input, store: instructions !== undefined };
  if (instructions !== undefined) body.instructions = instructions;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errMsg = (err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
    throw new Error(errMsg);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any;
  console.debug('[openai] raw response:', JSON.stringify(data).slice(0, 600));

  // Responses API: output[].content[].text  (output_text type)
  const fromOutputContent = data?.output?.flatMap(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (o: any) => (Array.isArray(o?.content) ? o.content : [])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).find((c: any) => c?.type === 'output_text' || c?.type === 'text')?.text as string | undefined;

  // Some models return output[].text directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromOutputText = data?.output?.find((o: any) => typeof o?.text === 'string')?.text as string | undefined;

  // Chat completions shape fallback (model returned wrong API shape)
  const fromChoices = data?.choices?.[0]?.message?.content as string | undefined;

  // Top-level text (rare)
  const fromTopLevel = typeof data?.text === 'string' ? data.text as string : undefined;

  const text = fromOutputContent ?? fromOutputText ?? fromChoices ?? fromTopLevel;

  if (!text) {
    console.error('[openai] unparseable response shape:', JSON.stringify(data).slice(0, 1200));
    throw new Error(`Empty response from API (model: ${model})`);
  }
  return text;
}

export async function sendConversationMessage(
  messages: ConversationMessage[],
  positionContext: string,
): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;

  if (!apiKey) {
    return {
      conversationalText: 'API key not configured. Please add VITE_OPENAI_API_KEY to your .env.local file.',
      profileState: null,
      error: 'missing_key',
    };
  }

  const input = buildInput(messages, positionContext);

  let rawText: string | undefined;
  let lastErr = '';
  for (const model of [PRIMARY_MODEL, ...FALLBACK_MODELS]) {
    try {
      rawText = await callAPI(model, input, apiKey, SYSTEM_PROMPT);
      console.info(`[openai] success with model: ${model}`);
      break;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      console.warn(`[openai] ${model} failed: ${lastErr}`);
    }
  }
  if (!rawText) {
    return {
      conversationalText: `Unable to reach the AI assistant right now. (${lastErr})`,
      profileState: null,
      error: lastErr,
    };
  }

  return parseAIResponse(rawText!);
}

// ─── Generate candidate-specific assessment questions ─────────────────────────

export async function generateAssessmentQuestions(
  candidateName: string,
  candidateCVSummary: string,
  positionProfile: string,
): Promise<Array<{ skill: string; cvClaim: string; question: string }> | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  if (!apiKey) return null;

  const prompt = `You are generating a technical assessment for a candidate applying for a role.

Position Profile:
${positionProfile}

Candidate CV Summary:
${candidateCVSummary}

Generate 3-4 targeted technical questions designed to verify the candidate's specific CV claims against the position requirements. Each question should:
- Reference a specific claim from their CV
- Probe depth of understanding, not surface knowledge
- Be answerable in 200-400 words

Return JSON only (no markdown):
{
  "questions": [
    {
      "skill": "skill name",
      "cvClaim": "the specific claim being verified",
      "question": "the full verification question"
    }
  ]
}`;

  try {
    const rawText = await callAPI(
      PRIMARY_MODEL,
      [{ role: 'user', content: prompt }],
      apiKey,
    );
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.questions ?? null;
    }
  } catch (e) {
    console.warn('Assessment generation failed:', e);
  }
  return null;
}

// ─── Types for candidate-facing assessment ────────────────────────────────────

export interface AssessmentQuestion {
  id: string;
  skill: string;
  question: string;
}

export interface AnswerResult {
  questionId: string;
  score: number;       // 0–100
  feedback: string;
}

export interface AssessmentResult {
  candidateId: string;
  positionId: string;
  completedAt: string;
  answers: { questionId: string; answer: string }[];
  results: AnswerResult[];
  overallScore: number;
}

// ─── Generate 5 assessment questions from position requirements ───────────────

export async function generatePositionQuestions(
  positionTitle: string,
  requirements: Array<{ name: string; importance: string; description: string }>,
): Promise<AssessmentQuestion[] | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  if (!apiKey) return null;

  const reqList = requirements
    .slice(0, 8)
    .map(r => `- ${r.name} (${r.importance}): ${r.description}`)
    .join('\n');

  const prompt = `You are generating a candidate assessment for a "${positionTitle}" role.

Position requirements:
${reqList}

Generate exactly 5 open-ended questions that test the candidate's real-world experience with these requirements. Each question should:
- Target one of the key requirements above
- Ask for a specific example or scenario from their experience
- Be answerable in 150-300 words by someone with genuine experience
- NOT be a simple factual/trivia question — probe depth and judgment

Return valid JSON only, no markdown fences:
{
  "questions": [
    { "id": "q1", "skill": "skill name", "question": "Full question text here" },
    { "id": "q2", "skill": "skill name", "question": "..." },
    { "id": "q3", "skill": "skill name", "question": "..." },
    { "id": "q4", "skill": "skill name", "question": "..." },
    { "id": "q5", "skill": "skill name", "question": "..." }
  ]
}`;

  try {
    const raw = await callChatWithFallback('You are an expert technical interviewer. Return only valid JSON, no code fences.', prompt, apiKey);
    if (!raw) return null;
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]);
      return (parsed.questions as AssessmentQuestion[]) ?? null;
    }
  } catch (e) {
    console.warn('Question generation failed:', e);
  }
  return null;
}

// ─── Evaluate candidate answers, return per-question scores ──────────────────

export async function evaluateAnswers(
  positionTitle: string,
  questionsAndAnswers: Array<{ question: AssessmentQuestion; answer: string }>,
): Promise<{ results: AnswerResult[]; overallScore: number } | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  if (!apiKey) return null;

  const qa = questionsAndAnswers.map((qa, i) =>
    `Question ${i + 1} (${qa.question.skill}):\n${qa.question.question}\n\nAnswer:\n${qa.answer || '(no answer provided)'}`
  ).join('\n\n---\n\n');

  const prompt = `You are evaluating candidate responses for a "${positionTitle}" role.

${qa}

For each answer, provide:
- A score from 0 to 100 based on depth, specificity, and relevance
- One sentence of concise feedback (what was good or lacking)

Scoring guide:
90-100: Exceptional — concrete specifics, demonstrates deep judgment
70-89: Good — relevant and plausible, minor gaps in depth
50-69: Adequate — shows awareness but lacks specifics
30-49: Weak — vague or surface-level, does not demonstrate the skill
0-29: Very poor or blank

Return valid JSON only, no markdown:
{
  "results": [
    { "questionId": "q1", "score": 85, "feedback": "One sentence feedback." },
    { "questionId": "q2", "score": 70, "feedback": "..." },
    { "questionId": "q3", "score": 60, "feedback": "..." },
    { "questionId": "q4", "score": 90, "feedback": "..." },
    { "questionId": "q5", "score": 75, "feedback": "..." }
  ]
}`;

  try {
    const raw = await callChatWithFallback('You are an expert technical interviewer evaluating candidate responses. Return only valid JSON, no code fences.', prompt, apiKey);
    if (!raw) return null;
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]) as { results: AnswerResult[] };
      const results = parsed.results ?? [];
      const overallScore = results.length
        ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
        : 0;
      return { results, overallScore };
    }
  } catch (e) {
    console.warn('Answer evaluation failed:', e);
  }
  return null;
}

// ─── Score a CV against position requirements ─────────────────────────────────

export interface CVScoringResult {
  score: number;
  evidence: Array<{ requirementId: string; strength: 'strong' | 'moderate' | 'none'; quote: string; source: string }>;
}

export async function scoreCVAgainstPosition(
  cvText: string,
  positionTitle: string,
  requirements: Array<{ id: string; name: string; importance: string; weight: number; description: string }>,
): Promise<CVScoringResult> {
  const empty: CVScoringResult = { score: 0, evidence: [] };
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  if (!apiKey || !cvText.trim() || requirements.length === 0) return empty;

  const reqList = requirements
    .map(r => `- id="${r.id}" name="${r.name}" importance=${r.importance} weight=${r.weight}: ${r.description}`)
    .join('\n');

  const system = 'You are a senior technical recruiter. Analyse CVs against job requirements and return honest, calibrated scores with evidence. Always respond with only valid JSON.';
  const user = `Analyse this CV against the job requirements. Return ONLY valid JSON matching the schema below.

Position: ${positionTitle}

Requirements:
${reqList}

CV text:
${cvText.slice(0, 4000)}

Scoring guide:
- 0-20: Unrelated CV, almost no matching skills
- 21-45: Some overlap, missing most key requirements
- 46-65: Reasonable match, meets some important requirements
- 66-80: Good match, meets most requirements with real evidence
- 81-95: Strong match, clear depth across nearly all requirements
- 96-100: Exceptional — every requirement strongly evidenced

For each requirement find a direct quote from the CV (or empty string if none found).
Evidence strength: "strong" = explicitly demonstrated with specifics, "moderate" = mentioned but shallow, "none" = not found.

Return this exact JSON structure (no extra keys, no markdown):
{
  "score": <integer 0-100>,
  "evidence": [
    { "requirementId": "<id>", "strength": "strong"|"moderate"|"none", "quote": "<exact text from CV or empty>", "source": "CV" }
  ]
}`;

  try {
    const raw = await callChatWithFallback(system, user, apiKey);
    if (!raw) return empty;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { score?: number; evidence?: CVScoringResult['evidence'] };
      return {
        score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      };
    }
  } catch (e) {
    console.warn('CV scoring failed:', e);
  }
  return empty;
}

// ─── Generate job description from profile ────────────────────────────────────

export async function generateJobDescription(
  positionTitle: string,
  seniority: string,
  location: string,
  employmentType: string,
  responsibilities: string[],
  requirements: Array<{ name: string; importance: string; description: string }>,
): Promise<string | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  if (!apiKey) return null;

  const respList = responsibilities.map(r => `- ${r}`).join('\n');
  const reqList = requirements.map(r => `- **${r.name}** (${r.importance}): ${r.description}`).join('\n');

  const system = 'You are an expert technical recruiter. Write compelling, honest job descriptions that attract great candidates. Use plain text with markdown headers only, no code blocks.';
  const user = `Write a professional job description for this role.

Role details:
- Title: ${positionTitle}
- Seniority: ${seniority || 'Not specified'}
- Location: ${location || 'Not specified'}
- Employment: ${employmentType || 'Full-time'}

Responsibilities:
${respList || '(Infer from requirements)'}

Requirements:
${reqList}

Use these markdown sections:
## About the Role
## What You'll Do
## What We're Looking For
## Nice to Have
## What We Offer

Use [Company Name] as a placeholder. Under 600 words. No code fences, no preamble — start directly with the first section heading.`;

  const raw = await callChatWithFallback(system, user, apiKey);
  if (!raw) return null;
  // Strip any accidental markdown code fences the model may still add
  return raw.replace(/^```[\w]*\n?/gm, '').replace(/^```\s*$/gm, '').trim();
}
