import StatusToast from './StatusToast';
import StaffReviewEvidence, { ChangesRequested } from './StaffReviewEvidence';
import { displayLabel } from '../presentation-copy';
import { usePractice } from './PracticeStore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReviewSection from './ReviewSection';
import { editableCorrectionFields, sections, visibleFields, type Answers } from '../profiling/fields';
import { profilingDate } from '../profiling/validation';
import { registryRecords, fixtureAnswers } from './registryData';
import { type ReviewStatus as SampleStatus } from './presentationWorkflow';
import ReviewHistory from './ReviewHistory';
import YouthIcon from './YouthIcon';
import AdminLayout from './AdminLayout';
import RegistryExport, { type ApprovedProfileLoader } from './RegistryExport';
import { approvedRosterRecords, rosterPeriodLabel } from './registryRoster';
import { REPORT_PERIODS, REPORT_YEARS, submissionDate } from './analyticsOverview';
import type { SampleRecord } from './registryData';
import type { ReviewDetailV2, YouthReviewV2 } from '../../contracts/v1/youth-review-v2';
import StaffDecision from '../auth/StaffDecision';
import LoadingAction from './LoadingAction';
import { LoadingSpinner, TableSkeleton } from './StaffLoading';
import ProfileAnswersPending from './ProfileAnswersPending';
import type { EncoderReceiptV1 } from '../../contracts/v1/youth-workflow';

export type RegistryBackendBinding = {
  reviewContent?: import('react').ReactNode | ((notify: (message: string) => void) => import('react').ReactNode);
  beforeDecision?: import('react').ReactNode;
  suppressLegacyDecision?: boolean;
  exportNotice?: import('react').ReactNode;
  records: SampleRecord[]; detail: Pick<ReviewDetailV2, 'responseId' | 'answers' | 'review'> | null; busy: boolean; error: string;
  open: (key: string | null) => void; refresh: () => Promise<boolean>; denied: () => void;
  decide: YouthReviewV2['decide'];
  loadProfiles?: ApprovedProfileLoader;
  encoderReceipt?: EncoderReceiptV1 | null;
};

const statuses: SampleStatus[] = ['For review', 'Needs changes', 'Approved (demo)', 'Rejected (demo)'];

export function RegistryDemo({ backend, loading = false }: { backend?: RegistryBackendBinding; loading?: boolean }) {
  const practice = usePractice();
  const records = backend?.records ?? registryRecords(practice.responses, practice.fixtureReviews);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(() => ({review:'For review',changes:'Needs changes',approved:'Approved (demo)'}[searchParams.get('status') || ''] || 'All statuses'));
  const [band, setBand] = useState('All age groups');
  const [year, setYear] = useState('all');
  const [period, setPeriod] = useState('full');
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(() => searchParams.get('profile'));
  const [nextStatus, setNextStatus] = useState<SampleStatus>('For review');
  const [correctionFields, setCorrectionFields] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [referenceDate] = useState(profilingDate);
  const [message, setMessage] = useState('');
  const [toastId, setToastId] = useState(0);
  const dismissToast = useCallback(() => setMessage(''), []);
  const notify = (text: string) => { setMessage(text); setToastId(value => value + 1); };
  const selected = records.find(record => record.key === selectedKey);
  const dialog = useRef<HTMLDialogElement>(null);
  const noteInput = useRef<HTMLTextAreaElement>(null);
  const availableKey = selected?.key;
  useEffect(() => {
    if (!selected || !dialog.current || dialog.current.open) return;
    setNextStatus(selected.status);
    setNote(selected.note || '');
    setCorrectionFields(selected.correctionFields || []);
    dialog.current.showModal();
    backend?.open(selected.key);
  }, [availableKey]);
  function closeReview() { dialog.current?.close(); setSelectedKey(null); setReviewError(''); backend?.open(null); }
  const checkedDetail = backend?.detail?.responseId === selectedKey ? backend.detail : null;
  const answers: Answers = backend ? checkedDetail?.answers || {} : selected?.answers || (selected ? fixtureAnswers(selected.key, referenceDate) : {});
  const approvedView = status === 'Approved (demo)';
  const rosterFilters = { year, period, band, query };
  const filtered = approvedView ? approvedRosterRecords(records, rosterFilters, referenceDate) : records.filter(record => (record.name + ' ' + (record.kkNumber || '')).toLowerCase().includes(query.trim().toLowerCase()) && (status === 'All statuses' || record.status === status) && (band === 'All age groups' || record.band === band));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount - 1);
  const pageStart = currentPage * 10;
  const visibleRecords = filtered.slice(pageStart, pageStart + 10);
  const checkedMatching = filtered.filter(record => checkedKeys.includes(record.key)).map(record => record.key);
  useEffect(() => { setCheckedKeys([]); setPage(0); }, [query, status, band, year, period]);
  async function reset() { if (!backend) practice.reset(); setPage(0); setQuery(''); setStatus('All statuses'); setBand('All age groups'); setSelectedKey(null); setCheckedKeys([]); setYear('all'); setPeriod('full'); setExportOpen(false); if (!backend) notify('All records restored.'); else if (await backend.refresh()) notify('Saved records refreshed.'); }
  return <AdminLayout showHeading={false} loading={loading} title="KK Youth Registry" description="Find a profile or open pending reviews. Check every answer before recording your decision.">
    <section id="sample-registry" className="profile-card registry-card"><div className="review-heading"><h1>KK Youth Registry</h1><LoadingAction type="button" className="secondary-button registry-refresh" busy={backend?.busy} onClick={() => { void reset(); }}>{backend ? 'Refresh records' : 'Reset records'}</LoadingAction></div>
      {backend?.error && <p className="auth-error" role="alert">{backend.error}</p>}
      <div className="registry-views" aria-label="Registry views">{[['All profiles', 'All statuses'], ['Pending review', 'For review'], ['Needs changes', 'Needs changes'], ['Approved (demo)', 'Approved (demo)'], ['Rejected (demo)', 'Rejected (demo)']].map(([label, value]) => <button className="secondary-button" key={displayLabel(value)} data-review-status={value} type="button" aria-pressed={status === value} onClick={() => { setStatus(value); setQuery(''); setBand('All age groups'); }}>{displayLabel(label)} <span>({value === 'All statuses' ? records.length : records.filter(record => record.status === value).length})</span></button>)}</div>
      <div className="registry-filters"><div className="profile-field"><label htmlFor="registry-search">Search name or Registration No.</label><input id="registry-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Enter a name or registration number" /></div><div className="profile-field"><label htmlFor="registry-band">Age group</label><select id="registry-band" value={band} onChange={event => setBand(event.target.value)}>{['All age groups', 'Child Youth', 'Core Youth', 'Young Adult'].map(value => <option key={displayLabel(value)}>{displayLabel(value)}</option>)}</select></div></div>
      {approvedView && <>
        <div className="registry-period-filters"><div className="profile-field"><label htmlFor="roster-year">Submission year</label><select id="roster-year" value={year} onChange={event => { setYear(event.target.value); if (event.target.value === 'all') setPeriod('full'); }}><option value="all">All dates</option>{REPORT_YEARS.map(value => <option key={displayLabel(value)}>{displayLabel(value)}</option>)}</select></div><div className="profile-field"><label htmlFor="roster-period">Submission period</label><select id="roster-period" value={period} disabled={year === 'all'} onChange={event => setPeriod(event.target.value)}>{REPORT_PERIODS.map(value => <option key={value.value} value={value.value}>{value.label}</option>)}</select></div></div>
        <p className="field-hint registry-date-hint"><span className="registry-date-reserve" aria-hidden="true">Reporting dates determine the year and quarter. Server activity times are kept separately. Only registry records are listed.</span><span>Reporting dates determine the year and quarter. Server activity times are kept separately. Only registry records are listed.</span></p>
        <div className="registry-export-toolbar"><p><span className="registry-export-count">{filtered.length} matching approved youth · {checkedMatching.length} selected</span><small>{rosterPeriodLabel(rosterFilters)}</small></p><button type="button" className="button" disabled={!filtered.length} onClick={() => setExportOpen(true)}><YouthIcon name="download" />Export approved list</button></div>
      </>}
      {loading ? <TableSkeleton variant="registry" approved={approvedView} label="Loading youth registry…" /> : filtered.length ? <div className="report-table-wrap"><table className="report-table registry-table" data-approved={approvedView}><caption className="sr-only">Youth registry</caption><colgroup>{approvedView && <col className="registry-select-column" />}<col className="registry-profile-column" /><col className="registry-status-column" /><col className="registry-action-column" /></colgroup><thead><tr>{approvedView && <th scope="col" className="registry-select-heading"><input type="checkbox" aria-label="Select all matching approved youth" checked={filtered.length > 0 && checkedMatching.length === filtered.length} ref={input => { if (input) input.indeterminate = checkedMatching.length > 0 && checkedMatching.length < filtered.length; }} onChange={event => setCheckedKeys(event.target.checked ? filtered.map(record => record.key) : [])} /></th>}<th scope="col">Youth profile / Registration No.</th><th scope="col">Review status</th><th scope="col">Action</th></tr></thead><tbody>{visibleRecords.map(record => <tr key={record.key} data-selected={selectedKey === record.key} data-review-status={record.status}><>{approvedView && <td className="registry-row-select"><input type="checkbox" aria-label={`Select ${displayLabel(record.name)}`} checked={checkedKeys.includes(record.key)} onChange={event => setCheckedKeys(previous => event.target.checked ? [...previous, record.key] : previous.filter(key => key !== record.key))} /></td>}<th scope="row"><strong className="registry-profile-name">{displayLabel(record.name)}</strong><small className="kk-number"><span>Registration No.</span> <strong>{record.kkNumber || 'Unassigned'}</strong></small><small>{record.band} · {record.education}</small>{approvedView && <small>Reporting date: {submissionDate(record) || 'Not recorded'}</small>}</th><td className="registry-row-status"><span className="status-pill registry-status" data-review-status={record.status}><YouthIcon name={record.status === 'Approved (demo)' ? 'check' : record.status === 'Rejected (demo)' ? 'close' : record.status === 'Needs changes' ? 'edit' : 'clock'} />{displayLabel(record.status)}</span></td><td className="registry-row-action"><button className="button registry-review-button" onClick={() => { setSelectedKey(record.key); setNextStatus(record.status); setNote(record.note || ''); setCorrectionFields(record.correctionFields || []); setReviewError(''); setMessage(''); }} aria-label={`Review ${displayLabel(record.name)}`}><>{backend && selectedKey === record.key && !backend.detail && !backend.reviewContent && !backend.error ? <LoadingSpinner /> : <YouthIcon name="edit" />}</> Review profile</button></td></></tr>)}</tbody></table></div> : <div className="demo-empty"><h3>{records.length ? "No matching profiles" : "No youth profiles yet"}</h3><p>{!records.length ? 'Submitted youth profiles will appear here for staff review.' : approvedView ? 'Try another search, age group, year or quarter.' : 'Try another name or clear the filters.'}</p><button hidden={!records.length} className="secondary-button" onClick={() => { setQuery(''); setBand('All age groups'); setYear('all'); setPeriod('full'); if (!approvedView) setStatus('All statuses'); }}>Clear filters</button></div>}
      {(loading || filtered.length > 0) && <nav className="registry-pagination" aria-label="Youth registry pages"><div className="registry-page-select"><label htmlFor="registry-page">Page</label><select id="registry-page" value={currentPage} onChange={event => setPage(Number(event.target.value))}>{Array.from({ length: pageCount }, (_, index) => <option key={index} value={index}>{index + 1}</option>)}</select><span>of {pageCount}</span><span className="registry-page-size">10 per page</span></div><div className="registry-page-buttons"><button type="button" className="secondary-button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><YouthIcon name="chevron" />Previous</button>{Array.from({ length: pageCount }, (_, index) => index).filter(index => index === 0 || index === pageCount - 1 || Math.abs(index - currentPage) <= 1).map((index, position, pages) => <span className="registry-page-item" key={index}>{position > 0 && index - pages[position - 1] > 1 && <span className="registry-page-gap" aria-hidden="true">…</span>}<button type="button" className="secondary-button registry-page-number" aria-label={`Page ${index + 1}`} aria-current={currentPage === index ? 'page' : undefined} onClick={() => setPage(index)}>{index + 1}</button></span>)}<button type="button" className="secondary-button" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Next<YouthIcon name="chevron" /></button></div></nav>}
    </section>
    {exportOpen && approvedView && <RegistryExport records={records} filters={rosterFilters} selectedKeys={checkedMatching} referenceDate={referenceDate} loadProfiles={backend?.loadProfiles} exportNotice={backend?.exportNotice} onClose={() => setExportOpen(false)} />}
    {message && !selected && <StatusToast key={toastId} message={message} onClose={dismissToast} />}
    {selected && <dialog ref={dialog} className="registry-dialog" aria-labelledby="sample-review-title" onCancel={event => { event.preventDefault(); closeReview(); }}>
      {message && <StatusToast key={toastId} message={message} onClose={dismissToast} />}
      <header className="registry-dialog-header"><div className="registry-review-heading"><div className="registry-review-title"><h2 id="sample-review-title">{displayLabel(selected.name)}</h2><p>{selected.band} · {selected.education}</p></div><dl className="registry-header-meta"><div><dt>Registration No.</dt><dd className="staff-registration-number">{selected.kkNumber || 'Unassigned'}</dd></div><div><dt>{backend ? 'Reporting date' : 'Profiling date'}</dt><dd><time dateTime={selected.referenceDate || referenceDate}>{selected.referenceDate || referenceDate}</time></dd></div></dl></div><button type="button" className="secondary-button" onClick={closeReview} aria-label="Close review">Close</button></header>
      <div className="registry-dialog-body">
        {backend?.reviewContent ? typeof backend.reviewContent === 'function' ? backend.reviewContent(notify) : backend.reviewContent : <>
        {checkedDetail && <ChangesRequested review={checkedDetail.review} />}
        {backend && !checkedDetail ? backend.error ? <p role="alert">{backend.error}</p> : <ProfileAnswersPending label="Loading saved answers…" /> : <div className="review-sections">{sections.map(section => <ReviewSection key={`${selected.key}-${section.title}`} section={section} answers={answers} />)}</div>}
        {backend ? checkedDetail && <StaffReviewEvidence key={selected.key} review={checkedDetail.review} encoder={backend.encoderReceipt} /> : <ReviewHistory entries={selected.history || []} />}
        {selected.history?.some(entry => entry.consent) && <section className="consent-history"><h3>Consent &amp; certification receipts</h3>{selected.history.filter(entry => entry.consent).map((entry, index) => <dl className="demo-details" key={index}><div><dt>Privacy consent · Accepted</dt><dd><time dateTime={entry.consent!.privacyAcceptedAt}>{entry.consent!.privacyAcceptedAt}</time></dd></div><div><dt>Certification · Accepted</dt><dd><time dateTime={entry.consent!.certifiedAt}>{entry.consent!.certifiedAt}</time></dd></div><div><dt>Notice version</dt><dd>Acknowledged</dd></div></dl>)}<p className="field-hint">Session timestamps are recorded in this browser. Server receipts are unavailable for these entries.</p></section>}
        {backend?.beforeDecision}
        {backend ? checkedDetail && !backend.suppressLegacyDecision && <StaffDecision detail={checkedDetail} decide={backend.decide} denied={backend.denied} resolved={notice => { notify(notice); backend.refresh(); backend.open(selectedKey); }} /> : <section className="review-decision"><h3>Your review decision</h3><p>Approval updates this profile’s review status. It does not verify residency or send a message.</p>
          <form onSubmit={event => { event.preventDefault(); if (['Needs changes', 'Rejected (demo)'].includes(nextStatus) && !note.trim()) { setReviewError('Please explain what needs to be changed. For example: “Please check the birthdate.”'); noteInput.current?.focus(); return; } if (selected.answers) practice.decide(selected.key, nextStatus, note.trim(), correctionFields); else practice.decideFixture(selected.key, nextStatus, note.trim(), correctionFields); notify('Review saved: ' + selected.name + ' — ' + nextStatus + '. No real application was changed or message sent.'); closeReview(); }}>
            <div className="profile-fields"><div className="profile-field wide"><label htmlFor="preview-status">Review decision</label><select id="preview-status" value={nextStatus} onChange={event => { setNextStatus(event.target.value as SampleStatus); setReviewError(''); }}>{statuses.map(value => <option key={displayLabel(value)}>{displayLabel(value)}</option>)}</select><p className="field-hint">For review: leave it waiting. Needs changes: explain what to fix. Approved: try the approval display.</p></div>
            <div className="profile-field wide"><label htmlFor="preview-note">Review note ({['Needs changes', 'Rejected (demo)'].includes(nextStatus) ? 'Required' : 'Optional'})</label><textarea ref={noteInput} id="preview-note" rows={3} value={note} onChange={event => { setNote(event.target.value); setReviewError(''); }} placeholder="Example: Please check the birthdate." aria-invalid={reviewError ? true : undefined} aria-describedby={reviewError ? 'review-note-error' : undefined} />{reviewError && <p id="review-note-error" className="field-error" role="alert">{reviewError}</p>}</div></div>
            <fieldset className="correction-fields" disabled={nextStatus !== 'Needs changes'}><legend>Answers needing correction</legend><p>Select exact fields to create direct update links on the youth dashboard.</p>{visibleFields(editableCorrectionFields, answers).map(field => <label key={field.id}><input type="checkbox" checked={correctionFields.includes(field.id)} onChange={event => setCorrectionFields(previous => event.target.checked ? [...previous, field.id] : previous.filter(id => id !== field.id))} />{field.label}</label>)}</fieldset><div className="form-actions"><button className="button">Save decision</button><button type="button" className="secondary-button" onClick={closeReview}>Cancel</button></div>
          </form>
        </section>}
        </>}
      </div>
    </dialog>}

  </AdminLayout>;
}
