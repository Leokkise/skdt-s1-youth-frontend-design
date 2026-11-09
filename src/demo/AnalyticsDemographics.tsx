import { SkeletonText } from './StaffLoading';
import { useState, type KeyboardEvent } from 'react';
import type { SampleRecord } from './registryData';
import { seriesLabel, monthlyPlotGeometry, expandedPlanningInsights, DEMOGRAPHIC_GROUPS, demographicRows, demographicMonths, monthlyBarSeries, reportWindow, type DemographicKey, type MonthlyRow, type OverviewRow, type ReportSelection } from './analyticsOverview';
import YouthIcon from './YouthIcon';
import AnalyticsDialog from './AnalyticsDialog';
import { AnalyticsDetails, useAnalyticsTooltip } from './AnalyticsTooltip';

const detail = (row: OverviewRow, total: number) => `${row.label}: ${row.count} of ${total} (${row.percent.toFixed(1)}%).`;
export function PlanningInsights({ items }: { items: { title: string; text: string }[] }) {
  return <section className="expanded-planning-guidance" aria-label="Insights"><h3><YouthIcon name="idea" />Insights</h3><dl>{items.filter(item => item.title !== 'Comparison limits').map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.text}</dd></div>)}</dl><p className="planning-evidence-note">Selected approved profiles only; monthly patterns describe submissions, not population changes. {items.filter(item => item.title === 'Comparison limits').map(item => item.text).join(' ')}</p></section>;
}
export function DemographicCard({ group, records, onExpand, title, loading = false }: { loading?: boolean; group: DemographicKey; records: SampleRecord[]; onExpand: () => void; title?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const chart = useAnalyticsTooltip<HTMLElement>();
  const rows = demographicRows(records, group);
  const ranked = group !== 'age' && group !== 'gender';
  const visible = group === 'work' || group === 'education' ? (loading ? rows.slice(0, 5) : rows.filter(row => row.count > 0)) : rows;
  const shown = ranked && group !== 'civic' ? [...visible].sort((a, b) => b.count - a.count) : visible;
  const total = records.length;
  let offset = 0;
  const circumference = 2 * Math.PI * 72;

  function showRow(row: OverviewRow) {
    setActive(row.label);
    const label = seriesLabel(group, row.label);
    chart.show(label, [{ label, value: String(row.count), note: `${row.percent.toFixed(1)}% of ${total} approved profiles`, color: rows.indexOf(row) }]);
  }
  const clear = () => { setActive(null); chart.hide(); };
  return <article ref={chart.root} className={`demographic-card demographic-${group}`} onMouseLeave={event => { if (!event.currentTarget.contains(document.activeElement)) clear(); }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) clear(); }} onKeyDown={event => { if (event.key === 'Escape' && chart.tooltip) { event.preventDefault(); event.stopPropagation(); clear(); } }}>
    <header><h3>{title || DEMOGRAPHIC_GROUPS[group].title}</h3><button type="button" className="analytics-expand" onClick={onExpand} aria-label={`Expand ${title || DEMOGRAPHIC_GROUPS[group].title}`}><YouthIcon name="expand" />Expand</button></header>
    <p className="demographic-subtitle">{group === 'osy' ? 'Self-reported school status · largest groups first' : group === 'civic' || group === 'programs' ? DEMOGRAPHIC_GROUPS[group].detail : ranked ? 'Largest groups first' : 'For the selected period'}</p>
    {!ranked && <svg viewBox="0 0 210 210" className="demographic-donut" aria-hidden="true"><circle cx="105" cy="105" r="72" fill="none" stroke="#eaf0f7" strokeWidth="28" />{rows.filter(row => row.count).map(row => {
      const index = rows.indexOf(row);
      const start = offset; offset += row.percent;
      return <circle key={row.label} className={`demographic-color-${index % 16} demographic-slice`} cx="105" cy="105" r="72" fill="none" strokeWidth={active === row.label ? 34 : 28} strokeDasharray={`${row.percent / 100 * circumference} ${circumference}`} strokeDashoffset={-start / 100 * circumference} transform="rotate(-90 105 105)" onMouseEnter={() => showRow(row)} onClick={() => showRow(row)} />;
    })}<text x="105" y="103" textAnchor="middle" className="donut-total">{total}</text><text x="105" y="124" textAnchor="middle" className="donut-unit">profiles</text></svg>}
    <div className={group === 'work' || group === 'education' ? 'demographic-list-window' : undefined} tabIndex={group === 'work' || group === 'education' ? 0 : undefined} role={group === 'work' || group === 'education' ? 'region' : undefined} aria-label={group === 'work' || group === 'education' ? (title || DEMOGRAPHIC_GROUPS[group].title) + ' categories' : undefined}><ul className={`demographic-values ${ranked ? 'civil-values' : ''}`}>{shown.map(row => <li key={row.label} data-active={active === row.label}><button type="button" onMouseEnter={() => showRow(row)} onFocus={() => showRow(row)} onClick={() => showRow(row)} aria-label={detail(row, total)} aria-describedby={active === row.label && chart.tooltip ? chart.id : undefined}><span className={`demographic-dot demographic-color-${rows.indexOf(row) % 16}`} /><span>{loading ? <SkeletonText>{seriesLabel(group, row.label)}</SkeletonText> : seriesLabel(group, row.label)}</span><strong>{row.count} <small>({row.percent.toFixed(0)}%)</small></strong>{ranked && <span className="demographic-civil-track" aria-hidden="true"><span className={`demographic-color-${rows.indexOf(row) % 16}`} style={{ width: `${row.percent}%` }} /></span>}</button></li>)}</ul>
    {!shown.length && <p>No approved profiles in this selection.</p>}</div>
    {!ranked && <div className="demographic-strip" aria-hidden="true">{rows.map((row, index) => <span key={row.label} className={`demographic-color-${index % 16}`} style={{ width: `${row.percent}%` }} onMouseEnter={() => showRow(row)} onClick={() => showRow(row)} />)}</div>}
    <AnalyticsDetails chart={chart} hint={`${total} approved profiles in this selection.`} />
  </article>;
}

export function MonthlyChart({ group, rows, labels, periodLabel, axis = 'month' }: { group: DemographicKey; rows: MonthlyRow[]; labels: string[]; periodLabel: string; axis?: 'month' | 'education' }) {
  const chart = useAnalyticsTooltip<HTMLDivElement>();
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const series = monthlyBarSeries(rows, labels, selectedCategory);
  const visibleCategories = labels.flatMap((_, index) => selectedCategory === null || selectedCategory === index ? [index] : []);
  const chartWidth = Math.max(axis === 'education' ? rows.length * 185 : 0, 970, 104 + rows.length * Math.max(80, visibleCategories.length * 22 + 28));
  const plot = monthlyPlotGeometry(rows.length, chartWidth);
  const x = plot.x;
  const y = (value: number) => 260 - value / series.ceiling * 224;
  const band = plot.band;
  function showMonth(row: MonthlyRow, month: number) {
    if (!row.observed) { clear(); return; }
    setActiveMonth(month);
    chart.show(`${row.label} · ${row.total ?? 'Selected'} ${axis === 'education' ? 'profiles at this education level' : 'approved profiles submitted'}`, visibleCategories.map(index => { const count = series.values[month]?.[index] || 0; return { label: seriesLabel(group, labels[index]), value: String(count), note: row.total ? `${(count / row.total * 100).toFixed(1)}% of ${row.total} profiles` : 'No profiles recorded', color: index }; }));
  }
  function clear() { setActiveMonth(null); chart.hide(); }
  function moveMonth(event: KeyboardEvent<SVGGElement>, month: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const available = rows.flatMap((row, index) => row.observed ? [index] : []);
    const position = available.indexOf(month);
    const next = event.key === 'Home' ? available[0] : event.key === 'End' ? available.at(-1) : available[Math.max(0, Math.min(available.length - 1, position + (event.key === 'ArrowRight' ? 1 : -1)))];
    chart.root.current?.querySelector<SVGGElement>(`g[data-month-index="${next}"]`)?.focus();
  }
  return <section className="interactive-monthly-bars" data-color-group={axis === 'education' ? 'age' : group} aria-label={`${DEMOGRAPHIC_GROUPS[group].title}, monthly chart`}>
    <header className="monthly-bars-heading">
      <div className="monthly-bars-title">
        <h3>{axis === 'month' ? (group === 'programs' ? 'Suggested themes by submission month' : 'Monthly profile submissions') : 'Education by age group'}</h3>
        <p className="expanded-period">{periodLabel}</p>
      </div>
      {(group === 'civic' || group === 'programs') && <p className="field-hint">{DEMOGRAPHIC_GROUPS[group].detail}</p>}
      <ul className="monthly-series-totals" aria-label="Filter chart by category">
        {labels.map((label, index) => <li key={label}><button type="button" aria-pressed={selectedCategory === index} onClick={() => { clear(); setSelectedCategory(selectedCategory === index ? null : index); }}><span><i className={`demographic-dot demographic-color-${index % 16}`} aria-hidden="true" />{seriesLabel(group, label)}</span><strong>{series.totals[index]}</strong></button></li>)}
      </ul>
    </header>
    <p className="field-hint">Select a category above to focus the chart. Scroll horizontally to see more groups.</p><div ref={chart.root} className="monthly-chart-frame" onMouseLeave={event => { if (!event.currentTarget.contains(document.activeElement)) clear(); }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) clear(); }} onKeyDown={event => { if (event.key === 'Escape' && chart.tooltip) { event.preventDefault(); event.stopPropagation(); clear(); } }}>
      <div className="demographic-chart-scroll" role="region" tabIndex={0} aria-label="Monthly chart. Scroll horizontally if needed."><svg style={{ width: chartWidth, minWidth: '100%', height: rows.length <= 6 ? 360 : 310, maxHeight: 'none' }} viewBox={`0 0 ${chartWidth} 310`} className={`demographic-monthly-chart ${rows.length > 6 ? 'monthly-chart-year' : 'monthly-chart-quarter'}`} role="group" aria-label={`${DEMOGRAPHIC_GROUPS[group].title}, visible categories by month`}>
        {activeMonth !== null && <rect className="monthly-band-highlight" x={band(activeMonth).left} y="30" width={band(activeMonth).right - band(activeMonth).left} height="234" fill="#eaf0f7" />}
        {Array.from({ length: series.ceiling / series.tickStep + 1 }, (_, tick) => <g key={tick}><line x1={plot.left} x2={plot.right} y1={y(tick * series.tickStep)} y2={y(tick * series.tickStep)} stroke="#d4e2f0" /><text x={plot.left - 16} y={y(tick * series.tickStep) + 5} textAnchor="end" className="monthly-axis">{tick * series.tickStep}</text></g>)}
        {rows.map((row, month) => {
          const counts = series.values[month];
          const area = band(month);
          const groupWidth = Math.min(area.right - area.left - 24, Math.max(36, visibleCategories.length * (rows.length <= 6 ? 30 : 22)));
          const slotWidth = groupWidth / Math.max(1, visibleCategories.length);
          const description = counts ? `${row.label}: ${visibleCategories.map(index => `${seriesLabel(group, labels[index])} ${counts[index]}`).join(', ')} profiles.` : `${row.label}: not yet observed.`;
          return <g key={row.label} data-month-index={month} data-active={activeMonth === month} role="img" tabIndex={row.observed ? 0 : undefined} aria-label={description} aria-describedby={activeMonth === month && chart.tooltip ? chart.id : undefined} onMouseEnter={() => showMonth(row, month)} onFocus={() => showMonth(row, month)} onClick={() => showMonth(row, month)} onKeyDown={event => moveMonth(event, month)}>
            <rect x={area.left} y="30" width={area.right - area.left} height="234" fill="transparent" />
            {counts && visibleCategories.map((index, position) => {
              const left = x(month) - groupWidth / 2 + position * slotWidth + 1;
              const top = y(counts[index]), width = Math.max(1, slotWidth - 2);
              const radius = Math.min(6, width / 2, (260 - top) / 2);
              return <path key={labels[index]} className="monthly-column monthly-interactive-bar" d={`M ${left} 260 L ${left} ${top + radius} Q ${left} ${top} ${left + radius} ${top} H ${left + width - radius} Q ${left + width} ${top} ${left + width} ${top + radius} V 260 Z`} fill={`var(--demographic-${index % 16})`} aria-hidden="true" />;
            })}
            <text x={x(month)} y="290" textAnchor="middle" className="monthly-axis" opacity={row.observed ? 1 : .5}><title>{row.label}</title>{axis === 'education' && row.label.length > 22 ? `${row.label.slice(0, 20)}…` : row.label}</text>
          </g>;
        })}
      </svg></div>
      <AnalyticsDetails chart={chart} hint={axis === 'education' ? 'Inspect an education level to compare its age groups.' : 'Inspect a month to compare category counts and shares.'} />
    </div>
  </section>;
}
export function DemographicExpanded({ group, records, selection, referenceDate, onClose }: { group: DemographicKey; records: SampleRecord[]; selection: ReportSelection; referenceDate: string; onClose: () => void }) {
  const rows = demographicMonths(records, group, selection, referenceDate);
  const labels = demographicRows(records, group).map(row => row.label);
  return <AnalyticsDialog title={DEMOGRAPHIC_GROUPS[group].title} onClose={onClose}>
    <MonthlyChart group={group} rows={rows} labels={labels} periodLabel={`${reportWindow(selection, referenceDate).label} · ${selection.band}`} />
    <PlanningInsights items={expandedPlanningInsights(records, group, selection, referenceDate)} />
    <div className="demographic-table-wrap" role="region" aria-label="Monthly counts table" tabIndex={0}><table className="demographic-month-table" style={{ minWidth: Math.max(640, 120 + labels.length * 180) }}><caption>Approved profiles by first submission month · {selection.year}</caption><colgroup><col className="month-name-column" />{labels.map(label => <col key={label} />)}</colgroup><thead><tr><th scope="col">Month</th>{labels.map(label => <th key={label} scope="col">{seriesLabel(group, label)}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{row.counts.map((count, index) => <td key={labels[index]}>{row.observed ? count : <span aria-label="Not yet observed">—</span>}</td>)}</tr>)}</tbody><tfoot><tr><th scope="row">Period total</th>{labels.map((label, index) => <td key={label}>{rows.reduce((sum, row) => sum + row.counts[index], 0)}</td>)}</tr></tfoot></table></div>
    <p className="field-hint">Zero means no recorded profiles. A dash marks a future month. Categories use answers recorded at profiling; monthly counts track submissions, not population changes.</p>
  </AnalyticsDialog>;
}

export function CommunityCard({ group, records, onExpand, loading = false }: { loading?: boolean; group: 'osy' | 'civic'; records: SampleRecord[]; onExpand: () => void }) {
  return <DemographicCard group={group} records={records} onExpand={onExpand} loading={loading} />;
}
