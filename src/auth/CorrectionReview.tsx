import LoadingAction from '../demo/LoadingAction';
import { LoadingSpinner, SkeletonText } from '../demo/StaffLoading';
import { useEffect, useRef, useState } from 'react';
import type { CorrectionDetailV1, CorrectionHistoryV1, CorrectionTargetInputV1 } from '../../contracts/v1/youth-corrections';
import type { ReviewDecisionV2 } from '../../contracts/v1/youth-review-v2';
import { sections, allFields, displayAnswer } from '../profiling/fields';
import ReviewSection from '../demo/ReviewSection';
import { EncoderEvidence } from '../demo/StaffReviewEvidence';
import CorrectionFieldPicker from '../demo/CorrectionFieldPicker';
import { correctionDraftError } from '../demo/correction-draft';
import { correctionService } from './review-services';
import { manilaTime, positionLabel, reviewLabel } from './review-presentation';
import { displayLabel } from '../presentation-copy';
import { useYouthAuth } from './AuthProvider';
import YouthIcon from '../demo/YouthIcon';

const fieldName = (id: string) => allFields.find(field => field.id === id)?.label || id;
export default function CorrectionReview({ detail, reload, denied, children, staff = false, onDecisionSaved }: {
  detail: CorrectionDetailV1; reload: () => void; denied: () => void; children?: React.ReactNode; staff?: boolean; onDecisionSaved?: (outcome: ReviewDecisionV2) => void;
}) {
  const [history, setHistory] = useState<CorrectionHistoryV1['items']>([]), [before, setBefore] = useState<number | null | undefined>(undefined);
  const [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const live = useRef(true), historyRequest = useRef(0);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const targets = detail.decision?.targets || [];
  async function loadHistory(reset = false) {
    if ((loading && !reset) || !correctionService) return;
    const request = ++historyRequest.current;
    setLoading(true); setError('');
    const result = await correctionService.history(detail.responseId, reset ? undefined : before ?? undefined);
    if (!live.current || request !== historyRequest.current) return;
    setLoading(false);
    if (result.kind === 'ok') { setHistory(previous => reset || before === undefined ? result.data.items : [...previous, ...result.data.items]); setBefore(result.data.nextBeforeRevision); }
    else if (result.kind === 'denied') denied();
    else setError(staff ? 'Review history could not be loaded. Retry history.' : 'Review history could not be loaded. Use Refresh at the top of your profile to try again.');
  }
  useEffect(() => { void loadHistory(true); }, [detail.responseId, detail.answerRevision, detail.status]);
  const previousTargets = detail.status === 'pending_review' ? history.find(item => item.answerRevision === detail.answerRevision - 1)?.decision?.targets || [] : [];
  const shownTargets = detail.status === 'pending_review' && !staff ? [] : targets.length ? targets : previousTargets;
  const evidence = (
    <div className="registry-evidence-grid correction-evidence youth-review-timeline">
      <details className="review-history registry-history">
        <summary><span className="registry-history-label"><YouthIcon name="chevron" />Review history</span><span>Round {detail.answerRevision}</span></summary>
        {error && <p role="alert">{error}</p>}{loading && (history.length ? <span role="status" className="sr-only">Loading review history…</span> : staff ? <p role="status"><LoadingSpinner />Loading review history…</p> : <article className="correction-history-round" role="status" aria-label="Loading review history…"><h4>Round {detail.answerRevision} · {reviewLabel(detail.status)}</h4><p className="registry-review-meta"><SkeletonText>Staff name · Staff position · Review date and time (PH)</SkeletonText></p></article>)}
        {history.map(item => <article className="correction-history-round" key={item.answerRevision}><header className="correction-round-heading"><h4>Round {item.answerRevision}</h4><span className="status-pill" data-review-status={item.decision?.decision || 'pending_review'}>{reviewLabel(item.decision?.decision || 'pending_review')}</span></header>
          <p className="registry-review-meta">{item.decision ? `${displayLabel(item.decision.actorLabel)} · ${positionLabel(item.decision.position)} · ${manilaTime(item.decision.recordedAt)} (PH)` : 'Awaiting a decision'}</p>
          {item.decision?.note && item.decision.decision !== 'needs_changes' && <p className="staff-live-note"><strong>Overall staff note: </strong>{item.decision.note}</p>}
          {item.decision?.targets.map(target => <section className="correction-history-field" key={target.fieldId}><h5>{fieldName(target.fieldId)}</h5><p className="staff-live-note"><strong>Staff note: </strong>{target.note}</p><dl className="correction-comparison"><div><dt>Reviewed answer</dt><dd>{displayAnswer(target.fieldId, item.answers)}</dd></div><div><dt>Latest submitted answer</dt><dd>{displayAnswer(target.fieldId, detail.answers)}</dd></div></dl></section>)}
        </article>)}
        {before !== null && (staff || before !== undefined) && <LoadingAction className="secondary-button" busy={loading} onClick={() => { void loadHistory(); }}>{before === undefined ? 'Retry history' : 'Load earlier rounds'}</LoadingAction>}
      </details>
      {detail.encoderReceipt && <EncoderEvidence encoder={detail.encoderReceipt} />}
    </div>
  );
  return <>
    {!staff && evidence}
    {!(!staff && detail.draft && detail.status === 'needs_changes') && detail.status !== 'needs_changes' && detail.decision?.note && !targets.some(target => target.note.trim() === detail.decision!.note.trim()) && <p className="correction-overall-note"><strong>Overall staff note</strong>{detail.decision.note}</p>}
    {detail.answerRevision > 1 && before === undefined && <LoadingAction className="secondary-button" busy={loading} onClick={() => { void loadHistory(); }}>Show previous correction notes and answers</LoadingAction>}
    <div className="review-sections">{sections.map(section => <ReviewSection key={[detail.responseId, detail.answerRevision, section.title, shownTargets.length].join('-')} section={section} answers={detail.answers} targets={!staff && detail.draft && detail.status === 'needs_changes' ? [] : shownTargets}
      initiallyOpen={!shownTargets.length || section.fields.some(field => shownTargets.some(target => target.fieldId === field.id))} />)}</div>
    {staff && evidence}
    {children}
    {staff && <StaffCorrectionDecision key={`${detail.responseId}-${detail.answerRevision}`} detail={detail} reload={reload} denied={denied} onDecisionSaved={onDecisionSaved} />}
  </>;
}

function StaffCorrectionDecision({ detail, reload, denied, onDecisionSaved }: { detail: CorrectionDetailV1; reload: () => void; denied: () => void; onDecisionSaved?: (outcome: ReviewDecisionV2) => void }) {
  const { checking, state, correctionAttempt } = useYouthAuth();
  const retained = correctionAttempt.current?.responseId === detail.responseId ? correctionAttempt.current : null;
  const [outcome, setOutcome] = useState<ReviewDecisionV2 | ''>(retained?.outcome || ''), [note, setNote] = useState(retained?.note || '');
  const [targets, setTargets] = useState<CorrectionTargetInputV1[]>(retained?.targets || []);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [uncertain, setUncertain] = useState(Boolean(retained));
  const live = useRef(true), lock = useRef(false);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  if (state.kind !== 'signedIn' || !state.access.capabilities.includes('youth.registration_review')) return null;
  if (detail.status !== 'pending_review') return null;
  async function submit() {
    if (!correctionService || checking || state.kind !== 'signedIn' || lock.current) return;
    const pending = correctionAttempt.current;
    if (pending && pending.responseId !== detail.responseId) { setError('Reload the earlier unconfirmed review before saving another decision.'); return; }
    if (!outcome) { setError('Select a review outcome before saving.'); return; }
    const validation = outcome === 'needs_changes' ? correctionDraftError(targets, detail.allowedFieldIds) : outcome === 'rejected' && [...note.trim()].length < 10 ? 'Explain the rejection in at least 10 characters.' : '';
    if (!pending && (validation || [...note].length > 1000)) { setError(validation || 'Keep the review note within 1,000 characters.'); return; }
    const attempt = pending || { authId: state.authUserId, responseId: detail.responseId, revision: detail.answerRevision, outcome, note: outcome === 'rejected' ? note : '', targets: outcome === 'needs_changes' ? targets.map(target => ({...target})) : [], requestId: crypto.randomUUID() };
    correctionAttempt.current = attempt; lock.current = true; setBusy(true); setError('');
    const result = await correctionService.decide(attempt.responseId, attempt.revision, attempt.outcome, attempt.note, attempt.targets, attempt.requestId);
    if (!live.current) return;
    lock.current = false; setBusy(false);
    if (result.kind === 'unavailable') { setUncertain(true); setError('Save is unconfirmed. Retry the same decision or reload its saved result.'); return; }
    correctionAttempt.current = null; setUncertain(false);
    if (result.kind === 'ok' || result.kind === 'conflict') {
      if (result.kind === 'ok') onDecisionSaved?.(attempt.outcome);
      reload();
    }
    else if (result.kind === 'denied') denied();
    else setError('Check the selected fields and notes, then save again.');
  }
  return <form className="staff-decision" onSubmit={event => { event.preventDefault(); void submit(); }} aria-busy={busy}>
    <h3>Review decision</h3><p>Choose an outcome for round {detail.answerRevision}. For changes, select each answer and write its correction note.</p>
    {error && <p role="alert" className="auth-error">{error}</p>}
    <fieldset className="auth-fields" disabled={busy || uncertain || checking}><div className="profile-fields"><div className="profile-field"><label htmlFor="targeted-review-outcome">Review outcome</label><select id="targeted-review-outcome" value={outcome} required onChange={event => { setOutcome(event.target.value as ReviewDecisionV2 | ''); if (event.target.value !== 'rejected') setNote(''); }}><option value="" disabled>Select a review outcome</option><option value="approved">Approved</option><option value="needs_changes">Needs changes</option><option value="rejected">Rejected</option></select></div></div>
      {outcome === 'needs_changes' && <CorrectionFieldPicker answers={detail.answers} allowedFieldIds={detail.allowedFieldIds} value={targets} onChange={setTargets} />}
      {outcome === 'rejected' && <div className="profile-field"><label htmlFor="targeted-review-note">Reason for rejection (at least 10 characters)</label><textarea id="targeted-review-note" rows={2} value={note} onChange={event => setNote(event.target.value)} /></div>}
    </fieldset>
    <div className="form-actions"><button className="button" disabled={busy || checking || !outcome}>{busy ? 'Saving review…' : uncertain ? 'Retry same decision' : 'Save review decision'}</button>{uncertain && <button type="button" className="secondary-button" disabled={busy} onClick={reload}>Reload saved result</button>}</div>
  </form>;
}
