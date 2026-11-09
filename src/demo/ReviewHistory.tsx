import { displayLabel } from '../presentation-copy';
import { type HistoryEntry } from './presentationWorkflow';

export default function ReviewHistory({ entries }: { entries: HistoryEntry[] }) {
  return <details className="review-history"><summary>Review history</summary><p className="field-hint">Your submission, staff decisions and corrections in this session. This helps you follow what changed and when.</p>
    {entries.length ? <ol>{entries.map((entry, index) => <li key={index}>
      <div><strong>{displayLabel(entry.action)}</strong><span>{displayLabel(entry.actor)} · <time dateTime={entry.at}>{new Date(entry.at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })} (PH)</time></span></div>
      {entry.note && <p>{entry.note}</p>}
    </li>)}</ol> : <p className="field-hint">No review activity recorded in the application session.</p>}
  </details>;
}
