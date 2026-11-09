import { revisionNoticeCopy } from '../presentation-copy';

// Exact versioned scope is separate from presentation summaries and prior receipts.
export default function RevisionNotice({ staff = false, family = false, accepted, onChange, disabled = false }: {
  staff?: boolean; family?: boolean; accepted: boolean; onChange: (accepted: boolean) => void; disabled?: boolean;
}) {
  const notice = revisionNoticeCopy(staff, family);
  return <section className="revision-notice">
    <details><summary>{family ? 'Family information and private export scope' : 'Correction review and history scope'}</summary>
      {notice.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </details>
    <label className="review-sharing-choice"><input type="checkbox" checked={accepted} disabled={disabled} onChange={event => onChange(event.target.checked)} />{notice.checkbox}</label>
  </section>;
}
