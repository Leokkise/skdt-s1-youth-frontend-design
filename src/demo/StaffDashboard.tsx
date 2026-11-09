import { SkeletonText } from './StaffLoading';
import { displayLabel } from '../presentation-copy';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { initialRecords, registryRecords, type SampleRecord } from './registryData';
import { usePractice } from './PracticeStore';
import AdminLayout from './AdminLayout';
import { profilingDate } from '../profiling/validation';
import { Distribution } from './StaffCharts';
import StaffAnalytics from './StaffAnalytics';
import YouthIcon from './YouthIcon';
import { demographicRows, overviewMetrics, selectedApproved } from './analyticsOverview';

const bands = ['Child Youth', 'Core Youth', 'Young Adult'];
export function Demographics({ compact = false, records = initialRecords }: { compact?: boolean; records?: SampleRecord[] }) {
  return <Distribution interactive={!compact} variant="age" title={compact ? 'A picture of our youth' : 'Youth by age group'} rows={bands.map(label => ({ label, count: records.filter(record => record.band === label).length, percent: records.length ? records.filter(record => record.band === label).length / records.length * 100 : 0 }))} description={records.length + ' profiles · Not official barangay statistics.'} />;
}
export default function StaffDashboard({ reports = false, records, analyticsRecords, activity, recovery, loading = false }: { loading?: boolean; reports?: boolean; records?: SampleRecord[]; analyticsRecords?: SampleRecord[]; activity?: ReactNode; recovery?: ReactNode }) {
  return reports ? <StaffAnalytics records={analyticsRecords ?? records} loading={loading} /> : <StaffOverview records={records} analyticsRecords={analyticsRecords} activity={activity} recovery={recovery} loading={loading} />;
}
function StaffOverview({ records: savedRecords, analyticsRecords, activity, recovery, loading }: { loading: boolean; records?: SampleRecord[]; analyticsRecords?: SampleRecord[]; activity?: ReactNode; recovery?: ReactNode }) {
  const practice = usePractice();
  const records = savedRecords ?? registryRecords(practice.responses, practice.fixtureReviews);
  const [date] = useState(profilingDate);
  const count = (status: string) => records.filter(record => record.status === status).length;
  const attention = records.filter(record => ['For review', 'Needs changes'].includes(record.status)).slice(0, 5);
  const approved = selectedApproved(analyticsRecords ?? records, {year:date.slice(0,4),period:'full',band:'All age groups'}, date);
  const metrics = overviewMetrics(approved);
  const value = (content: ReactNode) => loading ? <SkeletonText>{content}</SkeletonText> : content;
  const summaries = [
    {label:'Total profiles',count:records.length,detail:'All submitted registry profiles',status:'all',icon:'profile' as const},
    {label:'Awaiting review',count:count('For review'),detail:'Profiles ready for staff review',status:'review',icon:'clock' as const},
    {label:'Needs changes',count:count('Needs changes'),detail:'Profiles that need follow-up',status:'changes',icon:'edit' as const},
    {label:'Approved profiles',count:count('Approved (demo)'),detail:'Completed and approved reviews',status:'approved',icon:'check' as const},
  ];
  return <AdminLayout showHeading={false} loading={loading} title="Staff dashboard" description="An overview of your youth profiling workspace.">
    <header className="dashboard-intro dashboard-page-heading"><h1>Staff dashboard</h1><span>As of {new Intl.DateTimeFormat('en-PH',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'))}</span></header>
    <section className="dashboard-summary demo-stats" aria-label="Registry summary">{summaries.map(card=><article key={card.label} data-summary={card.status}><Link to={'/admin/youth/demo?status='+card.status}><span className="dashboard-summary-top"><span>{card.label}</span><YouthIcon name={card.icon}/></span><strong>{value(card.count)}</strong><span className="dashboard-summary-detail">{card.detail}<YouthIcon name="chevron"/></span></Link></article>)}</section>
    <div className="dashboard-preview-grid">
      <section className="profile-card dashboard-preview" aria-labelledby="dashboard-registry-title"><div className="dashboard-panel-heading"><div><YouthIcon name="profile"/><h2 id="dashboard-registry-title">KK Youth Registry</h2></div><Link to="/admin/youth/demo">View registry<YouthIcon name="chevron"/></Link></div>
        {loading && !attention.length ? <p className="dashboard-empty" role="status">Loading registry profiles…</p> : attention.length ? <ol className="dashboard-preview-list">{attention.map((record,index)=><li key={record?.key ?? index}><div><strong>{value(record ? displayLabel(record.name) : 'Youth profile name')}</strong><span>Registration No. <strong className="staff-registration-number">{value(record?.kkNumber ?? '0000')}</strong></span></div><div className="dashboard-profile-action">{loading ? <span className="dashboard-status"><SkeletonText>Awaiting review</SkeletonText></span> : <span className="dashboard-status" data-status={record?.status === 'For review' ? 'review' : 'changes'}>{record?.status === 'For review' ? 'Awaiting review' : 'Needs changes'}</span>}{loading ? <a aria-disabled="true" tabIndex={-1}><SkeletonText>Review profile</SkeletonText><YouthIcon name="chevron" /></a> : <Link to={'/admin/youth/demo?profile='+encodeURIComponent(record!.key)} aria-label={'Review profile for '+displayLabel(record!.name)}>Review profile<YouthIcon name="chevron"/></Link>}</div></li>)}</ol> : <div className="demo-empty dashboard-empty" role="status"><h3>{records.length ? "No profiles need attention" : "No youth profiles yet"}</h3><p>{records.length ? "There are no profiles awaiting review or changes." : "Submitted youth profiles will appear here when they are ready for review."}</p></div>}
        <div className="dashboard-panel-footer dashboard-registry-counts">
          <span className="status-pill staff-event-tone" data-tone={loading ? undefined : 'info'}>{value(count('For review') + ' awaiting review')}</span>
          <span className="status-pill staff-event-tone" data-tone={loading ? undefined : 'waiting'}>{value(count('Needs changes') + ' need changes')}</span>
          <span className="status-pill staff-event-tone" data-tone={loading ? undefined : 'failure'}>{value(count('Rejected (demo)') + ' rejected')}</span>
        </div>
      </section>
      {recovery || <section className="profile-card dashboard-preview"><div className="dashboard-panel-heading"><div><YouthIcon name="lock"/><h2>Account recovery</h2></div></div><p className="dashboard-empty">Sign in with recovery access to view recent cases.</p></section>}
      <section className="profile-card dashboard-preview dashboard-analytics" aria-labelledby="dashboard-analytics-title"><div className="dashboard-panel-heading"><div><YouthIcon name="report"/><h2 id="dashboard-analytics-title">Analytics at a glance</h2></div><Link to="/admin/youth/reports">View analytics<YouthIcon name="chevron"/></Link></div>
        {!loading && !approved.length ? <div className="demo-empty dashboard-empty" role="status"><h3>No analytics data yet</h3><p>Approved profiles for this year will appear in this summary.</p></div> : <dl className="dashboard-analytics-list"><div><dt>Approved profiles this year</dt><dd>{value(approved.length)}</dd><p>{value('Profiles included in this summary')}</p></div>{[{label:'Out-of-school youth',metric:metrics.osy},{label:'Youth with work',metric:metrics.employment},{label:'Registered national voters',metric:metrics.voter},{label:'Attended a KK assembly',metric:metrics.assembly}].map(({label,metric})=><div key={label}><dt>{label}</dt><dd>{value(metric.value === null ? '—' : Math.round(metric.value)+'%')}</dd><p>{value(metric.known ? metric.count+' of '+metric.known+' profiles with an answer' : 'No answers available yet')}</p></div>)}</dl>}
        {(loading || approved.length > 0) && <div className="dashboard-age-breakdown"><h3>Approved profiles by age group</h3><dl>{demographicRows(approved, 'age').map(({ label, count }) => <div key={label}><dt>{label}</dt><dd>{value(count)}</dd></div>)}</dl></div>}
      </section>
      {activity || <section className="profile-card dashboard-preview"><div className="dashboard-panel-heading"><div><YouthIcon name="clock"/><h2>Recent activity</h2></div><Link to="/admin/youth/activity">View activity logs<YouthIcon name="chevron"/></Link></div><p className="dashboard-empty">Sign in to view recorded staff activity.</p></section>}
    </div>
  </AdminLayout>;
}
