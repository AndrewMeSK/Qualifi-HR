import { useState } from 'react';
import { PositionProfile } from '../data';
import { Btn, EmptyState } from '../components/ui';

interface HomeProps {
  positions: PositionProfile[];
  nav: { goCreate: () => void; goWorkspace: (id: string) => void };
  onDelete: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isPositionActive(position: PositionProfile): boolean {
  return position.candidates.some(
    c => c.assessmentStatus === 'sent' || c.assessmentStatus === 'opened' ||
         c.assessmentStatus === 'completed' || c.assessmentStatus === 'evaluated',
  );
}

function DeleteConfirmModal({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 animate-fade-up"
        style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.09)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(240,82,82,0.1)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 4.5h12M6 4.5V3h6v1.5M7.5 8v5M10.5 8v5M4.5 4.5L5.25 15h7.5l.75-10.5" stroke="#F05252" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="font-display font-semibold text-base mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.02em' }}>
          Delete position profile?
        </h3>
        <p className="text-sm mb-5" style={{ color: '#4B5A6E' }}>
          <span style={{ color: '#8896A4' }}>"{title}"</span> and all its candidates and assessments will be permanently removed. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Btn variant="secondary" fullWidth onClick={onCancel}>Cancel</Btn>
          <Btn variant="danger" fullWidth onClick={onConfirm}>Delete</Btn>
        </div>
      </div>
    </div>
  );
}

function PositionCard({ position, onClick, onDelete }: { position: PositionProfile; onClick: () => void; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const verified = position.candidates.filter(c => c.verifiedSkillScore !== null).length;
  const aboveThreshold = position.candidates.filter(c => c.cvMatchScore >= position.threshold).length;
  const avgMatch = position.candidates.filter(c => c.cvMatchScore > 0).length
    ? Math.round(position.candidates.filter(c => c.cvMatchScore > 0).reduce((s, c) => s + c.cvMatchScore, 0) / position.candidates.filter(c => c.cvMatchScore > 0).length)
    : null;

  const active = isPositionActive(position);
  const hasCandidates = position.candidates.length > 0;
  const sentCount = position.candidates.filter(c => ['sent', 'opened', 'completed', 'evaluated'].includes(c.assessmentStatus)).length;
  const isDraft = !active && !hasCandidates;

  return (
    <>
      {confirmDelete && (
        <DeleteConfirmModal
          title={position.title}
          onConfirm={() => { setConfirmDelete(false); onDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      <div
        className="rounded-xl cursor-pointer transition-all duration-200 hover:translate-y-[-2px] animate-fade-up relative group"
        style={{ background: isDraft ? '#0C0F18' : '#0E1117', border: isDraft ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.09)' }}
        onClick={onClick}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.border = isDraft ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(79,126,255,0.3)';
          if (!isDraft) el.style.boxShadow = '0 0 0 1px rgba(79,126,255,0.1), 0 8px 32px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.border = isDraft ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.09)';
          el.style.boxShadow = 'none';
        }}
      >
        {/* Active indicator stripe */}
        {active && <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: 'linear-gradient(90deg, #4F7EFF, #0FD99B)' }} />}

        {/* Delete button */}
        <button
          className="absolute top-3 right-3 w-7 h-7 rounded-lg items-center justify-center transition-all opacity-0 group-hover:opacity-100 hidden group-hover:flex z-10"
          style={{ background: 'rgba(240,82,82,0.1)', color: '#F05252' }}
          onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
          title="Delete position"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 3h8M4 3V2h4v1M3 3l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="p-5">
          {/* Status + title */}
          <div className="flex items-start mb-3 pr-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {active ? (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(15,217,155,0.1)', color: '#0FD99B', border: '1px solid rgba(15,217,155,0.2)' }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#0FD99B' }} />
                    Active
                  </span>
                ) : hasCandidates ? (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,166,35,0.08)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.15)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F5A623' }} />
                    Candidates added
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.04)', color: '#4B5A6E', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4B5A6E' }} />
                    Draft
                  </span>
                )}
              </div>
              <h3 className="font-display font-semibold text-base leading-tight truncate" style={{ fontFamily: 'Outfit, sans-serif', color: isDraft ? '#8896A4' : '#F0F4FF', letterSpacing: '-0.02em' }}>
                {position.title}
              </h3>
              <p className="text-xs mt-0.5 truncate" style={{ color: '#4B5A6E' }}>
                {[position.seniority, position.location, position.employmentType].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          {/* Stats */}
          {hasCandidates ? (
            <div className="flex items-center gap-4 mt-4 mb-3 flex-wrap">
              <div>
                <p className="font-mono text-xl font-semibold leading-none" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#F0F4FF' }}>
                  {position.candidates.length}
                </p>
                <p className="text-xs mt-1" style={{ color: '#4B5A6E' }}>Candidates</p>
              </div>
              {aboveThreshold > 0 && <>
                <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div>
                  <p className="font-mono text-xl font-semibold leading-none" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#0FD99B' }}>{aboveThreshold}</p>
                  <p className="text-xs mt-1" style={{ color: '#4B5A6E' }}>Above {position.threshold}%</p>
                </div>
              </>}
              {sentCount > 0 && <>
                <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div>
                  <p className="font-mono text-xl font-semibold leading-none" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4F7EFF' }}>{sentCount}</p>
                  <p className="text-xs mt-1" style={{ color: '#4B5A6E' }}>Sent assessments</p>
                </div>
              </>}
              {verified > 0 && <>
                <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div>
                  <p className="font-mono text-xl font-semibold leading-none" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#A78BFA' }}>{verified}</p>
                  <p className="text-xs mt-1" style={{ color: '#4B5A6E' }}>Verified</p>
                </div>
              </>}
              {avgMatch && <>
                <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div>
                  <p className="font-mono text-xl font-semibold leading-none" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#60A5FA' }}>{avgMatch}%</p>
                  <p className="text-xs mt-1" style={{ color: '#4B5A6E' }}>Avg match</p>
                </div>
              </>}
            </div>
          ) : (
            <div className="py-3">
              <p className="text-sm" style={{ color: '#3A4560' }}>
                {position.requirements.length === 0
                  ? 'No requirements defined yet — continue setup.'
                  : `${position.requirements.length} requirement${position.requirements.length !== 1 ? 's' : ''} defined · Add candidates to activate.`}
              </p>
            </div>
          )}

          {/* Requirements pills */}
          {position.requirements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {position.requirements.slice(0, 4).map(r => (
                <span key={r.id} className="text-xs px-2 py-0.5 rounded-md" style={{ background: isDraft ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)', color: isDraft ? '#4B5A6E' : '#8896A4' }}>
                  {r.name}
                </span>
              ))}
              {position.requirements.length > 4 && (
                <span className="text-xs px-2 py-0.5 rounded-md" style={{ color: '#3A4560' }}>+{position.requirements.length - 4} more</span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${isDraft ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)'}` }}>
          <span className="text-xs" style={{ color: '#3A4560' }}>Updated {formatDate(position.lastUpdated)}</span>
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: isDraft ? '#4B5A6E' : '#4F7EFF' }}>
            {isDraft ? 'Set up position' : 'Open workspace'}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Home({ positions, nav, onDelete }: HomeProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'draft'>('all');

  const activeCount = positions.filter(isPositionActive).length;
  const draftCount = positions.length - activeCount;

  const filtered = positions.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const active = isPositionActive(p);
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && active) ||
      (filter === 'draft' && !active);
    return matchSearch && matchFilter;
  });

  return (
    <div className="bg-mesh min-h-full">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4F7EFF', letterSpacing: '0.1em' }}>Recruiter Dashboard</p>
            <h1 className="font-display text-3xl font-bold leading-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.03em' }}>
              Position Profiles
            </h1>
            <p className="text-sm mt-1.5 flex items-center gap-3" style={{ color: '#6B7B8E' }}>
              <span>{positions.length} position{positions.length !== 1 ? 's' : ''}</span>
              {activeCount > 0 && <span className="flex items-center gap-1.5" style={{ color: '#0FD99B' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0FD99B' }} />{activeCount} active</span>}
              {draftCount > 0 && <span style={{ color: '#4B5A6E' }}>{draftCount} draft</span>}
            </p>
          </div>
          <Btn variant="primary" onClick={nav.goCreate}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
            Create Position Profile
          </Btn>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#4B5A6E" strokeWidth="1.5"/>
              <path d="M9.5 9.5L12 12" stroke="#4B5A6E" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search positions…"
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E2E8F0' }}
              onFocus={e => { e.currentTarget.style.border = '1px solid rgba(79,126,255,0.4)'; }}
              onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; }}
            />
          </div>
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {([
              { key: 'all', label: `All (${positions.length})` },
              { key: 'active', label: `Active (${activeCount})` },
              { key: 'draft', label: `Draft (${draftCount})` },
            ] as { key: typeof filter; label: string }[]).map((f, i, arr) => (
              <button
                key={f.key} onClick={() => setFilter(f.key)}
                className="px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: filter === f.key ? 'rgba(79,126,255,0.15)' : 'rgba(255,255,255,0.02)',
                  color: filter === f.key ? '#4F7EFF' : '#6B7B8E',
                  borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-16">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2.5" stroke="#4B5A6E" strokeWidth="1.5"/><path d="M7 10h6M7 7h4" stroke="#4B5A6E" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            title={search ? `No positions matching "${search}"` : filter === 'active' ? 'No active positions yet' : filter === 'draft' ? 'No draft positions' : 'No position profiles yet'}
            description={search ? 'Try a different search term.' : filter !== 'all' ? 'Switch to "All" to see every position.' : 'Create your first Position Profile to start qualifying candidates.'}
            action={!search && filter === 'all' ? <Btn variant="primary" onClick={nav.goCreate}>Create Position Profile</Btn> : undefined}
          />
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {filtered.map(p => (
              <PositionCard key={p.id} position={p} onClick={() => nav.goWorkspace(p.id)} onDelete={() => onDelete(p.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
