import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { RecoveryCaseV1, RecoveryEventV1 } from '../../contracts/v1/account-recovery';
import { manilaTime, positionLabel } from './review-presentation';
import { displayLabel } from '../presentation-copy';
import LoadingAction from '../demo/LoadingAction';
import { SkeletonText } from '../demo/StaffLoading';
import YouthIcon from '../demo/YouthIcon';
import { recoveryEventLabels as eventLabels, recoveryEventTones, recoveryStatusTones, isRetiredPasswordSetup } from './recovery-presentation';

export const recoveryStatusLabel = (status: string) => ({approved:'Approved for verification',awaiting_mailbox:'Awaiting new email verification',verified:'New email verified',applying:'Finalizing email change',completed:'Email updated',cancelled:'Cancelled',expired:'Expired'}[status] || status);

export default function RecoveryCaseDialog({ record, reference, busy, blocked, error, message, close, refresh, children }: {
  record: {case:RecoveryCaseV1;events:RecoveryEventV1[]} | null; reference?: string; busy: boolean; blocked: boolean; error: string; message: string;
  close: () => void; refresh: () => void; children?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    const opener = document.activeElement;
    dialog.current?.showModal();
    return () => { if (opener instanceof HTMLElement) requestAnimationFrame(() => { if (opener.isConnected && !opener.closest('[hidden],[inert]')) opener.focus(); }); };
  }, []);
  const latest = useRef({refresh, busy, blocked, error}); latest.current = {refresh, busy, blocked, error};
  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = latest.current;
      if (document.visibilityState !== 'visible' || current.busy || current.blocked || current.error || dialog.current?.querySelector('input, textarea, select')) return;
      current.refresh();
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);
  const item = record?.case;
  const tone = item && recoveryStatusTones[item.status];
  const events = record ? record.events.filter(event => !isRetiredPasswordSetup(event.outcome)).reverse() : [];
  const shown = showAll ? events : events.slice(0, 3);
  return <dialog ref={dialog} className="registry-dialog recovery-case-dialog" aria-labelledby="recovery-case-title" onClose={close} onCancel={event => { event.preventDefault(); close(); }}>
    <header className="registry-dialog-header"><div><h2 id="recovery-case-title">{item || reference ? `Case ${item?.officeReference || reference}` : 'Recovery case'}</h2><p>Account recovery details</p></div><button type="button" className="secondary-button" onClick={close} aria-label="Close case">Close</button></header>
    <div className="recovery-case-body" aria-busy={busy} inert={blocked || undefined}>
      {error && <p role="alert" className="auth-error">{error}</p>}{message && !item && <p role="status" className="demo-feedback">{message}</p>}
      {!item && busy && <span className="sr-only" role="status" aria-label="Loading recovery case…">Loading recovery case…</span>}
      {(!item && !busy) ? <p>Case details could not be confirmed. Use Refresh case to try again.</p> : <>
        {item?.status !== 'completed' && <div className="recovery-case-outcome"><span className="status-pill staff-event-tone" data-tone={tone}><YouthIcon name={tone === 'success' ? 'check' : tone === 'closed' ? 'close' : 'clock'} />{item ? recoveryStatusLabel(item.status) : <SkeletonText>Awaiting new email verification</SkeletonText>}</span></div>}
        {item && <section className="recovery-case-next" aria-labelledby="recovery-case-next-title"><div className="recovery-case-next-heading"><h3 id="recovery-case-next-title">{item.status === 'completed' ? 'Email change complete' : ['cancelled','expired'].includes(item.status) ? 'This case is closed' : 'Next step'}</h3></div><p>{item.status === 'completed' ? 'The replacement email is now the sign-in email. If the youth needs a new password, they can use Forgot password on the sign-in page with this email.' : ['approved','awaiting_mailbox'].includes(item.status) ? 'Waiting for the youth to verify the replacement email using the message in their new inbox. The previous email remains active until verification is complete.' : ['verified','applying'].includes(item.status) ? 'The new email has been verified. Use Check and finalize email change below to confirm completion.' : 'No further action is available on this case.'}</p></section>}
        <dl className="recovery-case-facts">
          <div><dt>{item?.status === 'completed' ? 'Previous email · replaced' : 'Current email'}</dt><dd>{item ? item.oldEmailMasked : <SkeletonText>y***@example.invalid</SkeletonText>}</dd></div><div><dt>{item?.status === 'completed' ? 'New sign-in email · active' : 'Replacement email · awaiting completion'}</dt><dd>{item ? item.newEmailMasked : <SkeletonText>y***@example.invalid</SkeletonText>}</dd></div>
          <div><dt>Approved by</dt><dd>{item ? <>{displayLabel(item.actorLabel)} · {positionLabel(item.position)}</> : <SkeletonText>Staff name · Chairperson</SkeletonText>}</dd></div>
          <div><dt>Evidence presented</dt><dd>{item ? item.method === 'government_photo_id' ? 'Original government photo ID' : 'School photo ID and barangay identity document' : <SkeletonText>Original government photo ID</SkeletonText>}</dd></div>
          <div><dt>Created (PH)</dt><dd>{item ? <time dateTime={item.createdAt}>{manilaTime(item.createdAt)}</time> : <SkeletonText>Oct 28, 2026, 10:50 AM</SkeletonText>}</dd></div>
          <div><dt>{item?.completedAt ? 'Email updated (PH)' : 'Case expires (PH)'}</dt><dd>{item ? <time dateTime={item.completedAt || item.expiresAt}>{manilaTime(item.completedAt || item.expiresAt)}</time> : <SkeletonText>Oct 28, 2026, 11:20 AM</SkeletonText>}</dd></div>
        </dl>
        <div className="recovery-case-controls" inert={blocked || busy || undefined}>{item ? children : <div aria-hidden="true" className="form-actions"><button className="secondary-button" disabled><SkeletonText>Resend verification</SkeletonText></button><button className="secondary-button" disabled><SkeletonText>Cancel recovery</SkeletonText></button></div>}</div>
        <section className="recovery-case-history" aria-labelledby="recovery-case-history-title"><div className="recovery-case-history-heading"><h3 id="recovery-case-history-title">{showAll ? 'Case history' : 'Recent history'}</h3><span>{item ? <>{events.length} {events.length === 1 ? 'event' : 'events'} · Newest first</> : <SkeletonText>3 events · Newest first</SkeletonText>}</span></div>
          <p className="field-hint">Restricted recovery history. Open an event for its recorded email addresses.</p>
          {!item ? <ol className="recovery-case-timeline" aria-hidden="true">{[0,1,2].map(row => <li key={row}><details><summary><span className="recovery-case-event-icon"><YouthIcon name="clock" /></span><span className="recovery-case-event-text"><strong><SkeletonText>Verification requested</SkeletonText></strong><span><SkeletonText>Staff name · Chairperson</SkeletonText></span></span><time><SkeletonText>Oct 28, 2026, 10:50 AM (PH)</SkeletonText></time><span className="recovery-case-event-chevron"><YouthIcon name="chevron" /></span></summary></details></li>)}</ol> : shown.length ? <ol className="recovery-case-timeline">{shown.map(event => <li key={event.eventId}><details><summary><span className="recovery-case-event-icon staff-event-tone" data-tone={recoveryEventTones[event.outcome]}><YouthIcon name={['completed','credential_completed','mailbox_verified'].includes(event.outcome) ? 'check' : ['verification_failed','cancelled','expired'].includes(event.outcome) ? 'close' : 'clock'} /></span><span className="recovery-case-event-text"><strong>{eventLabels[event.outcome]}</strong><span>{displayLabel(event.actorLabel)} · {positionLabel(event.position)}</span></span><time dateTime={event.recordedAt}>{manilaTime(event.recordedAt)} (PH)</time><span className="recovery-case-event-chevron"><YouthIcon name="chevron" /></span></summary>
            <dl className="recovery-case-event-addresses"><div><dt>Previous email</dt><dd>{event.oldEmail}</dd></div><div><dt>Replacement email</dt><dd>{event.newEmail}</dd></div></dl>
          </details></li>)}</ol> : <p>No history has been recorded for this case.</p>}
          {events.length > 3 && <button className="text-button" type="button" aria-expanded={showAll} onClick={() => setShowAll(value => !value)}>{showAll ? 'Show recent events' : `Show all ${events.length} events`}</button>}
          <p className="field-hint recovery-case-privacy"><YouthIcon name="lock" />Keep private email addresses out of general activity feeds.</p>
        </section>
      </>}
    </div>
    <footer className="recovery-case-footer"><span className="field-hint">Auto-refreshes every 15 seconds while visible. Pauses on errors.</span><LoadingAction className="secondary-button" type="button" busy={busy} disabled={blocked} onClick={refresh}>Refresh case</LoadingAction><button className="button" type="button" onClick={close}>Done</button></footer>
  </dialog>;
}
