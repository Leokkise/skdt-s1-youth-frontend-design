import { useState } from 'react';
import type { SampleRecord } from './registryData';
import { educationAgeRows, educationAgeInsights, ANALYTICS_CARD_TITLES, REPORT_BANDS, reportWindow, type ReportSelection, type MonthlyRow } from './analyticsOverview';
import { DemographicCard, DemographicExpanded, MonthlyChart, PlanningInsights } from './AnalyticsDemographics';
import AnalyticsDialog from './AnalyticsDialog';
import YouthIcon from './YouthIcon';
import { AnalyticsDetails, useAnalyticsTooltip } from './AnalyticsTooltip';

type PlanningGroup = 'programs' | 'work' | 'education';
const titles = ANALYTICS_CARD_TITLES;
export default function AnalyticsPlanning({ records, selection, referenceDate, loading = false }: { loading?: boolean; records: SampleRecord[]; selection: ReportSelection; referenceDate: string }) {
  const [expanded, setExpanded] = useState<PlanningGroup | 'cross' | null>(null);
  const details = useAnalyticsTooltip<HTMLDivElement>();
  const cross = loading ? educationAgeRows(records).slice(0, 3) : educationAgeRows(records).filter(row => row.count > 0);
  const crossRows: MonthlyRow[] = cross.map((row, index) => ({ month: index + 1, label: row.label, observed: true, counts: row.counts, total: row.count }));
  function educationAgeBars() {
    const bands = [...REPORT_BANDS.slice(1), 'Age group not provided'];
    return <div ref={details.root} className="education-age-bars" onMouseLeave={event => { if (!event.currentTarget.contains(document.activeElement)) details.hide(); }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) details.hide(); }} onKeyDown={event => { if (event.key === 'Escape' && details.tooltip) { event.preventDefault(); event.stopPropagation(); details.hide(); } }}><p className="demographic-subtitle">Each bar shows the age mix within an education level. Counts stay visible below it.</p><ul className="monthly-series-legend">{bands.map((band, index) => <li key={band}><span className={`demographic-dot demographic-color-${index}`} />{band}</li>)}</ul><div className="education-age-rows" tabIndex={0} role="region" aria-label="Education levels by age group">{[...cross].sort((a,b) => b.count-a.count).map(row => {
      const counts = [...row.counts, row.count - row.counts.reduce((sum, count) => sum + count, 0)];
      function show() {
        details.show(row.label + ' · ' + row.count + ' profiles', counts.map((count, index) => ({ label: bands[index], value: String(count), note: (count / Math.max(1, row.count) * 100).toFixed(1) + '% at this education level', color: index })));
      }
      return <div className="education-age-row" key={row.label}><div className="education-age-heading"><strong>{row.label}</strong><span>{row.count} {row.count === 1 ? 'profile' : 'profiles'}</span></div><button type="button" className="education-age-inspect" onMouseEnter={show} onFocus={show} onClick={show} aria-label={'Inspect age distribution for ' + row.label} aria-describedby={details.tooltip?.title.startsWith(row.label + ' ·') ? details.id : undefined}><span className="community-share-track" aria-hidden="true">{counts.map((count, index) => <span key={bands[index]} className={`demographic-color-${index}`} style={{ width: `${count / Math.max(1, row.count) * 100}%` }} />)}</span><span className="education-age-counts">{counts.map((count,index) => (index < 3 || count > 0) && <span key={bands[index]}><i className={`demographic-dot demographic-color-${index}`} /><span>{bands[index]}</span><strong>{count} <small>({Math.round(count / Math.max(1, row.count) * 100)}%)</small></strong></span>)}</span></button></div>;
    })}{!cross.length && <p>No profiles in this selection.</p>}</div><AnalyticsDetails chart={details} hint="Inspect an education level for its age distribution." /></div>;
  }
  return <>
    <section className="analytics-demographics"><h2>{titles.workEducation}</h2><div className="analytics-paired-cards">{(['work', 'education'] as const).map(group => <DemographicCard loading={loading} key={group} group={group} title={titles[group]} records={records} onExpand={() => setExpanded(group)} />)}</div></section>
    <div className="analytics-paired-sections">
    <section className="analytics-demographics"><h2>Program planning &amp; priority ranking</h2><DemographicCard loading={loading} group="programs" records={records} onExpand={() => setExpanded('programs')} /></section>
    <section className="analytics-demographics"><h2>Cross-tabulation</h2><article className="demographic-card community-card"><header><h3>{titles.cross}</h3><button type="button" className="analytics-expand" onClick={() => setExpanded('cross')}><YouthIcon name="expand" />Expand</button></header>{educationAgeBars()}</article></section>
    </div>

    {expanded && expanded !== 'cross' && <DemographicExpanded group={expanded} records={records} selection={selection} referenceDate={referenceDate} onClose={() => setExpanded(null)} />}
    {expanded === 'cross' && <AnalyticsDialog title={titles.cross} onClose={() => setExpanded(null)}><MonthlyChart axis="education" group="education" rows={crossRows} labels={REPORT_BANDS.slice(1)} periodLabel={`${reportWindow(selection, referenceDate).label} · ${selection.band}`} /><PlanningInsights items={educationAgeInsights(records)} /><div className="demographic-table-wrap" role="region" tabIndex={0} aria-label="Education by age counts table"><table className="demographic-month-table education-age-table"><caption>Educational attainment by youth age group · {selection.year}</caption><colgroup><col style={{ width: 300 }} />{REPORT_BANDS.slice(1).map(band => <col key={band} />)}</colgroup><thead><tr><th scope="col">Education</th>{REPORT_BANDS.slice(1).map(band => <th scope="col" key={band}>{band}</th>)}</tr></thead><tbody>{cross.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{row.counts.map((count,index) => <td key={index}>{count}</td>)}</tr>)}</tbody><tfoot><tr><th scope="row">Period total</th>{REPORT_BANDS.slice(1).map((band,index) => <td key={band}>{cross.reduce((sum,row) => sum + row.counts[index],0)}</td>)}</tr></tfoot></table></div></AnalyticsDialog>}
  </>;
}
