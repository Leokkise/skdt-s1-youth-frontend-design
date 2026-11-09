import YouthWorkspacePending from './YouthWorkspacePending';
import { useYouthAuth } from './AuthProvider';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import PrivacyGate from '../profiling/PrivacyNotice';
import { acknowledgmentService } from './review-services';

// This component is keyed by the checked Auth identity; local state is not a receipt.
export default function ProfilingNoticeAccess({ children }: { children: ReactNode }) {
  const {state, youthNoticeView} = useYouthAuth();
  const identity = state.kind === 'signedIn' ? state.authUserId : null;
  const [status, setStatus] = useState<'checking' | 'missing' | 'ready' | 'error'>('checking');
  const retry = useRef<string | null>(null), live = useRef(true);
  async function check() {
    setStatus('checking');
    const result = await acknowledgmentService?.mine();
    if (live.current) { youthNoticeView.current = result?.kind === 'ok' && result.data.receipt ? identity : null; setStatus(result?.kind === 'ok' ? result.data.receipt ? 'ready' : 'missing' : 'error'); }
  }
  useEffect(() => { live.current = true; void check(); return () => { live.current = false; }; }, []);
  async function accept() {
    retry.current ||= crypto.randomUUID();
    const result = await acknowledgmentService?.accept(retry.current, true);
    if (!live.current) return false;
    if (result?.kind !== 'unavailable') retry.current = null;
    return result?.kind === 'ok' && result.data.receipt !== null;
  }
  if (status === 'checking' && identity && youthNoticeView.current === identity) return <div inert aria-busy="true">{children}</div>;
  if (status === 'ready') return <>{children}</>;
  if (status === 'missing') return <main id="main-content" className="container account-main" aria-label="Youth profiling">
    <PrivacyGate saved persistAcceptance={accept} onAccept={() => { youthNoticeView.current = identity; setStatus('ready'); }} />
  </main>;
  if (status === 'checking') return <YouthWorkspacePending />;
  return <main id="main-content" className="container account-main"><section className="profile-card account-form">
    <h1>Profiling privacy</h1><p role="status">The profiling privacy service is unavailable. Your saved records are unchanged.</p>
    {status === 'error' && <button className="button" onClick={() => { void check(); }}>Retry privacy check</button>}
    <p><Link to="/youth">Back to home</Link></p>
  </section></main>;
}
