import YouthIcon from './YouthIcon';
import type { ReviewStateV2 } from '../../contracts/v1/youth-review-v2';
import type { EncoderReceiptV1 } from '../../contracts/v1/youth-workflow';
import { displayLabel } from '../presentation-copy';
import { manilaTime, positionLabel, reviewLabel } from '../auth/review-presentation';

export function ChangesRequested({ review }: { review: ReviewStateV2 }) {
  if (review.status !== 'needs_changes') return null;
  const event = review.history.find(entry => entry.decision === 'needs_changes');
  return <section className="registry-change-summary" aria-labelledby="requested-changes-title">
    <h3 id="requested-changes-title">Changes requested</h3>
    <p className="staff-live-note">{event?.note || 'No saved review note is available.'}</p>
    <p className="field-hint">Section not specified in the saved review.</p>
    {event && <p className="registry-review-meta">{displayLabel(event.actorLabel)} · {positionLabel(event.position)} · <time dateTime={event.recordedAt}>{manilaTime(event.recordedAt)} (PH)</time></p>}
  </section>;
}

export default function StaffReviewEvidence({ review, encoder }: { review: ReviewStateV2; encoder?: EncoderReceiptV1 | null }) {
  return <div className="registry-evidence-grid">
    <details className="review-history registry-history" open>
      <summary><span className="registry-history-label"><YouthIcon name="chevron" />Review history</span><span>{review.history.length} {review.history.length === 1 ? 'decision' : 'decisions'}</span></summary>
      {review.history.length ? <ol>{review.history.map(event => <li key={event.eventId}>
        <span className="status-pill registry-evidence-status" data-decision={event.decision}>{reviewLabel(event.decision)}</span>
        <p className="staff-live-note">{event.note || 'No review note.'}</p>
        <p className="registry-review-meta"><strong>{displayLabel(event.actorLabel)}</strong> · {positionLabel(event.position)}<br /><time dateTime={event.recordedAt}>{manilaTime(event.recordedAt)} (PH)</time></p>
      </li>)}</ol> : <p>No decision has been recorded.</p>}
    </details>
    {encoder && <EncoderEvidence encoder={encoder} />}
  </div>;
}

export function EncoderEvidence({ encoder }: {encoder: EncoderReceiptV1}) {
  return <section className="registry-encoder"><h3>Encoded by</h3>
      <p className="registry-encoder-name">{displayLabel(encoder.actorLabel)}</p><p className="registry-review-meta">{positionLabel(encoder.position)}<br /><time dateTime={encoder.recordedAt}>{manilaTime(encoder.recordedAt)} (PH)</time></p>
      <details><summary>About this entry</summary><p>This records the staff member who encoded the profile. It is not a youth or guardian consent receipt.</p></details>
    </section>;
}
