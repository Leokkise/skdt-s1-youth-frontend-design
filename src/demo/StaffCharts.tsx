import { useId, useState } from 'react';
import type { CountRow } from './staffInsights';

export function Distribution({ title, rows, description = 'Counts and percentages of the displayed profiles.', variant = 'bars', interactive = true }: { title: string; rows: CountRow[]; description?: string; variant?: 'bars' | 'age' | 'composition' | 'pie' | 'work'; interactive?: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const detailsId = useId();
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const selected = rows.find(row => row.label === active);
  const circumference = 2 * Math.PI * 66;
  let offset = 0;
  const events = (row: CountRow) => interactive ? { onMouseEnter: () => setActive(row.label), onFocus: () => setActive(row.label), onClick: () => setActive(row.label), 'aria-describedby': detailsId } : {};
  const detail = (row: CountRow) => `${row.label}: ${row.count} of ${total} profiles (${row.percent.toFixed(1)}%).`;
  return <section key={JSON.stringify(rows)} className={`analytics-section insight-chart insight-${variant}`} onMouseLeave={() => setActive(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(null); }} onKeyDown={event => { if (event.key === 'Escape') setActive(null); }}>
    <h2>{title}</h2><p>{description}</p>{total ? <>
      {variant === 'age' ? <dl className="age-columns">{rows.map((row, index) => <div key={row.label} data-chart-active={active === row.label}>
        <dt>{row.label}</dt><dd><strong>{row.count}</strong><button type="button" className="age-column-track chart-inspect" disabled={!interactive} aria-label={detail(row)} {...events(row)}><span className={`chart-color-${index % 4}`} style={{ height: `${row.percent}%` }} /></button><small>{row.percent.toFixed(1)}%</small></dd>
      </div>)}</dl> : variant === 'composition' || variant === 'pie' ? <div className="composition-chart">
        <svg viewBox="0 0 180 180" className="composition-ring" aria-hidden="true">{variant === 'composition' && <circle className="ring-ground" cx="90" cy="90" r="66" fill="none" strokeWidth="22" />}{rows.map((row, index) => {
          const start = offset; offset += row.percent;
          const shared = { className: `chart-color-${index % 4} circle-slice`, 'data-chart-active': active === row.label, onMouseEnter: () => { if (interactive) setActive(row.label); }, onClick: () => { if (interactive) setActive(row.label); } };
          if (variant === 'composition') return <circle key={row.label} {...shared} cx="90" cy="90" r="66" fill="none" strokeWidth="22" strokeDasharray={`${row.percent / 100 * circumference} ${circumference}`} strokeDashoffset={-start / 100 * circumference} transform="rotate(-90 90 90)" />;
          const point = (percent: number) => { const angle = (percent / 100 * 360 - 90) * Math.PI / 180; return `${90 + 76 * Math.cos(angle)} ${90 + 76 * Math.sin(angle)}`; };
          return row.percent >= 100 ? <circle key={row.label} {...shared} cx="90" cy="90" r="76" /> : <path key={row.label} {...shared} d={`M90 90 L${point(start)} A76 76 0 ${row.percent > 50 ? 1 : 0} 1 ${point(offset)} Z`} />;
        })}{variant === 'composition' && <><text x="90" y="88" textAnchor="middle" className="ring-total">{total}</text><text x="90" y="108" textAnchor="middle" className="ring-label">profiles</text></>}</svg>
        <dl className="composition-legend">{rows.map((row, index) => <div key={row.label} data-chart-active={active === row.label}><dt><button type="button" className="chart-legend-button" disabled={!interactive} aria-label={`Show details. ${detail(row)}`} {...events(row)}><span className={`chart-dot chart-color-${index % 4}`} aria-hidden="true" />{row.label}</button></dt><dd><strong>{row.count}</strong><span>{row.percent.toFixed(1)}%</span></dd></div>)}</dl>
      </div> : variant === 'work' ? <>
        <div className="work-composition" aria-hidden="true">{rows.map((row, index) => <span key={row.label} className={`chart-color-${index % 4}`} style={{ width: `${row.percent}%` }} data-chart-active={active === row.label} onMouseEnter={() => { if (interactive) setActive(row.label); }} />)}</div>
        <dl className="work-legend">{rows.map((row, index) => <div key={row.label} data-chart-active={active === row.label}><dt><button type="button" className="chart-legend-button" disabled={!interactive} aria-label={`Show details. ${detail(row)}`} {...events(row)}><span className={`chart-dot chart-color-${index % 4}`} aria-hidden="true" />{row.label}</button></dt><dd><strong>{row.percent.toFixed(1)}<small>%</small></strong><span>{row.count} of {total} profiles</span></dd></div>)}</dl>
      </> : <dl className="insight-bars">{rows.map((row, index) => <div key={row.label} data-chart-active={active === row.label}><dt>{row.label}</dt><dd><strong>{row.count}<small>{row.percent.toFixed(1)}%</small></strong><button type="button" className="insight-bar-track chart-inspect" disabled={!interactive} aria-label={`Show details. ${detail(row)}`} {...events(row)}><span className={`chart-color-${index % 4}`} style={{ width: `${row.percent}%` }} /></button></dd></div>)}</dl>}
      {interactive && <p id={detailsId} className="chart-details">{selected ? detail(selected) : 'Hover, tap or focus a chart item to see its count and share.'}</p>}
    </> : <p className="analytics-empty">No profiles match this report selection.</p>}
  </section>;
}

export type ComparisonRow = { label: string; current: number; previous: number };
export function ComparisonChart({ title, rows, currentLabel, previousLabel, description }: { title: string; rows: ComparisonRow[]; currentLabel: string; previousLabel: string; description: string }) {
  const [active, setActive] = useState<{ label: string; series: string; count: number } | null>(null);
  const detailsId = useId();
  const max = Math.max(4, ...rows.flatMap(row => [row.current, row.previous]));
  const ceiling = Math.ceil(max / 4) * 4;
  return <section className="analytics-section period-comparison-chart" onMouseLeave={() => setActive(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(null); }} onKeyDown={event => { if (event.key === 'Escape') setActive(null); }}>
    <h2>{title}</h2><p>{description}</p>
    <ul className="series-legend"><li><span className="chart-dot chart-color-0" />{currentLabel}</li><li><span className="chart-dot chart-color-2" />{previousLabel}</li></ul>
    <div className="comparison-scroll" role="region" aria-label={`${title}. Scroll horizontally to see all groups.`} tabIndex={0}><div className={`comparison-plot ${rows.length > 6 ? 'many-groups' : ''}`}>
      <div className="comparison-axis" aria-hidden="true">{[4, 3, 2, 1, 0].map(tick => <span key={tick}>{ceiling / 4 * tick}</span>)}</div>
      <div className="comparison-grid" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
        {rows.map(row => <div className="comparison-group" key={row.label}><div className="comparison-bars">{(['current', 'previous'] as const).map((series, index) => {
          const seriesLabel = series === 'current' ? currentLabel : previousLabel;
          const show = () => setActive({ label: row.label, series: seriesLabel, count: row[series] });
          return <button key={series} type="button" className="comparison-bar" data-zero={row[series] === 0} data-chart-active={active?.label === row.label && active.series === seriesLabel} onMouseEnter={show} onFocus={show} onClick={show} aria-describedby={detailsId} aria-label={`${row.label}, ${seriesLabel}: ${row[series]} submissions.`}><span className={`bar-mark chart-color-${index ? 2 : 0}`} style={{ height: `${row[series] / ceiling * 100}%` }}><span className="bar-tooltip" aria-hidden="true">{row[series]}</span></span></button>;
        })}</div><span className="comparison-month">{row.label}</span></div>)}
      </div>
    </div></div>
    <p id={detailsId} className="chart-details">{active ? `${active.label} · ${active.series}: ${active.count} submissions.` : 'Hover, tap or focus a bar to inspect its submission count.'}</p>
    {!rows.some(row => row.current || row.previous) && <p className="analytics-empty">No dated submissions in either period for these filters.</p>}
  </section>;
}
