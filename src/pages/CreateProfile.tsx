import { useState, useRef, useEffect, useCallback } from 'react';
import { PositionProfile, Requirement, RequirementImportance } from '../data';
import { ProfileState, ConversationMessage, sendConversationMessage, generateJobDescription } from '../services/openai';
import { ImportanceBadge, WeightBar, TypingIndicator, Btn } from '../components/ui';

interface CreateProfileProps {
  nav: { goHome: () => void; onProfileCreated: (p: PositionProfile) => void };
}

// ─── Profile state to requirements converter ──────────────────────────────────
function profileStateToRequirements(state: ProfileState): Requirement[] {
  const importanceMap: Record<string, RequirementImportance> = {
    mandatory: 'mandatory',
    important: 'important',
    preferred: 'preferred',
    nice_to_have: 'nice-to-have',
  };
  const weightMap: Record<string, number> = {
    mandatory: 5, important: 3, preferred: 2, nice_to_have: 1,
  };
  return state.requirements
    .filter(r => r.status !== 'ai_recommendation')
    .map((r, i) => ({
      id: r.id ?? `r${i + 1}`,
      name: r.name,
      category: (r.category as Requirement['category']) ?? 'technical',
      importance: importanceMap[r.importance] ?? 'important',
      weight: weightMap[r.importance] ?? 2,
      description: r.description ?? '',
    }));
}

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

// ─── Live Profile Panel ───────────────────────────────────────────────────────
function LiveProfilePanel({ state }: { state: ProfileState | null }) {
  const importanceColors: Record<string, string> = {
    mandatory: '#F87171', important: '#60A5FA',
    preferred: '#A78BFA', nice_to_have: '#6B7280',
  };
  const importanceLabels: Record<string, string> = {
    mandatory: 'Mandatory', important: 'Important',
    preferred: 'Preferred', nice_to_have: 'Nice to have',
  };

  const confirmed = state?.requirements.filter(r => r.status === 'confirmed') ?? [];
  const clarifying = state?.requirements.filter(r => r.status === 'needs_clarification') ?? [];
  const aiRec = state?.requirements.filter(r => r.status === 'ai_recommendation') ?? [];

  const groups: Record<RequirementImportance, typeof confirmed> = {
    mandatory: confirmed.filter(r => r.importance === 'mandatory'),
    important: confirmed.filter(r => r.importance === 'important'),
    preferred: confirmed.filter(r => r.importance === 'preferred'),
    'nice-to-have': confirmed.filter(r => r.importance === 'nice_to_have'),
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-4 py-3.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4B5A6E', letterSpacing: '0.08em' }}>Position Profile</p>
          {state && (
            <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(79,126,255,0.15)', color: '#4F7EFF', fontFamily: 'JetBrains Mono, monospace' }}>
              {confirmed.length} req
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!state ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="#3A4560" strokeWidth="1.3"/><path d="M5 8h6M5 5.5h3.5" stroke="#3A4560" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </div>
            <p className="text-xs" style={{ color: '#3A4560', lineHeight: 1.5 }}>
              The Position Profile will build here as you describe the role.
            </p>
          </div>
        ) : (
          <>
            {/* Position info */}
            <div className="rounded-lg p-3" style={{ background: 'rgba(79,126,255,0.07)', border: '1px solid rgba(79,126,255,0.15)' }}>
              <p className="font-display font-semibold text-sm leading-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF' }}>
                {state.position.title || '—'}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {state.position.seniority && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#8896A4' }}>{state.position.seniority}</span>
                )}
                {state.position.employmentType && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#8896A4' }}>{state.position.employmentType}</span>
                )}
                {state.position.location && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#8896A4' }}>{state.position.location}</span>
                )}
              </div>
            </div>

            {/* Responsibilities */}
            {state.responsibilities.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#3A4560', letterSpacing: '0.07em' }}>Responsibilities</p>
                <ul className="space-y-1">
                  {state.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span style={{ color: '#4F7EFF', fontSize: 10, marginTop: 3, flexShrink: 0 }}>●</span>
                      <span className="text-xs leading-relaxed" style={{ color: '#8896A4' }}>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements by importance */}
            {(Object.entries(groups) as [RequirementImportance, typeof confirmed][]).map(([imp, reqs]) => {
              if (reqs.length === 0) return null;
              const color = importanceColors[imp] ?? '#6B7280';
              const label = importanceLabels[imp] ?? imp;
              return (
                <div key={imp}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color, letterSpacing: '0.07em', opacity: 0.9 }}>{label}</p>
                  <div className="space-y-1.5">
                    {reqs.map(req => (
                      <div key={req.id} className="px-2.5 py-2 rounded-lg animate-slide-right" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-xs font-medium" style={{ color: '#D1DCF0' }}>{req.name}</p>
                        {req.description && (
                          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#4B5A6E' }}>{req.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Needs clarification */}
            {clarifying.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#F5A623', letterSpacing: '0.07em', opacity: 0.9 }}>Needs Clarification</p>
                <div className="space-y-1.5">
                  {clarifying.map(req => (
                    <div key={req.id} className="px-2.5 py-2 rounded-lg" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)' }}>
                      <p className="text-xs font-medium" style={{ color: '#F5A623' }}>{req.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6B5010' }}>Depth / context TBC</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI recommendations */}
            {aiRec.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#A78BFA', letterSpacing: '0.07em', opacity: 0.9 }}>AI Recommendation</p>
                <div className="space-y-1.5">
                  {aiRec.map(req => (
                    <div key={req.id} className="px-2.5 py-2 rounded-lg" style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)' }}>
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: 10 }}>✦</span>
                        <p className="text-xs font-medium" style={{ color: '#A78BFA' }}>{req.name}</p>
                      </div>
                      {req.description && (
                        <p className="text-xs mt-0.5" style={{ color: '#6B4FA8' }}>{req.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification focus */}
            {state.verificationFocus.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#3A4560', letterSpacing: '0.07em' }}>Verify first</p>
                <div className="flex flex-wrap gap-1.5">
                  {state.verificationFocus.map(v => (
                    <span key={v} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(15,217,155,0.08)', color: '#0FD99B', border: '1px solid rgba(15,217,155,0.15)' }}>{v}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Custom select ───────────────────────────────────────────────────────────
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all text-left"
        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${open ? 'rgba(79,126,255,0.45)' : 'rgba(255,255,255,0.09)'}`, color: '#E2E8F0', outline: 'none' }}
      >
        <span>{value}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#4B5A6E', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden" style={{ background: '#131825', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {options.map(opt => (
            <button
              key={opt} type="button"
              onClick={() => { onChange(opt); close(); }}
              className="w-full text-left px-3 py-2 text-sm transition-colors"
              style={{ color: opt === value ? '#4F7EFF' : '#C4CFE0', background: opt === value ? 'rgba(79,126,255,0.1)' : 'transparent' }}
              onMouseEnter={e => { if (opt !== value) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (opt !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 1: Setup ────────────────────────────────────────────────────────────
function SetupStep({ onNext }: { onNext: (data: { title: string; seniority: string; location: string; employment: string; description: string }) => void }) {
  const [title, setTitle] = useState('');
  const [seniority, setSeniority] = useState('Senior');
  const [location, setLocation] = useState('');
  const [employment, setEmployment] = useState('Full-time');
  const [description, setDescription] = useState('');

  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#E2E8F0', borderRadius: 8, outline: 'none' };
  const focusStyle = { border: '1px solid rgba(79,126,255,0.45)' };

  return (
    <div className="max-w-lg mx-auto animate-fade-up">
      <div className="mb-8">
        <h2 className="font-display font-bold text-2xl mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.03em' }}>
          Position setup
        </h2>
        <p className="text-sm" style={{ color: '#6B7B8E' }}>
          Provide basic information about the role. The AI will extract what you give it and ask only what it still needs.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#8896A4' }}>Position title <span style={{ color: '#F87171' }}>*</span></label>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Senior Backend Engineer"
            className="w-full px-3 py-2.5 text-sm transition-all"
            style={inputStyle}
            onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
            onBlur={e => Object.assign(e.currentTarget.style, { border: '1px solid rgba(255,255,255,0.09)' })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8896A4' }}>Seniority</label>
            <Select value={seniority} onChange={setSeniority} options={['Not specified', 'Junior', 'Mid-level', 'Senior', 'Staff', 'Principal', 'Lead', 'Director']} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8896A4' }}>Employment type</label>
            <Select value={employment} onChange={setEmployment} options={['Full-time', 'Contract', 'Part-time', 'Full-time or Contract']} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#8896A4' }}>Location / work arrangement</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)}
            placeholder="e.g. London, UK (Hybrid)"
            className="w-full px-3 py-2.5 text-sm transition-all" style={inputStyle}
            onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
            onBlur={e => Object.assign(e.currentTarget.style, { border: '1px solid rgba(255,255,255,0.09)' })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#8896A4' }}>Additional context <span style={{ color: '#4B5A6E' }}>(optional)</span></label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe the role, responsibilities, team context, tech stack — the more you give the AI, the fewer questions it needs to ask."
            rows={3}
            className="w-full px-3 py-2.5 text-sm resize-none transition-all"
            style={inputStyle}
            onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
            onBlur={e => Object.assign(e.currentTarget.style, { border: '1px solid rgba(255,255,255,0.09)' })}
          />
        </div>

        <div className="pt-2">
          <Btn variant="primary" size="md" fullWidth disabled={!title.trim()}
            onClick={() => onNext({ title: title.trim(), seniority, location: location.trim() || 'Not specified', employment, description: description.trim() })}>
            Start AI conversation
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: AI Conversation ──────────────────────────────────────────────────
interface ConvStepProps {
  profileData: { title: string; seniority: string; location: string; employment: string; description: string };
  onComplete: (reqs: Requirement[], state: ProfileState) => void;
}

function ConversationStep({ profileData, onComplete }: ConvStepProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [profileState, setProfileState] = useState<ProfileState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  useEffect(() => { autoResize(); }, [input]);

  const positionContext = [
    `Title: ${profileData.title}`,
    profileData.seniority !== 'Not specified' ? `Seniority: ${profileData.seniority}` : null,
    `Employment: ${profileData.employment}`,
    profileData.location !== 'Not specified' ? `Location: ${profileData.location}` : null,
    profileData.description ? `Additional context: ${profileData.description}` : null,
  ].filter(Boolean).join('\n');

  // Trigger initial AI message on mount
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    setIsTyping(true);
    setError(null);

    sendConversationMessage([], positionContext).then(res => {
      setIsTyping(false);
      if (res.error === 'missing_key') {
        setError('OpenAI API key not configured.');
        return;
      }
      setMessages([{ role: 'assistant', text: res.conversationalText }]);
      if (res.profileState) setProfileState(res.profileState);
      setMessageCount(1);
    });
  }, []); // eslint-disable-line

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    setError(null);

    const userMsg: ConversationMessage = { role: 'user', text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    const res = await sendConversationMessage(updatedMessages, positionContext);
    setIsTyping(false);

    if (res.error) {
      setError(res.conversationalText);
      return;
    }

    const aiMsg: ConversationMessage = { role: 'assistant', text: res.conversationalText };
    setMessages([...updatedMessages, aiMsg]);
    if (res.profileState) setProfileState(res.profileState);
    setMessageCount(c => c + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const canReview = messageCount >= 1 && profileState !== null;
  const requirements = profileState ? profileStateToRequirements(profileState) : [];

  return (
    <div className="flex gap-5 h-[calc(100vh-190px)] min-h-0 animate-fade-up">
      {/* ── Chat panel ── */}
      <div className="flex-1 flex flex-col min-w-0 rounded-xl overflow-hidden" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Chat header */}
        <div className="px-5 py-3.5 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1C3.46 1 1 3.46 1 6.5c0 1.04.29 2.01.79 2.83L1 12l2.67-.79A5.48 5.48 0 0 0 6.5 12C9.54 12 12 9.54 12 6.5S9.54 1 6.5 1Z" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: '#F0F4FF' }}>AI Requirements Assistant</p>
            <p className="text-xs" style={{ color: '#4B5A6E' }}>Building: {profileData.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: error ? '#F05252' : '#0FD99B' }} />
              <span className="text-xs" style={{ color: '#4B5A6E' }}>{error ? 'Error' : isTyping ? 'Thinking…' : 'Live'}</span>
            </div>
            {canReview && (
              <Btn variant="primary" size="sm" onClick={() => onComplete(requirements, profileState!)}>
                Review Profile →
              </Btn>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && isTyping && (
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' }}>
                <span style={{ fontSize: 8, color: 'white' }}>AI</span>
              </div>
              <TypingIndicator />
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-up`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' }}>
                  <span style={{ fontSize: 8, color: 'white' }}>AI</span>
                </div>
              )}
              <div
                className="max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed"
                style={msg.role === 'assistant'
                  ? { background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#E2E8F0' }
                  : { background: 'rgba(79,126,255,0.15)', border: '1px solid rgba(79,126,255,0.25)', color: '#E2E8F0' }
                }
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
              />
            </div>
          ))}
          {isTyping && messages.length > 0 && (
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' }}>
                <span style={{ fontSize: 8, color: 'white' }}>AI</span>
              </div>
              <TypingIndicator />
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg" style={{ background: 'rgba(240,82,82,0.08)', border: '1px solid rgba(240,82,82,0.2)' }}>
              <p className="text-xs" style={{ color: '#F87171' }}>{error}</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input — modern auto-expanding chat bar */}
        <div className="px-4 pb-4 pt-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {canReview && (
            <p className="text-xs mb-2" style={{ color: '#3A7C5A' }}>
              ✓ Profile is building — keep refining or hit <strong style={{ color: '#0FD99B' }}>Review Profile</strong> when ready.
            </p>
          )}
          <div
            className="rounded-2xl transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${inputFocused ? 'rgba(79,126,255,0.5)' : 'rgba(255,255,255,0.09)'}`,
              boxShadow: inputFocused ? '0 0 0 3px rgba(79,126,255,0.08), 0 4px 20px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={isTyping ? 'AI is thinking…' : 'Reply or add more context…'}
              disabled={isTyping}
              rows={1}
              className="w-full bg-transparent resize-none px-4 pt-3.5 pb-2 text-sm outline-none"
              style={{ color: '#E2E8F0', lineHeight: '1.65', minHeight: 42, maxHeight: 180, display: 'block' }}
            />
            <div className="flex items-center justify-between px-3 pb-2.5">
              <span className="text-xs" style={{ color: '#2C3A52' }}>
                {input.length > 0 ? 'Shift+Enter for new line' : 'Enter to send · Shift+Enter for new line'}
              </span>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                style={{ background: input.trim() && !isTyping ? 'linear-gradient(135deg, #4F7EFF 0%, #6B3FE4 100%)' : 'rgba(255,255,255,0.08)', color: 'white' }}
              >
                {isTyping ? (
                  <div className="w-3 h-3 rounded-full border animate-spin" style={{ borderRightColor: 'rgba(255,255,255,0.6)', borderBottomColor: 'rgba(255,255,255,0.6)', borderLeftColor: 'rgba(255,255,255,0.6)', borderTopColor: 'transparent' }} />
                ) : (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M10.5 1.5L5 6M10.5 1.5L7.5 10.5L5 6M10.5 1.5L1.5 4.5L5 6" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Profile Panel ── */}
      <div className="w-72 flex-shrink-0 rounded-xl overflow-hidden flex flex-col" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
        <LiveProfilePanel state={profileState} />
      </div>
    </div>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────
function ReviewStep({
  profileData, requirements: initReqs, profileState,
  onApprove,
}: {
  profileData: { title: string; seniority: string; location: string; employment: string };
  requirements: Requirement[];
  profileState: ProfileState | null;
  onApprove: (reqs: Requirement[], threshold: number) => void;
}) {
  const [requirements, setRequirements] = useState<Requirement[]>(initReqs);
  const [threshold, setThreshold] = useState(80);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jdText, setJdText] = useState<string | null>(null);
  const [jdLoading, setJdLoading] = useState(false);
  const [showJd, setShowJd] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateJD = async () => {
    setJdLoading(true);
    setShowJd(true);
    const text = await generateJobDescription(
      profileData.title,
      profileData.seniority,
      profileData.location,
      profileData.employment,
      profileState?.responsibilities ?? [],
      requirements.map(r => ({ name: r.name, importance: r.importance, description: r.description })),
    );
    setJdText(text);
    setJdLoading(false);
  };

  const copyJD = () => {
    if (!jdText) return;
    navigator.clipboard.writeText(jdText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalWeight = requirements.reduce((s, r) => s + r.weight, 0);

  const updateImportance = (id: string, importance: RequirementImportance) =>
    setRequirements(prev => prev.map(r => r.id === id ? { ...r, importance } : r));
  const updateWeight = (id: string, weight: number) =>
    setRequirements(prev => prev.map(r => r.id === id ? { ...r, weight: Math.max(1, Math.min(10, weight)) } : r));
  const deleteReq = (id: string) => setRequirements(prev => prev.filter(r => r.id !== id));

  const importanceColors: Record<RequirementImportance, string> = {
    mandatory: '#F87171', important: '#60A5FA', preferred: '#A78BFA', 'nice-to-have': '#6B7280'
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(245,166,35,0.1)', color: '#F5A623' }}>Awaiting approval</div>
        </div>
        <h2 className="font-display font-bold text-2xl" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.03em' }}>
          Review Position Profile
        </h2>
        <p className="text-sm mt-1" style={{ color: '#6B7B8E' }}>
          {profileData.title} · {profileData.seniority} · {profileData.location}
        </p>
      </div>

      {/* Responsibilities */}
      {profileState?.responsibilities && profileState.responsibilities.length > 0 && (
        <div className="rounded-xl mb-4 p-4" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5A6E', letterSpacing: '0.07em' }}>Responsibilities</p>
          <ul className="space-y-1">
            {profileState.responsibilities.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: '#4F7EFF', fontSize: 10, marginTop: 3 }}>●</span>
                <span className="text-sm" style={{ color: '#C4CFE0' }}>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements table */}
      <div className="rounded-xl mb-5 overflow-hidden" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
          <span className="text-xs" style={{ color: '#A78BFA' }}>✦ AI-generated — review before approval. Click importance to edit, ± to adjust weight.</span>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Requirement', 'Category', 'Importance', 'Weight', ''].map((h, i) => (
                <th key={i} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5A6E', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requirements.map((req, i) => (
              <tr key={req.id} style={{ borderBottom: i < requirements.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{req.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#4B5A6E' }}>{req.description}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs capitalize" style={{ color: '#6B7B8E' }}>{req.category}</span>
                </td>
                <td className="px-5 py-3.5">
                  {editingId === req.id ? (
                    <select value={req.importance} onChange={e => { updateImportance(req.id, e.target.value as RequirementImportance); setEditingId(null); }} onBlur={() => setEditingId(null)} autoFocus
                      className="text-xs rounded px-2 py-1 outline-none" style={{ background: '#1A2035', border: '1px solid rgba(79,126,255,0.4)', color: '#E2E8F0' }}>
                      <option value="mandatory">Mandatory</option>
                      <option value="important">Important</option>
                      <option value="preferred">Preferred</option>
                      <option value="nice-to-have">Nice to have</option>
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingId(req.id)}
                      title="Click to change importance"
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all group"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(79,126,255,0.35)'; (e.currentTarget as HTMLElement).style.background = 'rgba(79,126,255,0.06)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                      <ImportanceBadge importance={req.importance} />
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: '#4B5A6E', flexShrink: 0 }}>
                        <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </td>
                <td className="px-5 py-3.5 w-44">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((req.weight / totalWeight) * 100)}%`, background: importanceColors[req.importance] }} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateWeight(req.id, req.weight - 1)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-xs" style={{ color: '#4B5A6E' }}>−</button>
                      <span className="font-mono text-xs w-8 text-center" style={{ color: '#8896A4', fontFamily: 'JetBrains Mono, monospace' }}>
                        {Math.round((req.weight / totalWeight) * 100)}%
                      </span>
                      <button onClick={() => updateWeight(req.id, req.weight + 1)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-xs" style={{ color: '#4B5A6E' }}>+</button>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <button onClick={() => deleteReq(req.id)} className="p-1 rounded hover:bg-red-500/10 transition-colors" style={{ color: '#4B5A6E' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4 3V2h4v1M5 5.5v3M7 5.5v3M3 3l.7 7h4.6L9 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Threshold */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-medium mb-3" style={{ color: '#8896A4' }}>Qualification threshold</p>
          <div className="flex items-center gap-3">
            <input type="range" min={50} max={95} step={5} value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="flex-1" style={{ accentColor: '#4F7EFF' }} />
            <span className="font-mono text-lg font-semibold w-12 text-right" style={{ color: '#4F7EFF', fontFamily: 'JetBrains Mono, monospace' }}>{threshold}%</span>
          </div>
          <p className="text-xs mt-1.5" style={{ color: '#4B5A6E' }}>Candidates above this threshold are flagged as qualified.</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-medium mb-3" style={{ color: '#8896A4' }}>Weight distribution</p>
          <div className="space-y-2.5">
            {([
              { key: 'mandatory', label: 'Mandatory', color: '#F87171' },
              { key: 'important', label: 'Important', color: '#60A5FA' },
              { key: 'preferred', label: 'Preferred', color: '#A78BFA' },
              { key: 'nice-to-have', label: 'Nice to have', color: '#6B7280' },
            ] as { key: RequirementImportance; label: string; color: string }[]).map(({ key, label, color }) => {
              const groupWeight = requirements.filter(r => r.importance === key).reduce((s, r) => s + r.weight, 0);
              const pct = totalWeight > 0 ? Math.round((groupWeight / totalWeight) * 100) : 0;
              if (pct === 0) return null;
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs" style={{ color }}>{label}</span>
                    <span className="font-mono text-xs" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>{pct}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color, opacity: 0.7 }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-1 flex justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-xs" style={{ color: '#4B5A6E' }}>{requirements.length} requirements</span>
              <span className="font-mono text-xs" style={{ color: '#4B5A6E', fontFamily: 'JetBrains Mono, monospace' }}>Σ 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Job Description panel */}
      {showJd && (
        <div className="rounded-xl mb-5 overflow-hidden" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(79,126,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="1.5" width="10" height="10" rx="2" stroke="#4F7EFF" strokeWidth="1.3"/><path d="M4 5h5M4 7h3.5" stroke="#4F7EFF" strokeWidth="1.3" strokeLinecap="round"/></svg>
              <p className="text-xs font-semibold" style={{ color: '#4F7EFF' }}>Generated Job Description</p>
            </div>
            <div className="flex items-center gap-2">
              {!jdLoading && jdText && (
                <button
                  onClick={copyJD}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{ background: copied ? 'rgba(15,217,155,0.15)' : 'rgba(255,255,255,0.06)', color: copied ? '#0FD99B' : '#8896A4', border: `1px solid ${copied ? 'rgba(15,217,155,0.25)' : 'rgba(255,255,255,0.08)'}` }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              )}
              <button onClick={() => setShowJd(false)} className="p-1 rounded hover:bg-white/5 transition-colors" style={{ color: '#4B5A6E' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
          <div className="p-5 max-h-96 overflow-y-auto">
            {jdLoading ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0" style={{ borderRightColor: '#4F7EFF', borderBottomColor: '#4F7EFF', borderLeftColor: '#4F7EFF', borderTopColor: 'transparent' }} />
                <p className="text-sm" style={{ color: '#4B5A6E' }}>Generating job description…</p>
              </div>
            ) : jdText ? (
              <div className="prose prose-invert max-w-none">
                {jdText.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-semibold mt-4 mb-1.5 first:mt-0" style={{ color: '#F0F4FF' }}>{line.replace('## ', '')}</h3>;
                  if (line.startsWith('- **') || line.startsWith('- ')) return <li key={i} className="text-sm ml-4 mb-1" style={{ color: '#8896A4', listStyleType: 'disc' }}>{line.replace(/^- \*\*(.*?)\*\*:/, (_, g) => `${g}:`).replace(/^- /, '')}</li>;
                  if (line.trim() === '') return <div key={i} className="h-2" />;
                  return <p key={i} className="text-sm mb-2 leading-relaxed" style={{ color: '#C4CFE0' }}>{line}</p>;
                })}
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#F05252' }}>Failed to generate. Please try again.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: '#4B5A6E' }}>AI generates · Recruiter approves</p>
        <div className="flex gap-3">
          <Btn
            variant="secondary"
            onClick={handleGenerateJD}
            disabled={jdLoading}
          >
            {jdLoading ? (
              <><div className="w-3 h-3 rounded-full border animate-spin" style={{ borderRightColor: 'rgba(255,255,255,0.5)', borderBottomColor: 'rgba(255,255,255,0.5)', borderLeftColor: 'rgba(255,255,255,0.5)', borderTopColor: 'transparent' }} />Generating…</>
            ) : (
              <><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 4.5h5M3 6.5h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>Generate Job Description</>
            )}
          </Btn>
          <Btn variant="primary" onClick={() => onApprove(requirements, threshold)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Approve Position Profile
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Main CreateProfile ───────────────────────────────────────────────────────
export default function CreateProfile({ nav }: CreateProfileProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profileData, setProfileData] = useState({ title: '', seniority: 'Senior', location: '', employment: 'Full-time', description: '' });
  const [conversationReqs, setConversationReqs] = useState<Requirement[]>([]);
  const [conversationProfileState, setConversationProfileState] = useState<ProfileState | null>(null);

  const steps = ['Position Setup', 'AI Conversation', 'Review & Approve'];

  const handleApprove = (requirements: Requirement[], threshold: number) => {
    const newProfile: PositionProfile = {
      id: `pos-${Date.now()}`,
      title: profileData.title,
      seniority: profileData.seniority !== 'Not specified' ? profileData.seniority : '',
      location: profileData.location,
      employmentType: profileData.employment,
      status: 'active',
      requirements,
      threshold,
      candidates: [],
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    nav.onProfileCreated(newProfile);
  };

  return (
    <div className="bg-mesh min-h-full flex flex-col">
      <div className="max-w-5xl mx-auto w-full px-6 pt-8 pb-6 flex-shrink-0">
        <button onClick={nav.goHome} className="flex items-center gap-1.5 text-xs mb-5 transition-colors hover:text-white" style={{ color: '#4B5A6E' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9.5 6h-7M5.5 3l-3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          All positions
        </button>
        <div className="flex items-center gap-0 mb-6">
          {steps.map((s, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: isDone ? '#0FD99B' : isActive ? 'linear-gradient(135deg, #4F7EFF 0%, #6B3FE4 100%)' : 'rgba(255,255,255,0.06)', color: isDone || isActive ? 'white' : '#4B5A6E' }}>
                    {isDone ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : i + 1}
                  </div>
                  <span className="text-xs font-medium" style={{ color: isActive ? '#E2E8F0' : '#4B5A6E' }}>{s}</span>
                </div>
                {i < steps.length - 1 && <div className="h-px w-8 mx-3" style={{ background: isDone ? '#0FD99B' : 'rgba(255,255,255,0.08)' }} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 pb-12">
        {step === 1 && (
          <SetupStep onNext={data => { setProfileData(data); setStep(2); }} />
        )}
        {step === 2 && (
          <ConversationStep
            profileData={profileData}
            onComplete={(reqs, state) => { setConversationReqs(reqs); setConversationProfileState(state); setStep(3); }}
          />
        )}
        {step === 3 && (
          <ReviewStep
            profileData={profileData}
            requirements={conversationReqs}
            profileState={conversationProfileState}
            onApprove={handleApprove}
          />
        )}
      </div>
    </div>
  );
}
