import AnalyticsPlanning from './AnalyticsPlanning';
import { useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { usePractice } from './PracticeStore';
import { registryRecords, type SampleRecord } from './registryData';
import { analyticsSamples } from './analyticsSamples';
import { profilingDate } from '../profiling/validation';
import { REPORT_YEARS, REPORT_PERIODS, REPORT_BANDS, selectedApproved, analyticsSummary, analyticsMetricLabel, ANALYTICS_CARD_TITLES, reportWindow, type DemographicKey, type ReportSelection } from './analyticsOverview';
import { CommunityCard, DemographicCard, DemographicExpanded } from './AnalyticsDemographics';
import AnalyticsExport from './AnalyticsExport';
import YouthIcon from './YouthIcon';

export default function StaffAnalytics({ records: savedRecords, loading = false }: { loading?: boolean; records?: SampleRecord[] }) {
  const practice = usePractice();
  const [date] = useState(profilingDate);
  const [selection, setSelection] = useState<ReportSelection>({ year: '2026', period: 'full', band: 'All age groups' });
  const [expanded, setExpanded] = useState<DemographicKey | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const all = useMemo(() => savedRecords ?? [...registryRecords(practice.responses, practice.fixtureReviews), ...analyticsSamples(date > '2026-12-31' ? '2026-12-31' : date)], [date, practice.responses, practice.fixtureReviews, savedRecords]);
  const window = reportWindow(selection, date);
  const records = selectedApproved(all, selection, date);
  const cards = analyticsSummary(records, window, savedRecords !== undefined);
  return <AdminLayout loading={loading} wide title="Analytics" description="Understand youth profiles and turn findings into practical planning questions.">
    <div className="analytics-overview">
      <section className="analytics-filter-bar" aria-label="Analytics filters">
        <div><label htmlFor="analytics-year">Year</label><select id="analytics-year" value={selection.year} onChange={event => setSelection(previous => ({ ...previous, year: event.target.value }))}>{REPORT_YEARS.map(year => <option key={year}>{year}</option>)}</select></div>
        <div><label htmlFor="analytics-period">Period</label><select id="analytics-period" value={selection.period} onChange={event => setSelection(previous => ({ ...previous, period: event.target.value }))}>{REPORT_PERIODS.map(period => <option key={period.value} value={period.value}>{period.label}</option>)}</select></div>
        <div><label htmlFor="analytics-band">Age group</label><select id="analytics-band" value={selection.band} onChange={event => setSelection(previous => ({ ...previous, band: event.target.value }))}>{REPORT_BANDS.map(band => <option key={band}>{band}</option>)}</select></div>
        <button type="button" className="button analytics-export-button" onClick={() => setExportOpen(true)}><YouthIcon name="download" />Export report</button>
        <p className="analytics-filter-summary" role="status">{window.label} · {selection.band}{window.through < window.start ? ' · This period has not started' : window.partial ? ` · Data through ${window.through}` : ''}</p>
      </section>
      {!loading && !records.length ? <section className="profile-card"><div className="demo-empty" role="status"><h2>No analytics data for this selection</h2><p>Analytics uses approved youth profiles. Once profiles are approved for this period and age group, their summaries and charts will appear here.</p><p>Try another year, period or age group to check for available data.</p></div></section> : <><section className="analytics-metric-grid" aria-label="Selected period summary">{cards.map((card, index) => <article className="analytics-metric-card" key={card.label}><div className="analytics-metric-heading"><h2>{card.label}</h2><span className="analytics-metric-icon" aria-hidden="true"><YouthIcon name={(['profile', 'report', 'dashboard', 'clock'] as const)[index]} /></span></div><strong className="analytics-metric-value">{analyticsMetricLabel(card)}</strong><p>{card.context}</p></article>)}</section>
      <section className="analytics-demographics" aria-labelledby="demographics-title"><h2 id="demographics-title">{ANALYTICS_CARD_TITLES.demographics}</h2><div className="demographic-card-grid">{(['age', 'gender', 'civil'] as DemographicKey[]).map(group => <DemographicCard loading={loading} key={`${group}-${selection.year}-${selection.period}-${selection.band}`} group={group} records={records} onExpand={() => setExpanded(group)} />)}</div></section>
      <section className="analytics-demographics" aria-label="Education and civic participation"><h2>Education &amp; civic participation</h2><div className="analytics-paired-cards">{(['osy', 'civic'] as const).map(group => <CommunityCard loading={loading} key={`${group}-${selection.year}-${selection.period}-${selection.band}`} group={group} records={records} onExpand={() => setExpanded(group)} />)}</div></section>
      <AnalyticsPlanning loading={loading} key={`${selection.year}-${selection.period}-${selection.band}`} records={records} selection={selection} referenceDate={date} />
      </>}
      {expanded && <DemographicExpanded group={expanded} records={records} selection={selection} referenceDate={date} onClose={() => setExpanded(null)} />}
      {exportOpen && <AnalyticsExport saved={savedRecords !== undefined} records={all} referenceDate={date} selection={selection} onClose={() => setExportOpen(false)} />}
    </div>
  </AdminLayout>;
}
