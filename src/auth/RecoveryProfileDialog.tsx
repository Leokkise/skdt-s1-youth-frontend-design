import { useEffect, useRef, useState } from 'react';
import type { RecoverySelectedV1 } from '../../contracts/v1/recovery-search';
import { sections, type Answers } from '../profiling/fields';
import ReviewSection from '../demo/ReviewSection';
import { displayLabel } from '../presentation-copy';
import { correctionService, workflowService } from './review-services';
import { reviewLabel } from './review-presentation';
import { LoadingSpinner, SkeletonText } from '../demo/StaffLoading';
import ProfileAnswersPending from '../demo/ProfileAnswersPending';

export default function RecoveryProfileDialog({ record, blocked, selecting, error, close, select }: {
  record: RecoverySelectedV1; blocked: boolean; selecting: boolean; error: string; close: () => void; select: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [profile, setProfile] = useState<{ answers: Answers; submittedAt: string } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'restricted' | 'failed'>('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    let live = true;
    setProfile(null); setStatus('loading');
    void (async () => {
      // Each detail endpoint independently enforces registry access, beyond recovery permission.
      const correction = await correctionService?.detail(record.subject.responseId);
      if (!live) return;
      if (correction?.kind === 'ok' && correction.data.responseId === record.subject.responseId) {
        setProfile(correction.data); setStatus('ready'); return;
      }
      if (correction && correction.kind !== 'denied') { setStatus('failed'); return; }
      const legacy = await workflowService?.detail(record.subject.responseId);
      if (!live) return;
      if (legacy?.kind === 'ok' && legacy.data.detail.responseId === record.subject.responseId) {
        setProfile(legacy.data.detail); setStatus('ready');
      } else setStatus(legacy?.kind === 'denied' ? 'restricted' : 'failed');
    })();
    return () => { live = false; };
  }, [record.subject.responseId, retry]);
  const name = [record.subject.firstName, record.subject.surname].filter((value): value is string => Boolean(value)).map(displayLabel).join(' ') || 'No recorded name';
  return <dialog ref={dialog} className="registry-dialog recovery-profile-dialog" aria-labelledby="recovery-profile-title" onClose={close} onCancel={event => { event.preventDefault(); close(); }}>
    <header className="registry-dialog-header"><div>
      <h2 id="recovery-profile-title">{name}</h2>
      <p>{reviewLabel(record.reviewStatus)}</p>
      <dl className="registry-header-meta"><div><dt>Registration No.</dt><dd className="staff-registration-number">{record.registrationReference || 'Not assigned'}</dd></div>
        <div><dt>Submitted</dt><dd>{profile ? new Date(profile.submittedAt).toLocaleDateString('en-PH', {timeZone:'Asia/Manila', dateStyle:'medium'}) : status === 'loading' ? <SkeletonText>Oct 28, 2026</SkeletonText> : 'Unavailable'}</dd></div>
      </dl>
    </div><button type="button" className="secondary-button" onClick={close}>Close</button></header>
    <div className="registry-dialog-body" inert={blocked || undefined} aria-busy={blocked || status === 'loading'}>
      <p className="recovery-profile-guidance">Review these details with the youth before selecting this account.</p>
      {status === 'loading' && <ProfileAnswersPending label="Loading submitted profile…" />}
      {status === 'failed' && <div role="alert"><p>The submitted profile could not be loaded. Retry before selecting this account.</p><button className="secondary-button" onClick={() => setRetry(value => value + 1)}>Retry profile</button></div>}
      {status === 'restricted' && <><p>Full profile details require registry access. Your recovery permission allows these account details.</p><dl className="demo-details"><div><dt>Profile name</dt><dd>{name}</dd></div><div><dt>Birthdate</dt><dd>{record.subject.birthdate || 'Not recorded'}</dd></div></dl></>}
      {profile && <div className="review-sections">{sections.map(section => <ReviewSection key={section.title} section={section} answers={profile.answers} />)}</div>}
      {error && <p role="alert" className="auth-error">{error}</p>}
    </div>
    <footer className="recovery-profile-actions"><button type="button" className="secondary-button" onClick={close}>Back to search</button><button type="button" className="button" aria-busy={selecting} disabled={blocked || status === 'loading' || status === 'failed'} onClick={select}>{selecting && <LoadingSpinner />}{record.activeCaseId ? 'View existing case' : 'Select account'}</button></footer>
  </dialog>;
}
