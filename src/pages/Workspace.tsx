import { useState, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PositionProfile, Candidate, CandidateStatus } from '../data';
import { ScoreRing, CandidateStatusBadge, ProfileStatusBadge, ImportanceBadge, WeightBar, Btn, EmptyState } from '../components/ui';
import { scoreCVAgainstPosition } from '../services/openai';

// PDF.js worker via CDN — avoids Vite bundler config
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface WorkspaceProps {
  position: PositionProfile;
  nav: { goHome: () => void; goCandidate: (id: string) => void };
  onCandidatesAdded: (positionId: string, candidates: Candidate[]) => void;
}

type WorkspaceTab = 'candidates' | 'profile';
type SortKey = 'cvMatch' | 'verifiedSkill' | 'name' | 'status';
type FilterKey = 'all' | 'above' | 'below' | 'verified'; // v2

// ─── Candidate generator ───────────────────────────────────────────────────────
function nameFromFilename(filename: string): string {
  const base = filename.replace(/\.(pdf|docx|doc)$/i, '');
  const cleaned = base
    .replace(/([-_]cv|[-_]resume|resume[-_]|cv[-_])/gi, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(' ').filter(w => w.length > 1 && !/^\d+$/.test(w)).slice(0, 2);
  if (words.length === 0) return 'Unknown Candidate';
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;

async function extractCVText(file: File): Promise<string> {
  // PDF: use PDF.js for proper text extraction (handles compressed streams)
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    try {
      const buf = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      const pages: string[] = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 6); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pages.push(
          content.items
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((item: any) => 'str' in item)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => item.str as string)
            .join(' ')
        );
      }
      return pages.join('\n').replace(/\s+/g, ' ').trim().slice(0, 6000);
    } catch (e) {
      console.warn('PDF.js extraction failed, falling back:', e);
    }
  }

  // For .docx and other formats: read as text (works for plain text / some DOCX variants)
  // Also use as fallback for PDFs that PDF.js couldn't parse
  const [rawText, binText] = await Promise.all([
    new Promise<string>(res => {
      const r = new FileReader(); r.onload = e => res((e.target?.result as string) ?? ''); r.onerror = () => res(''); r.readAsText(file);
    }),
    new Promise<string>(res => {
      const r = new FileReader();
      r.onload = e => {
        const buf = e.target?.result as ArrayBuffer;
        if (!buf) return res('');
        const bytes = new Uint8Array(buf);
        let t = '';
        const end = Math.min(bytes.length, 400_000);
        for (let i = 0; i < end; i++) {
          const b = bytes[i];
          if (b >= 32 && b <= 126) t += String.fromCharCode(b);
          else if (b === 10 || b === 13) t += ' ';
        }
        res(t);
      };
      r.onerror = () => res('');
      r.readAsArrayBuffer(file);
    }),
  ]);

  const readability = (s: string) => s.length === 0 ? 0 : s.split('').filter(c => /[a-zA-Z\s]/.test(c)).length / s.length;
  const best = readability(rawText) > 0.5 ? rawText : binText;
  return best.replace(/\s+/g, ' ').trim().slice(0, 6000);
}

async function extractEmailFromFile(file: File): Promise<string | null> {
  const text = await extractCVText(file);
  const m = text.match(EMAIL_RE);
  return m ? m[0] : null;
}

let _candidateSeq = 0;
function buildCandidate(filename: string, email: string | null): Candidate {
  const name = nameFromFilename(filename);
  return {
    id: `c-up-${++_candidateSeq}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    email: email ?? '',
    currentRole: 'Pending CV review',
    company: '—',
    location: '—',
    cvMatchScore: 0,
    verifiedSkillScore: null,
    assessmentScore: null,
    status: 'matched' as CandidateStatus,
    assessmentStatus: 'none',
    skills: [],
    experience: '',
    evidence: [],
  };
}

function generateToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

// ─── Send Assessment Modal ─────────────────────────────────────────────────────
function SendAssessmentModal({
  candidates, position, onClose, onSent,
}: {
  candidates: Candidate[];
  position: PositionProfile;
  onClose: () => void;
  onSent: (ids: string[]) => void;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const handleSend = () => {
    setSending(true);
    const newLinks: Record<string, string> = {};
    candidates.forEach(c => {
      newLinks[c.id] = `${window.location.origin}/?assess=${c.id}&pos=${position.id}&t=${generateToken()}`;
    });
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setLinks(newLinks);
      onSent(candidates.map(c => c.id));
    }, 1400);
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(links[id]).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-up" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.09)', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h3 className="font-display font-semibold text-base" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.02em' }}>
              {sent ? 'Assessments sent' : `Send assessment to ${candidates.length} candidate${candidates.length !== 1 ? 's' : ''}`}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#4B5A6E' }}>
              {sent ? 'Assessment links are active.' : `Each candidate receives a unique, position-specific assessment for: ${position.title}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: '#6B7B8E' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Candidate list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {candidates.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: 'rgba(79,126,255,0.15)', color: '#4F7EFF' }}>
                {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{c.name}</p>
                {c.email ? (
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#4B5A6E' }}>
                    <span style={{ color: '#0FD99B', fontSize: 10 }}>✓</span>
                    {c.email}
                  </p>
                ) : (
                  <p className="text-xs mt-0.5" style={{ color: '#F5A623' }}>⚠ No email extracted from CV</p>
                )}
              </div>
              {sent && links[c.id] ? (
                <button
                  onClick={() => copyLink(c.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: copied === c.id ? 'rgba(15,217,155,0.15)' : 'rgba(79,126,255,0.12)',
                    color: copied === c.id ? '#0FD99B' : '#4F7EFF',
                    border: `1px solid ${copied === c.id ? 'rgba(15,217,155,0.3)' : 'rgba(79,126,255,0.25)'}`,
                  }}
                >
                  {copied === c.id ? (
                    <><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5L8.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>
                  ) : (
                    <><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="3.5" y="1" width="5.5" height="7" rx="1" stroke="currentColor" strokeWidth="1"/><rect x="1" y="3" width="5.5" height="7" rx="1" stroke="currentColor" strokeWidth="1" fill="#0E1117"/></svg>Copy link</>
                  )}
                </button>
              ) : !sent ? (
                <span className="font-mono text-xs" style={{ color: '#4B5A6E', fontFamily: 'JetBrains Mono, monospace' }}>{c.cvMatchScore}%</span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {!sent ? (
            <>
              <p className="text-xs mb-3" style={{ color: '#4B5A6E' }}>
                Each candidate gets a unique assessment link generated from the Position Profile and their CV. Where an email is available, you can email the link directly.
              </p>
              <div className="flex gap-3">
                <Btn variant="secondary" fullWidth onClick={onClose}>Cancel</Btn>
                <Btn variant="primary" fullWidth onClick={handleSend} disabled={sending}>
                  {sending ? (
                    <><div className="w-3 h-3 rounded-full border border-t-transparent animate-spin flex-shrink-0" style={{ borderRightColor: 'rgba(255,255,255,0.5)', borderBottomColor: 'rgba(255,255,255,0.5)', borderLeftColor: 'rgba(255,255,255,0.5)', borderTopColor: 'transparent' }} />Generating…</>
                  ) : (
                    <>Confirm & send {candidates.length} assessment{candidates.length !== 1 ? 's' : ''}</>
                  )}
                </Btn>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: '#0FD99B' }}>
                ✓ {candidates.length} assessment{candidates.length !== 1 ? 's' : ''} sent — links are active for 7 days
              </p>
              <Btn variant="primary" size="sm" onClick={onClose}>Done</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Upload Drawer ─────────────────────────────────────────────────────────────
function UploadDrawer({
  onClose,
  onCandidatesReady,
  position,
}: {
  onClose: () => void;
  onCandidatesReady: (candidates: Candidate[]) => void;
  position: PositionProfile;
}) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<{ name: string; state: 'uploading' | 'processing' | 'done' | 'failed' }[]>([]);
  const [allDone, setAllDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firedRef = useRef(false);

  // Real upload: reads files, extracts text+email, scores CV against position
  const processFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return;
    setAllDone(false);
    firedRef.current = false;

    const names = fileList.map(f => f.name);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const newOnes = names.filter(n => !existing.has(n)).map(name => ({ name, state: 'uploading' as const }));
      return [...prev, ...newOnes];
    });

    names.forEach((name, i) => {
      setTimeout(() => setFiles(prev => prev.map(f => f.name === name ? { ...f, state: 'processing' } : f)), 300 + i * 100);
    });

    // Extract full CV text + email from all files in parallel
    const textResults = await Promise.all(fileList.map(f => extractCVText(f)));
    const emailResults = textResults.map(t => { const m = t.match(EMAIL_RE); return m ? m[0] : null; });

    // Score each CV against position requirements in parallel (gpt-4o-mini)
    const scoreResults = await Promise.all(
      textResults.map(text => scoreCVAgainstPosition(text, position.title, position.requirements))
    );

    const candidates: Candidate[] = [];
    fileList.forEach((file, i) => {
      setFiles(prev => prev.map(f => f.name === file.name ? { ...f, state: 'done' } : f));
      const c = buildCandidate(file.name, emailResults[i]);
      c.cvMatchScore = scoreResults[i].score;
      c.evidence = scoreResults[i].evidence;
      c.resumeUrl = URL.createObjectURL(file);
      c.resumeFileName = file.name;
      candidates.push(c);
    });

    if (!firedRef.current) {
      firedRef.current = true;
      setTimeout(() => {
        onCandidatesReady(candidates);
        setAllDone(true);
      }, 200);
    }
  };

  // Demo path: no real files, use placeholder names with no email
  const handleDemo = () => {
    const demoNames = ['sarah_chen_cv.pdf', 'omar_khalid_resume.pdf', 'marcus_johnson_cv.pdf', 'elena_torres.pdf', 'priya_patel_cv.pdf'];
    setAllDone(false);
    firedRef.current = false;
    setFiles(demoNames.map(name => ({ name, state: 'uploading' as const })));
    demoNames.forEach((name, i) => {
      setTimeout(() => setFiles(prev => prev.map(f => f.name === name ? { ...f, state: 'processing' } : f)), 300 + i * 120);
      setTimeout(() => setFiles(prev => prev.map(f => f.name === name ? { ...f, state: 'done' } : f)), 1000 + i * 200);
    });
    const delay = 1000 + demoNames.length * 200 + 300;
    setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        const candidates = demoNames.map(n => buildCandidate(n, null));
        onCandidatesReady(candidates);
        setAllDone(true);
      }
    }, delay);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const stateColors = { uploading: '#60A5FA', processing: '#F5A623', done: '#0FD99B', failed: '#F05252' };
  const stateLabels = { uploading: 'Uploading', processing: 'Processing', done: 'Processed', failed: 'Failed' };
  const doneCount = files.filter(f => f.state === 'done').length;
  const failCount = files.filter(f => f.state === 'failed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-xl rounded-t-2xl overflow-hidden animate-fade-up" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h3 className="font-display font-semibold text-base" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.02em' }}>Add candidates</h3>
            <p className="text-xs mt-0.5" style={{ color: '#4B5A6E' }}>Upload CVs — candidates will be extracted and added to this position</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#6B7B8E' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-8 text-center cursor-pointer transition-all mb-4"
            style={{ border: `1.5px dashed ${dragging ? '#4F7EFF' : 'rgba(255,255,255,0.12)'}`, background: dragging ? 'rgba(79,126,255,0.06)' : 'rgba(255,255,255,0.02)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1v10M9 1L6 4M9 1l3 3" stroke="#4F7EFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 13v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="#4B5A6E" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: '#E2E8F0' }}>Drop CVs here or click to browse</p>
            <p className="text-xs" style={{ color: '#4B5A6E' }}>PDF, DOCX · Multiple files supported</p>
            <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.docx"
              onChange={e => processFiles(Array.from(e.target.files ?? []))} />
          </div>

          {files.length === 0 && (
            <button onClick={handleDemo} className="w-full py-2 rounded-lg text-xs font-medium transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.07)', color: '#6B7B8E' }}>
              ↓ Load sample CVs for demo
            </button>
          )}

          {files.length > 0 && (
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs" style={{ color: '#4B5A6E' }}>
                  {doneCount} processed{failCount > 0 ? ` · ${failCount} failed` : ''}
                  {!allDone && <span style={{ color: '#F5A623' }}> · Processing…</span>}
                </p>
                {allDone && (
                  <Btn variant="primary" size="sm" onClick={onClose}>
                    Done — view {doneCount} candidate{doneCount !== 1 ? 's' : ''}
                  </Btn>
                )}
              </div>
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="1" y="1" width="8" height="8" rx="1.5" stroke="#4B5A6E" strokeWidth="1"/><path d="M3 4h4M3 6h2.5" stroke="#4B5A6E" strokeWidth="1" strokeLinecap="round"/></svg>
                  </div>
                  <p className="flex-1 text-xs truncate" style={{ color: '#8896A4' }}>{f.name}</p>
                  <div className="flex items-center gap-1.5">
                    {(f.state === 'uploading' || f.state === 'processing') && (
                      <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderRightColor: stateColors[f.state], borderBottomColor: stateColors[f.state], borderLeftColor: stateColors[f.state], borderTopColor: 'transparent' }} />
                    )}
                    <span className="text-xs" style={{ color: stateColors[f.state] }}>{stateLabels[f.state]}</span>
                  </div>
                </div>
              ))}
              {failCount > 0 && (
                <p className="text-xs" style={{ color: '#F05252' }}>
                  {failCount} file{failCount !== 1 ? 's' : ''} could not be processed. Check the format and try again.
                </p>
              )}
            </div>
          )}

          {/* Future integrations */}
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-medium mb-3" style={{ color: '#4B5A6E' }}>Future integrations</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: 'LinkedIn', icon: '💼' }, { label: 'ATS', icon: '🗂️' }, { label: 'Job boards', icon: '📋' }].map(src => (
                <button key={src.label} className="p-3 rounded-lg text-center opacity-40 cursor-not-allowed" style={{ border: '1px dashed rgba(255,255,255,0.1)', color: '#6B7B8E' }}>
                  <span className="block text-lg mb-1">{src.icon}</span>
                  <span className="text-xs">{src.label}</span>
                  <span className="block text-xs mt-0.5" style={{ color: '#3A4560' }}>Coming soon</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Candidate row ─────────────────────────────────────────────────────────────
function CandidateRow({
  candidate, onClick,
}: {
  candidate: Candidate; onClick: () => void;
}) {
  const hasDiscrepancy = candidate.verifiedSkillScore !== null && (candidate.cvMatchScore - candidate.verifiedSkillScore) >= 15;

  if (candidate.status === 'processing') {
    return (
      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <td colSpan={7} className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderRightColor: '#60A5FA', borderBottomColor: '#60A5FA', borderLeftColor: '#60A5FA', borderTopColor: 'transparent' }} />
            <p className="text-xs" style={{ color: '#4B5A6E' }}>Processing CV…</p>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className="transition-colors cursor-pointer hover:bg-white/[0.02]"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      onClick={onClick}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: 'rgba(79,126,255,0.15)', color: '#4F7EFF' }}>
            {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{candidate.name}</p>
              {hasDiscrepancy && <span style={{ fontSize: 11 }}>⚠️</span>}
            </div>
            <p className="text-xs mt-0.5 truncate max-w-44" style={{ color: '#4B5A6E' }}>{candidate.currentRole} · {candidate.company}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5"><ScoreRing score={candidate.cvMatchScore} size={36} stroke={3.5} /></td>
      <td className="px-4 py-3.5">
        {candidate.verifiedSkillScore !== null
          ? <ScoreRing score={candidate.verifiedSkillScore} size={36} stroke={3.5} />
          : <span className="font-mono text-xs" style={{ color: '#3A4560', fontFamily: 'JetBrains Mono, monospace' }}>—</span>
        }
      </td>
      <td className="px-4 py-3.5">
        {candidate.assessmentScore !== null && candidate.assessmentScore !== undefined
          ? <ScoreRing score={candidate.assessmentScore} size={36} stroke={3.5} />
          : <span className="font-mono text-xs" style={{ color: '#3A4560', fontFamily: 'JetBrains Mono, monospace' }}>—</span>
        }
      </td>
      <td className="px-4 py-3.5"><CandidateStatusBadge status={candidate.status} /></td>
      <td className="px-4 py-3.5">
        <p className="text-xs truncate max-w-36" style={{ color: '#4B5A6E' }}>{candidate.email || '—'}</p>
      </td>
      <td className="px-4 py-3.5 text-right">
        <span className="text-xs font-medium" style={{ color: '#4F7EFF' }}>View →</span>
      </td>
    </tr>
  );
}

// ─── Candidates Tab ────────────────────────────────────────────────────────────
function CandidatesTab({
  position, nav, onCandidatesAdded,
}: {
  position: PositionProfile;
  nav: WorkspaceProps['nav'];
  onCandidatesAdded: (cs: Candidate[]) => void;
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('cvMatch');
  const [filterKey, setFilterKey] = useState<FilterKey>('all');

  // Deduplicate by id before rendering to prevent React key warnings from stale state
  const uniqueCandidates = position.candidates.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
  const sorted = [...uniqueCandidates].sort((a, b) => {
    if (sortKey === 'cvMatch') return b.cvMatchScore - a.cvMatchScore;
    if (sortKey === 'verifiedSkill') return (b.verifiedSkillScore ?? -1) - (a.verifiedSkillScore ?? -1);
    if (sortKey === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const visibleCandidates = sorted.filter(c => {
    if (c.status === 'processing') return filterKey === 'all';
    if (filterKey === 'above') return c.cvMatchScore >= position.threshold;
    if (filterKey === 'below') return c.cvMatchScore < position.threshold;
    if (filterKey === 'verified') return c.verifiedSkillScore !== null;
    return true;
  });

  const above = visibleCandidates.filter(c => c.cvMatchScore >= position.threshold && c.status !== 'processing');
  const below = visibleCandidates.filter(c => c.cvMatchScore < position.threshold && c.status !== 'processing');
  const processing = visibleCandidates.filter(c => c.status === 'processing');

  const filterCounts: Record<FilterKey, number> = {
    all: uniqueCandidates.length,
    above: uniqueCandidates.filter(c => c.cvMatchScore >= position.threshold).length,
    below: uniqueCandidates.filter(c => c.cvMatchScore < position.threshold && c.status !== 'processing').length,
    verified: uniqueCandidates.filter(c => c.verifiedSkillScore !== null).length,
  };

  return (
    <>
      {showUpload && (
        <UploadDrawer
          position={position}
          onClose={() => setShowUpload(false)}
          onCandidatesReady={cs => {
            onCandidatesAdded(cs);
            setShowUpload(false);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-lg" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.02em' }}>
            Candidates
            <span className="font-mono ml-2 text-sm" style={{ color: '#4B5A6E', fontFamily: 'JetBrains Mono, monospace' }}>({uniqueCandidates.length})</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Send assessments — coming soon */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-not-allowed opacity-50" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M10.5 1.5L5 6M10.5 1.5L7.5 10.5L5 6M10.5 1.5L1.5 4.5L5 6" stroke="#8896A4" strokeWidth="1.3" strokeLinejoin="round"/></svg>
            <span className="text-xs font-medium" style={{ color: '#8896A4' }}>Send assessments</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623', fontSize: 10 }}>Soon</span>
          </div>
          <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
            className="text-xs px-2.5 py-1.5 rounded-lg outline-none appearance-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#8896A4' }}>
            <option value="cvMatch">Sort: CV Match</option>
            <option value="verifiedSkill">Sort: Verified Skill</option>
            <option value="name">Sort: Name</option>
          </select>
          <Btn variant="primary" size="sm" onClick={() => setShowUpload(true)}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v7M5.5 1L3 3.5M5.5 1L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 9h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            Add candidates
          </Btn>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4">
        {([
          { key: 'all', label: 'All' },
          { key: 'above', label: `Above ${position.threshold}%` },
          { key: 'below', label: 'Below threshold' },
          { key: 'verified', label: 'Verified' },
        ] as { key: FilterKey; label: string }[]).map(({ key, label }) => (
          <button
            key={key} onClick={() => setFilterKey(key)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: filterKey === key ? 'rgba(79,126,255,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterKey === key ? 'rgba(79,126,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: filterKey === key ? '#4F7EFF' : '#6B7B8E',
            }}
          >
            {label}
            <span className="font-mono" style={{ color: filterKey === key ? '#4F7EFF' : '#3A4560', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
              {filterCounts[key]}
            </span>
          </button>
        ))}
      </div>

      {uniqueCandidates.length === 0 ? (
        <div className="rounded-xl" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
          <EmptyState
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="#4B5A6E" strokeWidth="1.5"/><path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="#4B5A6E" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            title="No candidates yet"
            description="Upload CVs to start evaluating candidates against this position."
            action={<Btn variant="primary" onClick={() => setShowUpload(true)}>Add candidates</Btn>}
          />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Candidate', 'CV Match', 'Verified', 'Assessment', 'Status', 'Email', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5A6E', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {above.map(c => (
                <CandidateRow key={c.id} candidate={c} onClick={() => nav.goCandidate(c.id)} />
              ))}
              {above.length > 0 && below.length > 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px" style={{ background: 'rgba(245,166,35,0.25)' }} />
                      <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(245,166,35,0.1)', color: '#F5A623' }}>
                        Threshold {position.threshold}%
                      </span>
                      <div className="flex-1 h-px" style={{ background: 'rgba(245,166,35,0.25)' }} />
                    </div>
                  </td>
                </tr>
              )}
              {below.map(c => (
                <CandidateRow key={c.id} candidate={c} onClick={() => nav.goCandidate(c.id)} />
              ))}
              {processing.map(c => (
                <CandidateRow key={c.id} candidate={c} onClick={() => {}} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ position }: { position: PositionProfile }) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-semibold text-lg" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.02em' }}>Position Profile</h2>
          <p className="text-xs mt-0.5" style={{ color: '#4B5A6E' }}>Approved requirements used for candidate evaluation</p>
        </div>
        <Btn variant="secondary" size="sm">Edit profile</Btn>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-4 grid grid-cols-3 gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[{ label: 'Seniority', value: position.seniority || 'Not specified' }, { label: 'Location', value: position.location }, { label: 'Threshold', value: `${position.threshold}%` }].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs" style={{ color: '#4B5A6E' }}>{label}</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: '#E2E8F0' }}>{value}</p>
            </div>
          ))}
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Requirement', 'Category', 'Importance', 'Weight'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5A6E', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {position.requirements.map((req, i) => (
              <tr key={req.id} style={{ borderBottom: i < position.requirements.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{req.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#4B5A6E' }}>{req.description}</p>
                </td>
                <td className="px-5 py-3.5"><span className="text-xs capitalize" style={{ color: '#6B7B8E' }}>{req.category}</span></td>
                <td className="px-5 py-3.5"><ImportanceBadge importance={req.importance} /></td>
                <td className="px-5 py-3.5 w-40"><WeightBar weight={req.weight} totalWeight={position.requirements.reduce((s, r) => s + r.weight, 0)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Workspace ────────────────────────────────────────────────────────────
export default function Workspace({ position, nav, onCandidatesAdded }: WorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>('candidates');
  const aboveCount = position.candidates.filter(c => c.cvMatchScore >= position.threshold).length;
  const verifiedCount = position.candidates.filter(c => c.verifiedSkillScore !== null).length;

  return (
    <div className="flex h-full min-h-screen bg-mesh">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: '#0C0E16', borderRight: '1px solid rgba(255,255,255,0.06)', minHeight: '100vh' }}>
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={nav.goHome} className="flex items-center gap-1.5 text-xs mb-4 transition-colors hover:text-white" style={{ color: '#4B5A6E' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9.5 6h-7M5.5 3l-3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            All positions
          </button>
          <h2 className="font-display font-semibold text-sm leading-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#F0F4FF', letterSpacing: '-0.02em' }}>{position.title}</h2>
          <div className="mt-1.5"><ProfileStatusBadge status={position.status} /></div>
        </div>
        <div className="px-4 py-4 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { label: 'Candidates', value: position.candidates.filter(c => c.status !== 'processing').length, color: '#E2E8F0' },
            { label: `Above ${position.threshold}%`, value: aboveCount, color: '#0FD99B' },
            { label: 'Verified', value: verifiedCount, color: '#A78BFA' },
            { label: 'Requirements', value: position.requirements.length, color: '#60A5FA' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#4B5A6E' }}>{label}</span>
              <span className="font-mono text-xs font-medium" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
            </div>
          ))}
        </div>
        <nav className="px-3 pt-3 flex-1">
          {([
            { id: 'candidates', label: 'Candidates', icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
            { id: 'profile', label: 'Position Profile', icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="2" y="2" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 5.5h4M4.5 8h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
          ] as { id: WorkspaceTab; label: string; icon: React.ReactNode }[]).map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium mb-1 transition-all text-left"
              style={{ background: tab === id ? 'rgba(79,126,255,0.12)' : 'transparent', color: tab === id ? '#4F7EFF' : '#6B7B8E' }}>
              {icon}{label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-8">
          {tab === 'candidates' && (
            <CandidatesTab
              position={position} nav={nav}
              onCandidatesAdded={cs => onCandidatesAdded(position.id, cs)}
            />
          )}
          {tab === 'profile' && <ProfileTab position={position} />}
        </div>
      </main>
    </div>
  );
}
