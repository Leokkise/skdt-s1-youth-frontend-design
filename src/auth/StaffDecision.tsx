import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ReviewDecisionV2, ReviewDetailV2, YouthReviewV2 } from '../../contracts/v1/youth-review-v2';
import { useYouthAuth } from './AuthProvider';
import { reviewService } from './review-services';
import { decisionError } from './review-presentation';

export default function StaffDecision({ detail, resolved, denied, decide = reviewService?.decide }: { detail: Pick<ReviewDetailV2, 'responseId' | 'review'>; resolved: (message: string) => void; denied: () => void; decide?: YouthReviewV2['decide'] }) {
  const { state, decisionAttempt, checking } = useYouthAuth();
  const retained = decisionAttempt.current?.responseId === detail.responseId ? decisionAttempt.current : null;
  const [outcome, setOutcome] = useState<ReviewDecisionV2 | ''>(retained?.outcome || '');
  const [note, setNote] = useState(retained?.note || '');
  const [uncertain, setUncertain] = useState(Boolean(retained));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const live = useRef(true);
  const lock = useRef(false);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!decide || state.kind !== 'signedIn' || checking || lock.current) return;
    const existing = decisionAttempt.current;
    if (existing && existing.responseId !== detail.responseId) { setError('An earlier decision is unconfirmed. Open that record and reload its saved result before another decision.'); return; }
    if (!outcome) { setError('Select a review outcome before saving.'); return; }
    const validation = decisionError(outcome, note);
    if (!existing && validation) { setError(validation); return; }
    lock.current = true; setBusy(true); setError('');
    const attempt = existing || { authId: state.authUserId, responseId: detail.responseId, outcome, note, revision: detail.review.revision, requestId: crypto.randomUUID() };
    decisionAttempt.current = attempt;
    const result = await decide(attempt.responseId, attempt.outcome, attempt.note, attempt.revision, attempt.requestId);
    if (!live.current) return;
    lock.current = false; setBusy(false);
    if (result.kind === 'unavailable') { setUncertain(true); setError('The result is unconfirmed. Retry the same decision, or reload the saved result. Do not enter a different decision.'); return; }
    decisionAttempt.current = null; setUncertain(false);
    if (result.kind === 'ok') resolved({approved: 'Youth profile approved successfully.', needs_changes: 'Changes requested for the youth profile.', rejected: 'Youth profile rejected.'}[attempt.outcome]);
    else if (result.kind === 'conflict') resolved('This record already changed. The saved result has been reloaded; no second decision was added.');
    else if (result.kind === 'denied') denied();
    else setError('The decision was not accepted. Check the outcome and note, then try again.');
  }
  if (detail.review.revision !== 0 || detail.review.status !== 'pending_review') return null;
  return <form className="staff-decision" onSubmit={submit} aria-busy={busy}>
    <h3>Record one review outcome</h3><p>The result is final in this version. Needs changes does not unlock editing or resubmission.</p>
    {error && <p role="alert" className="auth-error">{error}</p>}
    <fieldset className="auth-fields" disabled={busy || uncertain || checking}><div className="profile-fields">
      <div className="profile-field"><label htmlFor="review-outcome">Review outcome</label><select id="review-outcome" value={outcome} required onChange={event => setOutcome(event.target.value as ReviewDecisionV2 | '')}><option value="" disabled>Select a review outcome</option><option value="approved">Approved</option><option value="needs_changes">Needs changes</option><option value="rejected">Rejected</option></select></div>
      <div className="profile-field wide"><label htmlFor="review-note">Review note{!outcome || outcome === 'approved' ? ' (optional)' : ' (at least 10 characters)'}</label><textarea id="review-note" value={note} required={Boolean(outcome && outcome !== 'approved')} aria-describedby="review-note-limit" onChange={event => setNote(event.target.value)} /><p id="review-note-limit" className="field-hint">Maximum 1,000 characters. Use information only.</p></div>
    </div></fieldset>
    <div className="form-actions"><button className="button" disabled={busy || checking || !outcome} type="submit">{busy ? 'Saving decision…' : uncertain ? 'Retry same decision' : 'Save review decision'}</button>
      {uncertain && <button className="secondary-button" disabled={busy} type="button" onClick={() => resolved('Saved result reloaded. An unconfirmed pending decision keeps the same retry details.')}>Reload saved result</button>}
    </div>
  </form>;
}
