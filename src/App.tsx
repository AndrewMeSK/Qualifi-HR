import { useState, useEffect } from 'react';
import { PositionProfile } from './data';
import { initialPositions } from './data';
import { Nav } from './components/ui';
import Home from './pages/Home';
import CreateProfile from './pages/CreateProfile';
import Workspace from './pages/Workspace';
import CandidateDetail from './pages/CandidateDetail';
import CandidateAssessmentView from './pages/CandidateAssessmentView';
import type { AssessmentResult } from './services/openai';

type View = 'home' | 'create' | 'workspace' | 'candidate' | 'assessment';

function getAssessmentParams() {
  const p = new URLSearchParams(window.location.search);
  const assess = p.get('assess');
  const pos = p.get('pos');
  const t = p.get('t');
  if (assess && pos && t) return { candidateId: assess, positionId: pos, token: t };
  return null;
}

export default function App() {
  const assessParams = getAssessmentParams();
  const [view, setView] = useState<View>(assessParams ? 'assessment' : 'home');
  const [positions, setPositions] = useState<PositionProfile[]>(() => {
    // On mount, apply any stored assessment scores from localStorage
    const stored = JSON.parse(localStorage.getItem('qualifi_assessment_results') ?? '[]') as AssessmentResult[];
    return initialPositions.map(pos => ({
      ...pos,
      candidates: pos.candidates.map(c => {
        const result = stored.find(r => r.candidateId === c.id);
        return result ? { ...c, assessmentScore: result.overallScore } : c;
      }),
    }));
  });
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const rawSelected = positions.find(p => p.id === selectedPositionId) ?? null;
  const selectedPosition = rawSelected
    ? { ...rawSelected, candidates: rawSelected.candidates.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i) }
    : null;
  const selectedCandidate = selectedPosition?.candidates.find(c => c.id === selectedCandidateId) ?? null;

  // Sync assessment scores from localStorage whenever storage changes
  useEffect(() => {
    const handler = () => {
      const stored = JSON.parse(localStorage.getItem('qualifi_assessment_results') ?? '[]') as AssessmentResult[];
      setPositions(prev => prev.map(pos => ({
        ...pos,
        candidates: pos.candidates.map(c => {
          const result = stored.find(r => r.candidateId === c.id);
          return result ? { ...c, assessmentScore: result.overallScore } : c;
        }),
      })));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const nav = {
    goHome: () => setView('home'),
    goCreate: () => setView('create'),
    goWorkspace: (positionId: string) => {
      setSelectedPositionId(positionId);
      setSelectedCandidateId(null);
      setView('workspace');
    },
    goCandidate: (candidateId: string) => {
      setSelectedCandidateId(candidateId);
      setView('candidate');
    },
    onProfileCreated: (profile: PositionProfile) => {
      setPositions(prev => [...prev, profile]);
      setSelectedPositionId(profile.id);
      setSelectedCandidateId(null);
      setView('workspace');
    },
  };

  const showNav = view === 'home' || view === 'create';

  // Candidate-facing assessment — renders in isolation, no app chrome
  if (view === 'assessment' && assessParams) {
    return (
      <CandidateAssessmentView
        candidateId={assessParams.candidateId}
        positionId={assessParams.positionId}
        positions={positions}
        onComplete={(result: AssessmentResult) => {
          setPositions(prev => prev.map(pos => ({
            ...pos,
            candidates: pos.candidates.map(c =>
              c.id === result.candidateId ? { ...c, assessmentScore: result.overallScore } : c
            ),
          })));
        }}
      />
    );
  }

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#080A10', color: '#E2E8F0' }}>
      {showNav && <Nav onLogoClick={nav.goHome} onNewPosition={nav.goCreate} />}

      <div className="flex-1">
        {view === 'home' && (
          <Home
            positions={positions.map(p => ({ ...p, candidates: p.candidates.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i) }))}
            nav={nav}
            onDelete={id => setPositions(prev => prev.filter(p => p.id !== id))}
          />
        )}
        {view === 'create' && (
          <CreateProfile nav={nav} />
        )}
        {view === 'workspace' && selectedPosition && (
          <Workspace
            position={selectedPosition}
            nav={nav}
            onCandidatesAdded={(positionId, newCandidates) => {
              setPositions(prev => prev.map(p => {
                if (p.id !== positionId) return p;
                const existingIds = new Set(p.candidates.map(c => c.id));
                const dedupedNew = newCandidates.filter(c => !existingIds.has(c.id));
                if (dedupedNew.length === 0) return p;
                return { ...p, candidates: [...p.candidates, ...dedupedNew], lastUpdated: new Date().toISOString() };
              }));
            }}
          />
        )}
        {view === 'candidate' && selectedCandidate && selectedPosition && (
          <CandidateDetail
            candidate={selectedCandidate}
            position={selectedPosition}
            nav={nav}
          />
        )}
      </div>
    </div>
  );
}
