import useAutoRefresh from './useAutoRefresh';
import LoadingAction from '../demo/LoadingAction';
import { SkeletonText, TableSkeleton } from '../demo/StaffLoading';
import { displayLabel } from '../presentation-copy';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BusinessActivityCursorV2, BusinessActivityEventV2 } from '../../contracts/v1/business-activity-v2';
import { recoveryEventLabels, recoveryEventTones, isRetiredPasswordSetup } from './recovery-presentation';
import type { RecoveryEventV1 } from '../../contracts/v1/account-recovery';
import { activityService, legacyActivityService } from './review-services';
import { manilaTime, positionLabel, reviewLabel } from './review-presentation';
import AdminLayout from '../demo/AdminLayout';
import { activityPages } from './activity-pages';
import YouthIcon from '../demo/YouthIcon';

const previewLimit = 5;
const activityDate = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit'});
const actorKey = (event: BusinessActivityEventV2) => JSON.stringify([event.actorLabel, event.position]);
const actionDescription = (event: BusinessActivityEventV2) => event.action === 'password_sign_in' ? 'A successful password check was recorded. This may be a sign-in or a password confirmation; it does not identify a particular workspace visit.' : event.action === 'auth_logout_committed' ? 'The service recorded a sign-out operation. The record does not say whether one or all sessions were affected.' : undefined;
const actionLabel = (event: BusinessActivityEventV2) => event.action === 'password_sign_in' ? 'Sign in' : event.action === 'auth_logout_committed' ? 'Sign out' : event.action === 'account_recovery' ? recoveryEventLabels[event.outcome as RecoveryEventV1['outcome']] : `Review outcome: ${reviewLabel(event.outcome)}`;

function ActivityBadge({ event }: { event: BusinessActivityEventV2 }) {
  const tone = event.action === 'password_sign_in' ? 'info'
    : event.action === 'auth_logout_committed' ? 'sign-out'
    : event.action === 'account_recovery' ? recoveryEventTones[event.outcome as RecoveryEventV1['outcome']]
    : event.outcome === 'approved' ? 'success'
    : event.outcome === 'rejected' ? 'failure' : 'waiting';
  return <span className="status-pill staff-event-tone" data-tone={tone} title={actionDescription(event)}>{actionLabel(event)}</span>;
}

function ActivityPreviewRow({ event }: { event: BusinessActivityEventV2 }) {
  const actor = displayLabel(event.actorLabel);
  const position = positionLabel(event.position);
  return <li>
    <div className="activity-preview-actor">
      <strong>{actor}</strong>
      {actor.toLowerCase() !== position.toLowerCase() && <span>{position}</span>}
    </div>
    <div className="activity-preview-action">
      <ActivityBadge event={event} />
      {event.recordRef && <span className="activity-preview-reference">{event.referenceKind === 'recovery_case' ? 'Case' : 'Registration No.'} <strong className={event.referenceKind === 'registration' ? 'staff-registration-number' : undefined}>{event.recordRef}</strong></span>}
    </div>
    <time dateTime={event.recordedAt}>{manilaTime(event.recordedAt)} (PH)</time>
  </li>;
}

export default function StaffActivity({ denied, preview = false, pending = false }: { pending?: boolean; denied: () => void; preview?: boolean }) {
  const [scope, setScope] = useState<'all' | 'auth' | 's1' | 'recovery'>('all');
  const [actor, setActor] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [manualRefresh, setManualRefresh] = useState(false);
  const [items, setItems] = useState<BusinessActivityEventV2[] | null>(null);
  const [availability, setAvailability] = useState<Record<'auth'|'s1'|'recovery','available'|'denied'|'not_requested'> | null>(null);
  const [recoveryUnavailable, setRecoveryUnavailable] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    if (pending) return;
    let current = true;
    setError(''); setBusy(true); setRecoveryUnavailable(false);
    void (async () => {
      const entries: BusinessActivityEventV2[] = [], seen = new Set<string>();
      let cursor: BusinessActivityCursorV2 | undefined;
      let legacy = false;
      do {
        let result = legacy ? undefined : await activityService?.read('all', preview ? previewLimit : 25, cursor);
        // Preserve the existing feed while the additive reader is unavailable; disclose missing recovery scope.
        if (legacy || (result?.kind === 'unavailable' && entries.length === 0)) {
          legacy = true;
          const previous = await legacyActivityService?.read('all', preview ? previewLimit : 25, cursor);
          if (previous?.kind === 'ok') {
            result = {kind:'ok',data:{...previous.data,items:previous.data.items.map(event=>({...event,source:'business' as const,performedBy:'officer' as const,referenceKind:event.scope==='s1'?'registration' as const:'none' as const,caseId:null})),nextCursor:previous.data.nextCursor ? {...previous.data.nextCursor,scope:'all' as const,source:'business' as const}:null,scopes:{auth:'available',s1:'available',recovery:'not_requested'}}};
          } else result = previous;
        }
        if (!current) return;
        if (result?.kind !== 'ok') {
          setBusy(false); setItems(null); setAvailability(null);
          if (result?.kind === 'denied') denied();
          else setError(preview ? 'Activity could not be loaded. Open View logs to retry.' : 'Activity could not be loaded. Select Refresh activity to retry.');
          return;
        }
        setAvailability(result.data.scopes);
        entries.push(...result.data.items.filter(event => event.action !== 'account_recovery' || !isRetiredPasswordSetup(event.outcome)));
        cursor = result.data.nextCursor || undefined;
        if (cursor) {
          const key = JSON.stringify(cursor);
          if (seen.has(key)) { setBusy(false); setError('Activity could not be loaded. Select Refresh activity to retry.'); return; }
          seen.add(key);
        }
      } while (cursor && (!preview || entries.length < previewLimit));
      setItems(entries); setRecoveryUnavailable(legacy); setBusy(false); setManualRefresh(false); setPage(0);
    })();
    return () => { current = false; };
  }, [attempt, denied, preview, pending]);
  useAutoRefresh(() => setAttempt(value => value + 1), !busy && !pending && !!items && page === 0);
  const actors = [...new Map((items || []).map(event => [actorKey(event), event])).entries()];
  const missingPositions = (['chairperson', 'secretary', 'treasurer'] as const).filter(position => !actors.some(([, event]) => event.position === position));
  const years = [...new Set((items || []).map(event => activityDate.format(new Date(event.recordedAt)).slice(0, 4)))].sort().reverse();
  const dayCount = year && month ? new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate() : 0;
  const datePrefix = year + (month ? '-' + month : '') + (day ? '-' + day : '');
  const filtered = (items || []).filter(event => {
    const date = activityDate.format(new Date(event.recordedAt));
    return (scope === 'all' || event.scope === scope) && (!actor || (actor.startsWith('position:') ? event.position === actor.slice(9) : actorKey(event) === actor)) && (!year || date.startsWith(datePrefix));
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const pages = activityPages(page, pageCount);
  const visible = preview ? filtered.slice(0, previewLimit) : filtered.slice(page * 10, (page + 1) * 10);
  const visibleBusy = busy && (!items || manualRefresh);
  const refreshButton = <LoadingAction iconOnly type="button" className="secondary-button activity-refresh" busy={visibleBusy} onClick={() => { setManualRefresh(true); setAttempt(value => value + 1); }}>Refresh activity</LoadingAction>;
  const content = <section className="profile-card staff-activity" aria-labelledby="staff-activity-title" aria-busy={busy}>
    <div className={preview ? 'activity-heading dashboard-panel-heading' : 'activity-heading'}><div>{preview ? <><YouthIcon name="clock" /><h2 id="staff-activity-title">Recent staff activity</h2></> : <h1 id="staff-activity-title">Activity Logs</h1>}</div>{preview ? <Link to="/admin/youth/activity">View logs<YouthIcon name="chevron" /></Link> : refreshButton}</div>
    {!preview && <>
      <div className="staff-activity-filters activity-account-filters"><div className="profile-field"><label htmlFor="activity-account">Staff account</label><select id="activity-account" value={actor} disabled={visibleBusy} onChange={event => { setActor(event.target.value); setPage(0); }}><option value="">All staff accounts</option>{actors.map(([key, event]) => <option key={key} value={key}>{displayLabel(event.actorLabel)} · {positionLabel(event.position)}</option>)}{missingPositions.map(position => <option key={position} value={'position:'+position}>{positionLabel(position)}</option>)}</select></div>
      <div className="profile-field"><label htmlFor="activity-scope">Activity type</label><select id="activity-scope" value={scope} disabled={visibleBusy} onChange={event => { setScope(event.target.value as typeof scope); setPage(0); }}><option value="all">All supported activity</option><option value="s1">Youth Registry</option><option value="auth">Sign-in and logout operations</option><option value="recovery">Account recovery</option></select></div></div>
      <div className="staff-activity-filters activity-date-filters"><div className="profile-field"><label htmlFor="activity-year">Year (PH)</label><select id="activity-year" value={year} disabled={visibleBusy} onChange={event => { setYear(event.target.value); setMonth(''); setDay(''); setPage(0); }}><option value="">All years</option>{years.map(value => <option key={value} value={value}>{value}</option>)}</select></div><div className="profile-field"><label htmlFor="activity-month">Month</label><select id="activity-month" value={month} disabled={visibleBusy || !year} onChange={event => { setMonth(event.target.value); setDay(''); setPage(0); }}><option value="">All months</option>{Array.from({length: 12}, (_, index) => <option key={index} value={String(index + 1).padStart(2, '0')}>{new Intl.DateTimeFormat('en', {month: 'long', timeZone: 'UTC'}).format(new Date(Date.UTC(2026, index, 1)))}</option>)}</select></div><div className="profile-field"><label htmlFor="activity-day">Day</label><select id="activity-day" value={day} disabled={visibleBusy || !year || !month} onChange={event => { setDay(event.target.value); setPage(0); }}><option value="">All days</option>{Array.from({length: dayCount}, (_, index) => <option key={index} value={String(index + 1).padStart(2, '0')}>{index + 1}</option>)}</select></div><div className="activity-filter-actions"><button className="secondary-button" disabled={visibleBusy || !year} onClick={() => { setYear(''); setMonth(''); setDay(''); setPage(0); }}>Clear dates</button></div></div>
    </>}
    {recoveryUnavailable && (scope === 'all' || scope === 'recovery') && <p role="status">Account recovery activity could not be loaded. Existing sign-in and registry activity is shown; refresh to retry.</p>}
    {availability?.recovery === 'denied' && (scope === 'all' || scope === 'recovery') && <p role="status">Account recovery activity is not available with your current access.</p>}
    {scope === 'auth' && <details className="activity-auth-explanation"><summary>What do sign-in and sign-out records mean?</summary><p><strong>Sign in:</strong> a password check succeeded. This can be a sign-in or confirmation of a password.</p><p><strong>Sign out:</strong> the service processed a sign-out operation. The record does not say whether one or all sessions were affected.</p></details>}
    {preview && <div className="activity-preview-columns"><span>Staff responsible &amp; activity</span><span>Date and time (PH)</span></div>}
    {busy && !items && !preview && <p aria-hidden="true"><SkeletonText>10 events · Showing 1–10</SkeletonText></p>}
    {busy && (items ? <span className="sr-only" role="status">Refreshing shared activity…</span> : preview ? <ActivityPreviewPending /> : <TableSkeleton variant={scope === 'auth' ? 'authActivity' : scope === 'recovery' ? 'recoveryActivity' : scope === 'all' ? 'combinedActivity' : 'activity'} label="Loading shared activity…" />)}{error && <p role="status">{error}</p>}
    {items && (scope === 'all' || availability?.[scope] === 'available') && (!filtered.length ? <div className="demo-empty" role="status"><h3>{items.length ? "No matching activity" : "No staff activity yet"}</h3><p>{items.length ? "Choose another staff account, activity type or date to see more results." : "Recorded staff actions will appear here when they are available."}</p></div> : preview ? <ol className="staff-live-records">{visible.map(event => <ActivityPreviewRow key={event.source + event.eventId} event={event} />)}</ol> : <>
      <p role="status">{filtered.length} {filtered.length === 1 ? 'event' : 'events'} · Showing {page * 10 + 1}–{Math.min((page + 1) * 10, filtered.length)}</p>
      <div className="report-table-wrap" role="region" aria-label="Staff activity logs" tabIndex={0}><table className="report-table staff-activity-table" data-activity-scope={scope}><caption className="sr-only">Staff activity, newest first. Times in Asia/Manila.</caption><thead><tr><th scope="col">Staff responsible</th><th scope="col">Activity</th>{scope !== 'auth' && <th scope="col">{scope === 'recovery' ? 'Case reference' : scope === 'all' ? 'Reference' : 'Registration No.'}</th>}<th scope="col">Date and time (PH)</th></tr></thead><tbody>{visible.map(event => <tr key={event.source + event.eventId}><th scope="row">{displayLabel(event.actorLabel)}<small>{positionLabel(event.position)}</small></th><td><ActivityBadge event={event} />{event.scope === 'recovery' && <small>{event.performedBy === 'officer' ? 'Completed by staff' : event.performedBy === 'mailbox_flow' ? 'Email verification step' : 'Automatic step'}</small>}</td>{scope !== 'auth' && <td>{event.caseId ? <Link to={'/admin/youth/recovery?case=' + encodeURIComponent(event.caseId)}>{event.recordRef}</Link> : event.recordRef ? <strong className={event.referenceKind === 'registration' ? 'staff-registration-number' : undefined}>{event.recordRef}</strong> : '—'}</td>}<td><time dateTime={event.recordedAt}>{manilaTime(event.recordedAt)}</time></td></tr>)}</tbody></table></div>
    </>)}
    {!preview && (scope === 'all' || availability?.[scope] === 'available') && items && filtered.length > 0 && <nav className="registry-pagination" aria-label="Activity log pages"><div className="registry-page-select"><label htmlFor="activity-page">Page</label><select id="activity-page" value={page} onChange={event => setPage(Number(event.target.value))}>{Array.from({length: pageCount}, (_, index) => <option key={index} value={index}>{index + 1}</option>)}</select><span>of {pageCount}</span><span className="registry-page-size">10 per page</span></div><div className="registry-page-buttons"><button className="secondary-button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Previous</button><div className="activity-page-slots">{pages.map(slot => slot === 'gap' ? <span key="gap" className="activity-page-more" aria-hidden="true">…</span> : <button key={slot} className="secondary-button registry-page-number" aria-label={'Page ' + (slot + 1)} aria-current={page === slot ? 'page' : undefined} onClick={() => setPage(slot)}>{slot + 1}</button>)}</div><button className="secondary-button" disabled={page + 1 >= pageCount} onClick={() => setPage(value => value + 1)}>Next</button></div></nav>}

  </section>;
  return preview ? content : <AdminLayout showHeading={false} title="Activity Logs" description="Review supported activity across the three authorized staff accounts.">{content}</AdminLayout>;
}

function ActivityPreviewPending() {
  return <p className="dashboard-empty" role="status" aria-label="Loading shared activity…">Loading recent staff activity…</p>;
}
