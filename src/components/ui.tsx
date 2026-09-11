import { ReactNode } from 'react';
import { RequirementImportance, EvidenceStrength, CandidateStatus, AssessmentStatus, ProfileStatus } from '../data';

// ─── Score Ring ──────────────────────────────────────────────────────────────
interface ScoreRingProps { score: number; size?: number; stroke?: number; dim?: boolean; }
export function ScoreRing({ score, size = 80, stroke = 6, dim = false }: ScoreRingProps) {
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = dim ? '#3A4560' : score >= 80 ? '#0FD99B' : score >= 65 ? '#F5A623' : '#F05252';
  const textColor = dim ? '#3A4560' : score >= 80 ? '#0FD99B' : score >= 65 ? '#F5A623' : '#F05252';

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="ring-animate"
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono font-semibold" style={{ fontSize: size * 0.195, color: textColor, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em' }}>
          {score}%
        </span>
      </div>
    </div>
  );
}

// ─── Importance Badge ─────────────────────────────────────────────────────────
const importanceMeta: Record<RequirementImportance, { label: string; color: string; bg: string }> = {
  'mandatory':     { label: 'Mandatory',     color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
  'important':     { label: 'Important',     color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
  'preferred':     { label: 'Preferred',     color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
  'nice-to-have':  { label: 'Nice to have',  color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
};
export function ImportanceBadge({ importance }: { importance: RequirementImportance }) {
  const m = importanceMeta[importance];
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: m.color, background: m.bg, fontFamily: 'Inter, sans-serif' }}>
      {m.label}
    </span>
  );
}

// ─── Evidence Badge ───────────────────────────────────────────────────────────
export function EvidenceBadge({ strength }: { strength: EvidenceStrength }) {
  const meta = {
    strong:   { label: 'Strong',    color: '#0FD99B', bg: 'rgba(15,217,155,0.1)', dot: '#0FD99B' },
    moderate: { label: 'Moderate',  color: '#F5A623', bg: 'rgba(245,166,35,0.1)',  dot: '#F5A623' },
    none:     { label: 'No evidence', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', dot: '#6B7280' },
  }[strength];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: meta.color, background: meta.bg }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

// ─── Candidate Status Badge ───────────────────────────────────────────────────
export function CandidateStatusBadge({ status }: { status: CandidateStatus }) {
  const meta: Record<CandidateStatus, { label: string; color: string; bg: string }> = {
    'processing':           { label: 'Processing',         color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
    'processing-failed':    { label: 'Failed',             color: '#F05252', bg: 'rgba(240,82,82,0.1)' },
    'matched':              { label: 'Matched',            color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
    'reviewed':             { label: 'Reviewed',           color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
    'selected':             { label: 'Selected',           color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
    'assessment-draft':     { label: 'Assessment Draft',   color: '#F5A623', bg: 'rgba(245,166,35,0.1)' },
    'assessment-approved':  { label: 'Assessment Ready',   color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
    'assessment-sent':      { label: 'Assessment Sent',    color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
    'assessment-completed': { label: 'Assessment Done',    color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
    'verified':             { label: 'Verified',           color: '#0FD99B', bg: 'rgba(15,217,155,0.1)' },
  };
  const m = meta[status] ?? meta['matched'];
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap" style={{ color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

// ─── Profile Status Badge ─────────────────────────────────────────────────────
export function ProfileStatusBadge({ status }: { status: ProfileStatus }) {
  const meta: Record<ProfileStatus, { label: string; color: string; bg: string }> = {
    'draft':             { label: 'Draft',           color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
    'ai-conversation':   { label: 'In Conversation', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
    'ready-for-review':  { label: 'Awaiting Review', color: '#F5A623', bg: 'rgba(245,166,35,0.1)' },
    'approved':          { label: 'Approved',        color: '#0FD99B', bg: 'rgba(15,217,155,0.1)' },
    'active':            { label: 'Active',          color: '#0FD99B', bg: 'rgba(15,217,155,0.1)' },
  };
  const m = meta[status];
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

// ─── Assessment Status Badge ──────────────────────────────────────────────────
export function AssessmentStatusBadge({ status }: { status: AssessmentStatus }) {
  const meta: Record<AssessmentStatus, { label: string; color: string }> = {
    'none':       { label: 'Not started', color: '#6B7280' },
    'generating': { label: 'Generating',  color: '#A78BFA' },
    'draft':      { label: 'Draft',       color: '#F5A623' },
    'approved':   { label: 'Approved',    color: '#34D399' },
    'sent':       { label: 'Sent',        color: '#60A5FA' },
    'opened':     { label: 'Opened',      color: '#60A5FA' },
    'completed':  { label: 'Completed',   color: '#A78BFA' },
    'evaluated':  { label: 'Evaluated',   color: '#0FD99B' },
  };
  const m = meta[status];
  return <span className="text-xs font-medium" style={{ color: m.color }}>{m.label}</span>;
}

// ─── Discrepancy Alert ────────────────────────────────────────────────────────
export function DiscrepancyAlert({ cvScore, verifiedScore }: { cvScore: number; verifiedScore: number }) {
  const delta = cvScore - verifiedScore;
  if (delta < 15) return null;
  const severe = delta >= 25;
  return (
    <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5" style={{ background: severe ? 'rgba(240,82,82,0.08)' : 'rgba(245,166,35,0.08)', border: `1px solid ${severe ? 'rgba(240,82,82,0.25)' : 'rgba(245,166,35,0.25)'}` }}>
      <span style={{ fontSize: 14 }}>{severe ? '⚠️' : '🔔'}</span>
      <div>
        <p className="text-xs font-semibold" style={{ color: severe ? '#F87171' : '#F5A623' }}>
          {delta}pt discrepancy detected
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#8896A4' }}>
          {severe ? 'High CV alignment but low demonstrated technical proficiency.' : 'Notable gap between CV claims and verified skills.'}
        </p>
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl w-fit" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
      {[1, 2, 3].map(i => (
        <span key={i} className={`dot-${i}`} style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#A78BFA' }} />
      ))}
    </div>
  );
}

// ─── Nav Bar ──────────────────────────────────────────────────────────────────
interface NavProps { onLogoClick: () => void; onNewPosition: () => void; }
export function Nav({ onLogoClick, onNewPosition }: NavProps) {
  return (
    <header className="flex items-center justify-between px-6 h-14 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,10,16,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
      <button onClick={onLogoClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4F7EFF 0%, #6B3FE4 100%)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M7 4L10 5.5V8.5L7 10L4 8.5V5.5L7 4Z" fill="white"/>
          </svg>
        </div>
        <span className="font-display font-semibold text-base tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
          qualifi
        </span>
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={onNewPosition}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #4F7EFF 0%, #6B3FE4 100%)', color: 'white' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
          New Position
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: 'rgba(79,126,255,0.15)', color: '#4F7EFF', border: '1px solid rgba(79,126,255,0.3)' }}>
          RT
        </div>
      </div>
    </header>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {icon}
      </div>
      <h3 className="font-semibold text-sm mb-1.5" style={{ color: '#E2E8F0' }}>{title}</h3>
      <p className="text-sm mb-5" style={{ color: '#6B7B8E', maxWidth: 300 }}>{description}</p>
      {action}
    </div>
  );
}

// ─── Weight Bar ───────────────────────────────────────────────────────────────
export function WeightBar({ weight, totalWeight }: { weight: number; totalWeight?: number; max?: number }) {
  const pct = totalWeight && totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : Math.round((weight / 5) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4F7EFF, #8B5CF6)' }} />
      </div>
      <span className="font-mono text-xs w-7 text-right" style={{ color: '#6B7B8E', fontFamily: 'JetBrains Mono, monospace' }}>{pct}%</span>
    </div>
  );
}

// ─── Score Bar (mini horizontal) ─────────────────────────────────────────────
export function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full h-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color, transition: 'width 0.8s ease' }} />
      </div>
      <span className="font-mono text-xs w-8 text-right flex-shrink-0" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>{score}%</span>
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface BtnProps {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md'; disabled?: boolean; fullWidth?: boolean; type?: 'button' | 'submit';
}
export function Btn({ children, onClick, variant = 'secondary', size = 'md', disabled, fullWidth, type = 'button' }: BtnProps) {
  const base = "inline-flex items-center justify-center gap-1.5 font-medium transition-all rounded-lg active:scale-95 disabled:opacity-40 disabled:pointer-events-none";
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  const variants = {
    primary:   'text-white hover:opacity-90',
    secondary: 'text-slate-300 hover:text-white hover:bg-white/5',
    ghost:     'text-slate-400 hover:text-slate-200 hover:bg-white/5',
    danger:    'text-white hover:opacity-90',
  };
  const primaryStyle = variant === 'primary' ? { background: 'linear-gradient(135deg, #4F7EFF 0%, #6B3FE4 100%)' } : {};
  const secondaryStyle = variant === 'secondary' ? { border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' } : {};
  const dangerStyle = variant === 'danger' ? { background: '#DC2626' } : {};

  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
      style={{ ...primaryStyle, ...secondaryStyle, ...dangerStyle }}
    >
      {children}
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5A6E', letterSpacing: '0.08em' }}>{children}</p>;
}
