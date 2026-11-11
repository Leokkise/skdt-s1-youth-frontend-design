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

export default function StaffReviewEvidence({ review }: { review: ReviewStateV2; encoder?: EncoderReceiptV1 | null }) {
  return <div className="registry-evidence-grid youth-review-timeline">
    <details className="review-history registry-history" open>
      <summary><span className="registry-history-label"><YouthIcon name="chevron" />Review history</span></summary>
      {review.history.length ? review.history.map((event, index) => <article className="correction-history-round" key={event.eventId}>
        <header className="correction-round-heading"><h4>Decision {review.history.length - index}</h4><span className="status-pill" data-review-status={event.decision}>{reviewLabel(event.decision)}</span></header>
        <p className="registry-review-meta">{displayLabel(event.actorLabel)} · {positionLabel(event.position)} · <time dateTime={event.recordedAt}>{manilaTime(event.recordedAt)} (PH)</time></p>
        {event.note && <p className="staff-live-note"><strong>Staff note: </strong>{event.note}</p>}
      </article>) : <p>No decision has been recorded.</p>}
    </details>
  </div>;
}

export function EncoderEvidence({ encoder }: {encoder: EncoderReceiptV1}) {
  return <details className="registry-encoder"><summary>Profile entry details</summary>
      <p className="registry-encoder-name">{displayLabel(encoder.actorLabel)}</p><p className="registry-review-meta">{positionLabel(encoder.position)}<br /><time dateTime={encoder.recordedAt}>{manilaTime(encoder.recordedAt)} (PH)</time></p>
      <p className="field-hint">Entered by this staff member. Review decisions appear in Review history.</p>
    </details>;
}
