import { useState, useEffect, useRef } from 'react';
import { PositionProfile } from '../data';
import {
  AssessmentQuestion, AssessmentResult,
  generatePositionQuestions, evaluateAnswers,
} from '../services/openai';

interface Props {
  positionId: string;
  candidateId: string;
  positions: PositionProfile[];
  onComplete: (result: AssessmentResult) => void;
}

type Step = 'loading' | 'intro' | 'questions' | 'review' | 'evaluating' | 'results';

const QUALIFI_LOGO = (
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4F7EFF 0%, #6B3FE4 100%)' }}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM3 6.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z" fill="white"/>
        <path d="M9.5 9.5L12 12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
    <span className="font-display font-bold text-base tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.03em' }}>qualifi</span>
  </div>
);

export default function CandidateAssessmentView({ positionId, candidateId, positions, onComplete }: Props) {
  const [step, setStep] = useState<Step>('loading');
  const [position, setPosition] = useState<PositionProfile | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const pos = positions.find(p => p.id === positionId) ?? null;
    setPosition(pos);

    if (!pos) {
      setLoadError('Position not found. This assessment link may be expired.');
      setStep('intro');
      return;
    }

    // Generate questions
    generatePositionQuestions(pos.title, pos.requirements).then(qs => {
      if (qs && qs.length > 0) {
        setQuestions(qs);
        setStep('intro');
      } else {
        // Fallback static questions from requirements
        const fallback: AssessmentQuestion[] = pos.requirements.slice(0, 5).map((r, i) => ({
          id: `q${i + 1}`,
          skill: r.name,
          question: `Describe a specific example from your experience where you applied ${r.name}. What was the context, what did you do, and what was the outcome?`,
        }));
        setQuestions(fallback);
        setStep('intro');
      }
    });
  }, []); // eslint-disable-line

  const handleSubmit = async () => {
    if (!position) return;
    setStep('evaluating');
    const qa = questions.map(q => ({ question: q, answer: answers[q.id] ?? '' }));
    const evaluation = await evaluateAnswers(position.title, qa);

    const res: AssessmentResult = {
      candidateId,
      positionId,
      completedAt: new Date().toISOString(),
      answers: questions.map(q => ({ questionId: q.id, answer: answers[q.id] ?? '' })),
      results: evaluation?.results ?? questions.map(q => ({ questionId: q.id, score: 0, feedback: 'Not evaluated.' })),
      overallScore: evaluation?.overallScore ?? 0,
    };

    // Persist to localStorage so the recruiter app picks it up
    const stored = JSON.parse(localStorage.getItem('qualifi_assessment_results') ?? '[]') as AssessmentResult[];
    const updated = [...stored.filter(r => r.candidateId !== candidateId), res];
    localStorage.setItem('qualifi_assessment_results', JSON.stringify(updated));

    setResult(res);
    setStep('results');
    onComplete(res);
  };

  const answeredCount = questions.filter(q => (answers[q.id] ?? '').trim().length > 20).length;
  const canSubmit = answeredCount >= Math.ceil(questions.length * 0.6);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#080A10' }}>
        <div className="flex flex-col items-center gap-4">
          {QUALIFI_LOGO}
          <div className="flex items-center gap-2 mt-6">
            <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderRightColor: '#4F7EFF', borderBottomColor: '#4F7EFF', borderLeftColor: '#4F7EFF', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: '#4B5A6E' }}>Preparing your assessment…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Intro ────────────────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#080A10' }}>
        <header className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {QUALIFI_LOGO}
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg animate-fade-up">
            {loadError ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(240,82,82,0.1)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#F05252" strokeWidth="1.5"/><path d="M12 8v4M12 16h.01" stroke="#F05252" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <h1 className="font-display font-bold text-2xl mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.03em' }}>Link unavailable</h1>
                <p className="text-sm" style={{ color: '#4B5A6E' }}>{loadError}</p>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4F7EFF', letterSpacing: '0.1em' }}>Skills Assessment</p>
                  <h1 className="font-display font-bold text-3xl mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.03em' }}>
                    {position?.title}
                  </h1>
                  <p className="text-base" style={{ color: '#6B7B8E' }}>
                    You have been invited to complete a skills assessment for this position. Answer honestly — there are no trick questions.
                  </p>
                </div>

                <div className="rounded-xl p-5 mb-6" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#4B5A6E', letterSpacing: '0.07em' }}>What to expect</p>
                  <div className="space-y-3">
                    {[
                      { icon: '📝', label: `${questions.length} open-ended questions`, detail: 'Based on the role requirements' },
                      { icon: '⏱', label: 'No time limit', detail: 'Take your time to give thoughtful answers' },
                      { icon: '🤖', label: 'AI-evaluated', detail: 'Scored on depth, specificity, and relevance' },
                      { icon: '🔒', label: 'Your answers are private', detail: 'Only the hiring team sees your responses' },
                    ].map(({ icon, label, detail }) => (
                      <div key={label} className="flex items-start gap-3">
                        <span className="text-base flex-shrink-0">{icon}</span>
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{label}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#4B5A6E' }}>{detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setStep('questions')}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg, #4F7EFF 0%, #6B3FE4 100%)', color: 'white' }}
                >
                  Begin assessment →
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── Questions ────────────────────────────────────────────────────────────────
  if (step === 'questions' || step === 'review') {
    const q = questions[currentQ];
    const isReview = step === 'review';

    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#080A10' }}>
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {QUALIFI_LOGO}
          <div className="flex items-center gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentQ(i); setStep('questions'); }}
                className="w-6 h-6 rounded-full text-xs font-semibold transition-all flex items-center justify-center"
                style={{
                  background: i === currentQ && !isReview
                    ? 'linear-gradient(135deg, #4F7EFF, #6B3FE4)'
                    : (answers[questions[i].id] ?? '').trim().length > 20
                    ? 'rgba(15,217,155,0.15)'
                    : 'rgba(255,255,255,0.06)',
                  color: i === currentQ && !isReview ? 'white'
                    : (answers[questions[i].id] ?? '').trim().length > 20 ? '#0FD99B' : '#4B5A6E',
                  border: i === currentQ && !isReview ? 'none' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {(answers[questions[i].id] ?? '').trim().length > 20 && i !== currentQ ? '✓' : i + 1}
              </button>
            ))}
            <span className="text-xs ml-1" style={{ color: '#4B5A6E' }}>
              {answeredCount}/{questions.length}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-4 py-10">
          {isReview ? (
            // Review all answers before submission
            <div className="max-w-2xl mx-auto animate-fade-up">
              <h2 className="font-display font-bold text-2xl mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.03em' }}>Review your answers</h2>
              <p className="text-sm mb-7" style={{ color: '#6B7B8E' }}>Check your responses before submitting. Click any question to edit it.</p>
              <div className="space-y-4 mb-8">
                {questions.map((q, i) => {
                  const ans = (answers[q.id] ?? '').trim();
                  return (
                    <div key={q.id} className="rounded-xl p-4" style={{ background: '#0E1117', border: `1px solid ${ans.length > 20 ? 'rgba(255,255,255,0.08)' : 'rgba(240,82,82,0.2)'}` }}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold flex-shrink-0"
                            style={{ background: ans.length > 20 ? 'rgba(15,217,155,0.15)' : 'rgba(240,82,82,0.1)', color: ans.length > 20 ? '#0FD99B' : '#F05252' }}>
                            {ans.length > 20 ? '✓' : i + 1}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(79,126,255,0.1)', color: '#4F7EFF' }}>{q.skill}</span>
                        </div>
                        <button onClick={() => { setCurrentQ(i); setStep('questions'); }} className="text-xs" style={{ color: '#4F7EFF' }}>Edit</button>
                      </div>
                      <p className="text-xs mb-2" style={{ color: '#8896A4' }}>{q.question}</p>
                      {ans.length > 0
                        ? <p className="text-sm leading-relaxed" style={{ color: '#C4CFE0' }}>{ans.slice(0, 200)}{ans.length > 200 ? '…' : ''}</p>
                        : <p className="text-xs italic" style={{ color: '#F05252' }}>No answer provided</p>
                      }
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setCurrentQ(0); setStep('questions'); }} className="flex-1 py-3 rounded-xl text-sm font-medium transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#8896A4' }}>
                  ← Edit answers
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #4F7EFF 0%, #6B3FE4 100%)', color: 'white' }}
                >
                  Submit assessment →
                </button>
              </div>
              {!canSubmit && <p className="text-xs text-center mt-3" style={{ color: '#F5A623' }}>Please answer at least {Math.ceil(questions.length * 0.6)} questions before submitting.</p>}
            </div>
          ) : (
            // Single question view
            <div className="max-w-2xl mx-auto animate-fade-up">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(79,126,255,0.12)', color: '#4F7EFF', border: '1px solid rgba(79,126,255,0.2)' }}>{q.skill}</span>
                <span className="text-xs" style={{ color: '#3A4560' }}>Question {currentQ + 1} of {questions.length}</span>
              </div>

              <h2 className="font-display font-semibold text-xl leading-snug mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.02em' }}>
                {q.question}
              </h2>

              <textarea
                value={answers[q.id] ?? ''}
                onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Share a specific example from your experience. The more concrete and detailed your answer, the better it reflects your abilities."
                rows={8}
                className="w-full rounded-xl px-4 py-3.5 text-sm resize-none outline-none transition-all mb-6"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#E2E8F0', lineHeight: 1.7 }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(79,126,255,0.4)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.09)'; }}
                autoFocus
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentQ(i => Math.max(0, i - 1))}
                  disabled={currentQ === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#8896A4' }}
                >
                  ← Previous
                </button>
                <div className="text-xs" style={{ color: '#3A4560' }}>
                  {(answers[q.id] ?? '').trim().length > 0 ? `${(answers[q.id] ?? '').trim().length} chars` : 'Not yet answered'}
                </div>
                {currentQ < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQ(i => i + 1)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #4F7EFF 0%, #6B3FE4 100%)', color: 'white' }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={() => setStep('review')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #4F7EFF 0%, #6B3FE4 100%)', color: 'white' }}
                  >
                    Review & submit →
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Evaluating ───────────────────────────────────────────────────────────────
  if (step === 'evaluating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#080A10' }}>
        <div className="text-center max-w-sm">
          {QUALIFI_LOGO}
          <div className="mt-10 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(79,126,255,0.1)', border: '1px solid rgba(79,126,255,0.2)' }}>
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderRightColor: '#4F7EFF', borderBottomColor: '#4F7EFF', borderLeftColor: '#4F7EFF', borderTopColor: 'transparent' }} />
            </div>
            <h2 className="font-display font-bold text-xl mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.03em' }}>Evaluating your answers</h2>
            <p className="text-sm" style={{ color: '#4B5A6E' }}>Our AI is reviewing each response. This takes about 15–30 seconds.</p>
          </div>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-3 h-3 rounded-full border animate-spin flex-shrink-0"
                  style={{ borderRightColor: '#A78BFA', borderBottomColor: '#A78BFA', borderLeftColor: '#A78BFA', borderTopColor: 'transparent', animationDelay: `${i * 0.15}s` }} />
                <p className="text-xs text-left" style={{ color: '#6B7B8E' }}>Evaluating: {q.skill}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  if (step === 'results' && result) {
    const scoreColor = result.overallScore >= 80 ? '#0FD99B' : result.overallScore >= 60 ? '#F5A623' : '#F05252';

    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#080A10' }}>
        <header className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {QUALIFI_LOGO}
        </header>
        <main className="flex-1 px-4 py-12">
          <div className="max-w-xl mx-auto animate-fade-up">
            {/* Score hero */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4" style={{ background: `rgba(${result.overallScore >= 80 ? '15,217,155' : result.overallScore >= 60 ? '245,166,35' : '240,82,82'},0.1)`, border: `2px solid ${scoreColor}` }}>
                <span className="font-mono font-bold text-3xl" style={{ color: scoreColor, fontFamily: 'JetBrains Mono, monospace' }}>{result.overallScore}</span>
              </div>
              <h2 className="font-display font-bold text-2xl mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.03em' }}>Assessment complete</h2>
              <p className="text-sm" style={{ color: '#4B5A6E' }}>Your responses have been submitted. The hiring team will be in touch.</p>
            </div>

            {/* Per-question breakdown */}
            <div className="space-y-3">
              {result.results.map((r, i) => {
                const q = questions.find(q => q.id === r.questionId) ?? questions[i];
                const c = r.score >= 80 ? '#0FD99B' : r.score >= 60 ? '#F5A623' : '#F05252';
                return (
                  <div key={r.questionId} className="rounded-xl p-4" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(79,126,255,0.1)', color: '#4F7EFF' }}>{q?.skill}</span>
                      <span className="font-mono font-semibold text-sm" style={{ color: c, fontFamily: 'JetBrains Mono, monospace' }}>{r.score}/100</span>
                    </div>
                    <div className="h-1 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${r.score}%`, background: c }} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#6B7B8E' }}>{r.feedback}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
