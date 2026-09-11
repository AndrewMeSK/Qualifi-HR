import { useState } from 'react';
import { Candidate, PositionProfile, AssessmentQuestion } from '../data';
import { ScoreRing, EvidenceBadge, ImportanceBadge, CandidateStatusBadge, AssessmentStatusBadge, DiscrepancyAlert, Btn, ScoreBar } from '../components/ui';

interface Props {
  candidate: Candidate;
  position: PositionProfile;
  nav: { goWorkspace: (id: string) => void };
}

type DetailTab = 'overview' | 'evidence' | 'assessment' | 'verification';

function ComingSoonTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center max-w-xs">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v5l3 3" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="9" r="7" stroke="#F5A623" strokeWidth="1.5"/></svg>
        </div>
        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3" style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.25)' }}>Coming Soon</span>
        <h3 className="font-display font-semibold text-base mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.02em' }}>{title}</h3>
        <p className="text-xs leading-relaxed" style={{ color: '#4B5A6E' }}>{description}</p>
      </div>
    </div>
  );
}

// ─── Score Comparison Hero ─────────────────────────────────────────────────────
function ScoreComparison({ candidate }: { candidate: Candidate }) {
  const cv = candidate.cvMatchScore;
  const verified = candidate.verifiedSkillScore;
  const hasVerified = verified !== null;
  const delta = hasVerified ? cv - verified! : null;
  const aligned = delta !== null && delta < 10;
  const significant = delta !== null && delta >= 25;
  const notable = delta !== null && delta >= 15 && !significant;

  return (
    <div className="rounded-xl p-6" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#4B5A6E', letterSpacing: '0.08em' }}>Qualification Scores</p>

      <div className="flex items-center gap-8">
        {/* CV Match */}
        <div className="flex flex-col items-center gap-3">
          <ScoreRing score={cv} size={90} stroke={7} />
          <div className="text-center">
            <p className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>CV Match</p>
            <p className="text-xs mt-0.5" style={{ color: '#4B5A6E' }}>What the CV says</p>
          </div>
        </div>

        {/* VS divider with delta */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: '#4B5A6E', background: 'rgba(255,255,255,0.05)' }}>vs</span>
          <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
          {delta !== null && (
            <span className="font-mono text-xs font-semibold mt-1" style={{
              fontFamily: 'JetBrains Mono, monospace',
              color: significant ? '#F05252' : notable ? '#F5A623' : '#0FD99B',
            }}>
              {delta >= 0 ? '−' : '+'}{Math.abs(delta)}pt
            </span>
          )}
        </div>

        {/* Verified Skill */}
        <div className="flex flex-col items-center gap-3">
          {hasVerified ? (
            <>
              <ScoreRing score={verified!} size={90} stroke={7} />
              <div className="text-center">
                <p className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>Verified Skill</p>
                <p className="text-xs mt-0.5" style={{ color: '#4B5A6E' }}>What they demonstrated</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center" style={{ border: '2.5px dashed rgba(255,255,255,0.1)' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4v6M10 13v1" stroke="#3A4560" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="8" stroke="#3A4560" strokeWidth="1.5"/></svg>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold" style={{ color: '#4B5A6E' }}>Verified Skill</p>
                <p className="text-xs mt-0.5" style={{ color: '#3A4560' }}>Not yet verified</p>
              </div>
            </>
          )}
        </div>

        {/* Insight */}
        {hasVerified && (
          <div className="flex-1 pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            {aligned && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg" style={{ background: 'rgba(15,217,155,0.07)', border: '1px solid rgba(15,217,155,0.2)' }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0FD99B' }}>Strong alignment</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7B8E' }}>CV claims and demonstrated skills are consistent. High confidence in this candidate.</p>
                </div>
              </div>
            )}
            {notable && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg" style={{ background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.2)' }}>
                <span style={{ fontSize: 16 }}>🔔</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F5A623' }}>Notable discrepancy</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7B8E' }}>Some gap between CV alignment and demonstrated skill. Review evidence carefully.</p>
                </div>
              </div>
            )}
            {significant && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg" style={{ background: 'rgba(240,82,82,0.07)', border: '1px solid rgba(240,82,82,0.25)' }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F87171' }}>High discrepancy detected</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7B8E' }}>
                    High CV alignment but low demonstrated technical proficiency. The gap between claimed experience and verified ability is significant.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!hasVerified && (
          <div className="flex-1 pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs mb-1" style={{ color: '#4B5A6E' }}>Skills not yet verified</p>
            <p className="text-xs leading-relaxed" style={{ color: '#3A4560' }}>
              CV Match shows strong alignment. Verify skills before investing interview time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ candidate, position }: { candidate: Candidate; position: PositionProfile }) {
  const mandatoryReqs = position.requirements.filter(r => r.importance === 'mandatory');
  const mandatoryEvidence = mandatoryReqs.map(req => ({
    req,
    evidence: candidate.evidence.find(e => e.requirementId === req.id),
  }));

  return (
    <div className="space-y-5">
      <ScoreComparison candidate={candidate} />

      {/* Key info + CTA row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Candidate info */}
        <div className="col-span-2 p-5 rounded-xl" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5A6E', letterSpacing: '0.08em' }}>Candidate info</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Current role', value: candidate.currentRole },
              { label: 'Location', value: candidate.location },
              { label: 'Email', value: candidate.email || 'Not extracted' },
              { label: 'Experience', value: candidate.experience || 'See CV' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs" style={{ color: '#4B5A6E' }}>{label}</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: value === 'Not extracted' ? '#4B5A6E' : '#E2E8F0' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment CTA — coming soon */}
        <div className="p-5 rounded-xl flex flex-col items-center justify-center text-center gap-3" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.1)' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 2.5v4l2.5 2.5" stroke="#F5A623" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7.5" cy="7.5" r="6" stroke="#F5A623" strokeWidth="1.4"/></svg>
          </div>
          <div>
            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5" style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623' }}>Coming Soon</span>
            <p className="text-xs" style={{ color: '#4B5A6E' }}>Send assessment &amp; verify skills</p>
          </div>
        </div>
      </div>

      {/* Mandatory requirements summary */}
      <div className="p-5 rounded-xl" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5A6E', letterSpacing: '0.08em' }}>Mandatory requirements</p>
        <div className="space-y-3">
          {mandatoryEvidence.map(({ req, evidence }) => (
            <div key={req.id} className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: evidence?.strength === 'strong' ? '#0FD99B' : evidence?.strength === 'moderate' ? '#F5A623' : '#3A4560' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{req.name}</p>
                  {evidence && <EvidenceBadge strength={evidence.strength} />}
                </div>
                {evidence?.quote && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#4B5A6E' }}>{evidence.quote.slice(0, 90)}...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Evidence Tab ──────────────────────────────────────────────────────────────
function EvidenceTab({ candidate, position }: { candidate: Candidate; position: PositionProfile }) {
  const totalWeight = position.requirements.reduce((s, r) => s + r.weight, 0);
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-lg mb-4 flex items-center gap-2" style={{ background: 'rgba(79,126,255,0.07)', border: '1px solid rgba(79,126,255,0.15)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#4F7EFF" strokeWidth="1.3"/><path d="M7 6.5v3M7 4.5v.5" stroke="#4F7EFF" strokeWidth="1.3" strokeLinecap="round"/></svg>
        <p className="text-xs" style={{ color: '#60A5FA' }}>Evidence is extracted from the candidate's CV. It explains the basis of their CV Match Score. No evidence for a skill does not mean the candidate lacks it.</p>
      </div>

      {position.requirements.map(req => {
        const evidence = candidate.evidence.find(e => e.requirementId === req.id);
        const strength = evidence?.strength ?? 'none';
        const borderColor = strength === 'strong' ? 'rgba(15,217,155,0.25)' : strength === 'moderate' ? 'rgba(245,166,35,0.25)' : 'rgba(255,255,255,0.07)';
        const pct = totalWeight > 0 ? Math.round((req.weight / totalWeight) * 100) : 0;

        return (
          <div key={req.id} className="rounded-xl p-5 animate-fade-up" style={{ background: '#0E1117', border: `1px solid ${borderColor}` }}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <p className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>{req.name}</p>
                <ImportanceBadge importance={req.importance} />
                <span className="text-xs" style={{ color: '#3A4560' }}>{pct}%</span>
              </div>
              <EvidenceBadge strength={strength} />
            </div>

            {evidence?.quote ? (
              <div>
                <p className="text-xs mb-1" style={{ color: '#4B5A6E' }}>Evidence found in: <span style={{ color: '#6B7B8E' }}>{evidence.source}</span></p>
                <blockquote className="text-sm leading-relaxed pl-3" style={{ borderLeft: '2px solid rgba(79,126,255,0.4)', color: '#C4CFE0' }}>
                  "{evidence.quote}"
                </blockquote>
              </div>
            ) : (
              <p className="text-xs" style={{ color: '#3A4560' }}>No evidence found in CV for this requirement.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Assessment Tab ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AssessmentTab({
  candidate, position,
  onGenerating, onApprove, onSend,
  generatingStep,
}: {
  candidate: Candidate; position: PositionProfile;
  onGenerating: () => void; onApprove: () => void; onSend: () => void;
  generatingStep: 'idle' | 'generating' | 'ready' | 'approved' | 'sent';
}) {
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  const assessment = candidate.assessment;
  const status = candidate.assessmentStatus;

  if (status === 'none' && generatingStep === 'idle') {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(167,139,250,0.1)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2.5" stroke="#A78BFA" strokeWidth="1.5"/><path d="M7 10h6M7 7h4M7 13h3" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <h3 className="font-semibold text-sm mb-2" style={{ color: '#E2E8F0' }}>No assessment yet</h3>
        <p className="text-xs mb-5 max-w-xs mx-auto" style={{ color: '#4B5A6E', lineHeight: 1.6 }}>
          Generate a candidate-specific assessment based on the Position Profile and this candidate's CV claims.
        </p>
        <Btn variant="primary" onClick={onGenerating}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.5 3.5L11 6l-3.5 1.5L6 11 4.5 7.5 1 6l3.5-1.5L6 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          Generate assessment
        </Btn>
      </div>
    );
  }

  if (generatingStep === 'generating') {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: '#0E1117', border: '1px solid rgba(167,139,250,0.2)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(167,139,250,0.12)' }}>
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderRightColor: '#A78BFA', borderBottomColor: '#A78BFA', borderLeftColor: '#A78BFA', borderTopColor: 'transparent' }} />
        </div>
        <h3 className="font-semibold text-sm mb-2" style={{ color: '#E2E8F0' }}>Generating assessment</h3>
        <p className="text-xs max-w-xs mx-auto" style={{ color: '#4B5A6E', lineHeight: 1.6 }}>
          Analysing CV claims against Position Profile requirements. Generating candidate-specific verification questions…
        </p>
      </div>
    );
  }

  const questions = assessment?.questions ?? [];
  const isEditable = generatingStep === 'ready' || status === 'draft';
  const isSent = status === 'sent' || status === 'opened' || generatingStep === 'sent';
  const isEvaluated = status === 'evaluated';

  return (
    <div className="space-y-4">
      {/* Status banner */}
      {isEditable && (
        <div className="flex items-center justify-between p-3.5 rounded-lg" style={{ background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.2)' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 14 }}>✦</span>
            <p className="text-xs font-medium" style={{ color: '#F5A623' }}>AI-generated assessment — review before sending. Edit, delete, or regenerate any question.</p>
          </div>
          <div className="flex gap-2 ml-3 flex-shrink-0">
            <Btn variant="secondary" size="sm">Regenerate all</Btn>
            <Btn variant="primary" size="sm" onClick={onApprove}>Approve & send</Btn>
          </div>
        </div>
      )}
      {isSent && (
        <div className="p-3.5 rounded-lg" style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.2)' }}>
          <p className="text-xs" style={{ color: '#60A5FA' }}>
            ✉ Assessment sent to {candidate.email || 'candidate'} · Waiting for completion
          </p>
        </div>
      )}
      {isEvaluated && (
        <div className="p-3.5 rounded-lg" style={{ background: 'rgba(15,217,155,0.07)', border: '1px solid rgba(15,217,155,0.2)' }}>
          <p className="text-xs" style={{ color: '#0FD99B' }}>
            ✓ Assessment completed and evaluated · Overall score: <strong>{assessment?.overallScore}%</strong>
          </p>
        </div>
      )}

      {/* Config row */}
      <div className="flex items-center gap-4 px-1">
        {[
          { label: 'Questions', value: questions.length },
          { label: 'Time limit', value: `${assessment?.timeLimit ?? 45} min` },
          { label: 'Difficulty', value: assessment?.difficulty ?? 'advanced' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: '#4B5A6E' }}>{label}:</span>
            <span className="text-xs font-medium capitalize" style={{ color: '#8896A4' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Questions */}
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-xl p-5 animate-fade-up" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)', animationDelay: `${i * 60}ms` }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(79,126,255,0.1)', color: '#4F7EFF', fontFamily: 'JetBrains Mono, monospace' }}>
                Q{i + 1}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#8896A4' }}>{q.skill}</span>
            </div>
            {isEditable && (
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditingQuestion(editingQuestion === q.id ? null : q.id)} className="p-1.5 rounded hover:bg-white/5 transition-colors text-xs" style={{ color: '#4B5A6E' }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7 2l2 2-5 5H2V7l5-5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
                </button>
                <button className="p-1.5 rounded hover:bg-red-500/10 transition-colors" style={{ color: '#4B5A6E' }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 2.5h7M4 2.5V2h3v.5M3.5 2.5l.5 6h3l.5-6" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                </button>
              </div>
            )}
          </div>

          {/* CV claim */}
          <div className="mb-2.5 px-3 py-2 rounded-lg" style={{ background: 'rgba(79,126,255,0.07)', border: '1px solid rgba(79,126,255,0.12)' }}>
            <p className="text-xs" style={{ color: '#4B5A6E' }}>Verifying CV claim:</p>
            <p className="text-xs mt-0.5 italic" style={{ color: '#6B7B8E' }}>"{q.cvClaim}"</p>
          </div>

          {/* Question */}
          {editingQuestion === q.id ? (
            <textarea
              defaultValue={q.question}
              rows={3}
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(79,126,255,0.4)', color: '#E2E8F0', lineHeight: 1.6 }}
            />
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: '#D1DCF0' }}>{q.question}</p>
          )}

          {/* Response (if evaluated) */}
          {isEvaluated && q.answer && (
            <div className="mt-4 space-y-2">
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs mb-1" style={{ color: '#4B5A6E' }}>Candidate response:</p>
                <p className="text-xs leading-relaxed" style={{ color: '#C4CFE0' }}>{q.answer}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-1 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-xs mb-1" style={{ color: '#4B5A6E' }}>AI evaluation:</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#8896A4' }}>{q.feedback}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-mono text-lg font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: (q.score ?? 0) >= 80 ? '#0FD99B' : (q.score ?? 0) >= 60 ? '#F5A623' : '#F05252' }}>
                    {q.score}%
                  </p>
                  <p className="text-xs" style={{ color: '#3A4560' }}>Score</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Verification Tab ──────────────────────────────────────────────────────────
function VerificationTab({ candidate }: { candidate: Candidate }) {
  const assessment = candidate.assessment;

  if (!assessment?.skillScores) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-sm" style={{ color: '#4B5A6E' }}>No verification results yet. Complete the assessment to see skill-level scores.</p>
      </div>
    );
  }

  const skills = Object.entries(assessment.skillScores);

  return (
    <div className="space-y-5">
      {/* Verified Skill Score hero */}
      <div className="p-5 rounded-xl flex items-center gap-6" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={assessment.overallScore!} size={100} stroke={8} />
          <p className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>Verified Skill Score</p>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5A6E', letterSpacing: '0.08em' }}>Skill breakdown</p>
          <div className="space-y-3">
            {skills.map(([skill, score]) => (
              <div key={skill}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: '#C4CFE0' }}>{skill}</span>
                </div>
                <ScoreBar
                  score={score}
                  color={score >= 80 ? '#0FD99B' : score >= 65 ? '#F5A623' : '#F05252'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CV vs Verified comparison */}
      <div className="p-5 rounded-xl" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5A6E', letterSpacing: '0.08em' }}>CV Match vs Verified Skill — by requirement</p>
        <div className="space-y-4">
          {skills.map(([skill, verifiedScore]) => {
            const cvEvidence = candidate.evidence.find(e => {
              const req = e.requirementId;
              return req.includes('1') && skill.toLowerCase().includes('python') ? true
                : skill.toLowerCase() === 'django' && req.includes('2') ? true
                : skill.toLowerCase() === 'aws' && req.includes('3') ? true
                : skill.toLowerCase().includes('system') && req.includes('5') ? true
                : false;
            });
            // Estimate CV "claimed score" from evidence strength
            const cvStrengthScore = candidate.evidence.reduce((best, ev) => {
              const name = skill.toLowerCase();
              if ((name === 'python' && ev.requirementId === 'r1') ||
                  (name === 'django' && ev.requirementId === 'r2') ||
                  (name === 'aws' && ev.requirementId === 'r3') ||
                  (name === 'system design' && ev.requirementId === 'r5') ||
                  (name === 'postgresql' && ev.requirementId === 'r4')) {
                return ev.strength === 'strong' ? 88 : ev.strength === 'moderate' ? 65 : 20;
              }
              return best;
            }, 70);

            const delta = cvStrengthScore - verifiedScore;
            const isGap = delta >= 15;

            return (
              <div key={skill} className="pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{skill}</p>
                  {isGap && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(240,82,82,0.1)', color: '#F87171' }}>
                      −{delta}pt gap
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="w-20 text-xs flex-shrink-0" style={{ color: '#4B5A6E' }}>CV evidence</span>
                    <ScoreBar score={cvStrengthScore} color="#4F7EFF" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-20 text-xs flex-shrink-0" style={{ color: '#4B5A6E' }}>Verified</span>
                    <ScoreBar score={verifiedScore} color={verifiedScore >= 80 ? '#0FD99B' : verifiedScore >= 65 ? '#F5A623' : '#F05252'} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessment responses link */}
      <p className="text-xs text-center" style={{ color: '#3A4560' }}>
        Full question-by-question responses available in the Assessment tab.
      </p>
    </div>
  );
}

// ─── Main CandidateDetail ──────────────────────────────────────────────────────
export default function CandidateDetail({ candidate, position, nav }: Props) {
  const [tab, setTab] = useState<DetailTab>('overview');

  const tabs: { id: DetailTab; label: string; soon?: boolean }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'evidence', label: 'Match Evidence' },
    { id: 'assessment', label: 'Assessment', soon: true },
    { id: 'verification', label: 'Verification', soon: true },
  ];

  const hasDiscrepancy = candidate.verifiedSkillScore !== null && (candidate.cvMatchScore - candidate.verifiedSkillScore) >= 15;

  return (
    <div className="flex h-full min-h-screen bg-mesh" style={{ background: '#080A10' }}>
      {/* Left sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: '#0C0E16', borderRight: '1px solid rgba(255,255,255,0.06)', minHeight: '100vh' }}>
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => nav.goWorkspace(position.id)} className="flex items-center gap-1.5 text-xs mb-4 transition-colors hover:text-white" style={{ color: '#4B5A6E' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9.5 6h-7M5.5 3l-3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {position.title}
          </button>

          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0" style={{ background: 'rgba(79,126,255,0.15)', color: '#4F7EFF' }}>
              {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#F0F4FF' }}>{candidate.name}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: '#4B5A6E' }}>{candidate.currentRole}</p>
            </div>
          </div>
          <CandidateStatusBadge status={candidate.status} />
          {candidate.resumeUrl && (
            <a
              href={candidate.resumeUrl}
              download={candidate.resumeFileName ?? `${candidate.name}-resume`}
              className="mt-3 flex items-center gap-1.5 w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: 'rgba(79,126,255,0.1)', color: '#4F7EFF', border: '1px solid rgba(79,126,255,0.2)' }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v6M2.5 7.5l3 2.5 3-2.5M1 10h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Download resume
            </a>
          )}
        </div>

        {/* Score summary */}
        <div className="px-4 py-4 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: '#4B5A6E' }}>CV Match</span>
            <span className="font-mono text-sm font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: candidate.cvMatchScore >= 80 ? '#0FD99B' : '#F5A623' }}>{candidate.cvMatchScore}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: '#4B5A6E' }}>Verified Skill</span>
            <span className="font-mono text-sm font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: candidate.verifiedSkillScore !== null ? (candidate.verifiedSkillScore >= 80 ? '#0FD99B' : candidate.verifiedSkillScore >= 65 ? '#F5A623' : '#F05252') : '#3A4560' }}>
              {candidate.verifiedSkillScore !== null ? `${candidate.verifiedSkillScore}%` : '—'}
            </span>
          </div>
          {hasDiscrepancy && (
            <div className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(240,82,82,0.1)', color: '#F87171', textAlign: 'center' }}>
              ⚠ Discrepancy detected
            </div>
          )}
        </div>

        {/* Tab nav */}
        <nav className="px-3 pt-3">
          {tabs.map(({ id, label, soon }) => (
            <button
              key={id} onClick={() => setTab(id)}
              className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium mb-1 transition-all text-left"
              style={{
                background: tab === id ? 'rgba(79,126,255,0.12)' : 'transparent',
                color: tab === id ? '#4F7EFF' : '#6B7B8E',
              }}
            >
              {label}
              {soon && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623', fontSize: 9 }}>Soon</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-8">
          {tab === 'overview' && (
            <OverviewTab candidate={candidate} position={position} />
          )}
          {tab === 'evidence' && (
            <EvidenceTab candidate={candidate} position={position} />
          )}
          {tab === 'assessment' && (
            <ComingSoonTab
              title="Skills Assessment"
              description="Send candidates a personalised skills assessment based on the position profile requirements. Results will appear here once completed."
            />
          )}
          {tab === 'verification' && (
            <ComingSoonTab
              title="Skill Verification"
              description="Deep skill verification compares CV claims against demonstrated ability. Complete an assessment first to unlock this view."
            />
          )}
        </div>
      </main>
    </div>
  );
}
