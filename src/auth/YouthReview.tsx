import LoadingAction from '../demo/LoadingAction';
import { SkeletonText } from '../demo/StaffLoading';
import { displayLabel } from '../presentation-copy';
import { useEffect, useRef, useState } from 'react';
import type { ReviewStateV2 } from '../../contracts/v1/youth-review-v2';
import { useYouthAuth } from './AuthProvider';
import { reviewService } from './review-services';
import { manilaTime, positionLabel, reviewLabel } from './review-presentation';

function OwnReview({ responseId }: { responseId: string }) {
  const [record, setRecord] = useState<ReviewStateV2 | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const live = useRef(true);
  async function load() {
    const result = await reviewService?.mine();
    if (!live.current) return;
    if (result?.kind === 'ok' && result.data.responseId === responseId) { setRecord(result.data); setError(''); }
    else { setRecord(null); setError('Your saved review result is unavailable. Check your access and retry.'); }
    setBusy(false);
  }
  useEffect(() => { live.current = true; void load(); return () => { live.current = false; }; }, [responseId]);
  return <section className="profile-card youth-saved-review" aria-labelledby="youth-saved-review-title">
    <h2 id="youth-saved-review-title">Your saved review result</h2>
    {busy && !record && <p role="status" aria-label="Checking your saved review…"><SkeletonText>Pending review · Unverified</SkeletonText></p>}{error && <p role="alert">{error}</p>}
    {record && <p><strong>{reviewLabel(record.status)}</strong> · Unverified</p>}
    {(busy || record) && <p>Approved is a review outcome, not proof of identity, residency, eligibility or official registration. Needs changes does not enable submitted editing or resubmission.</p>}
    {record && <>
      {record.history.map(event => <div key={event.eventId}><p>{reviewLabel(event.decision)} · {displayLabel(event.actorLabel)} · {positionLabel(event.position)} · <time dateTime={event.recordedAt}>{manilaTime(event.recordedAt)} (PH)</time></p><p className="staff-live-note">{event.note || 'No review note.'}</p></div>)}
      {record.status === 'not_shared' && <p>This earlier submission remains private. It was preserved without changing your original choice. New profiles are sent for review through Submit profile after the submission notice is accepted.</p>}
    </>}
    <div className="form-actions"><LoadingAction className="secondary-button" busy={busy} onClick={() => { setBusy(true); void load(); }}>Reload my review result</LoadingAction></div>
  </section>;
}

export default function YouthReview({ responseId }: { responseId: string }) {
  const { state, checking, signingOut } = useYouthAuth();
  if (signingOut || state.kind !== 'signedIn' || state.access.accountStatus !== 'active') return <p role="status">Checking review access…</p>;
  return <div inert={checking || undefined} aria-busy={checking}><OwnReview key={state.authUserId + responseId} responseId={responseId} /></div>;
}
