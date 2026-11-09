import { useMemo, useRef, useState } from 'react';
import AnalyticsDialog from './AnalyticsDialog';
import YouthIcon from './YouthIcon';
import type { SampleRecord } from './registryData';
import { EXPORT_MODULES, buildAnalyticsReport, analyticsReportFilename, type ExportModule } from './analyticsReport';
import { REPORT_PERIODS, REPORT_YEARS, REPORT_BANDS, type ReportSelection } from './analyticsOverview';

const modules = EXPORT_MODULES;
export default function AnalyticsExport({ records, selection, referenceDate, saved, onClose }: { records: SampleRecord[]; selection: ReportSelection; referenceDate: string; saved: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [year, setYear] = useState(selection.year);
  const [period, setPeriod] = useState(selection.period);
  const [quarter, setQuarter] = useState(selection.period === 'full' ? 'Q1' : selection.period);
  const [chosen, setChosen] = useState<ExportModule[]>(modules.map(module => module.id));
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
  const [band, setBand] = useState(selection.band);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const report = useMemo(() => chosen.length ? buildAnalyticsReport(records, { year, period, band }, chosen, referenceDate, undefined, saved) : null, [records, year, period, band, chosen, referenceDate, saved]);
  async function download() {
    if (!report || busy) return;
    setBusy(true); setStatus(''); setError('');
    try {
      const { analyticsPdf, analyticsExcel } = await import('./analyticsReportFiles');
      const bytes = await (format === 'pdf' ? analyticsPdf(report) : analyticsExcel(report));
      const filename = analyticsReportFilename(report, format);
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setStatus('Download started: ' + filename);
    } catch { setError('The report could not be generated. Please try again.'); }
    finally { setBusy(false); }
  }
  const heading = useRef<HTMLHeadingElement>(null);
  function move(next: number) { setStatus(''); setError(''); setStep(next); requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'nearest' }); }); }
  return <AnalyticsDialog compact title="Export report" onClose={onClose}>
    <p className="export-preview-note">Download an aggregate report for the timeframe and modules you choose.</p>
    <ol className="export-steps" aria-label="Report steps">{['Timeframe', 'Data modules', 'Format'].map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    <h3 ref={heading} tabIndex={-1} className="export-step-title">{['Choose a timeframe', 'Choose data modules', 'Choose a format'][step]}</h3>
    {step === 0 ? <div className="export-timeframe">
      <label htmlFor="export-year">Year</label><select id="export-year" value={year} onChange={event => setYear(event.target.value)}>{REPORT_YEARS.map(value => <option key={value}>{value}</option>)}</select>
      <fieldset><legend>Period</legend><div className="export-period-choices"><label data-selected={period === 'full'}><input type="radio" name="export-period" checked={period === 'full'} onChange={() => setPeriod('full')} /><span><strong>Full Year Period</strong><small>January–December</small></span></label><label data-selected={period !== 'full'}><input type="radio" name="export-period" checked={period !== 'full'} onChange={() => setPeriod(quarter)} /><span><strong>Specific Quarter</strong><small>Choose one quarter below</small></span></label></div><label htmlFor="export-quarter" className="sr-only">Quarter</label><select id="export-quarter" disabled={period === 'full'} value={quarter} onChange={event => { setQuarter(event.target.value); setPeriod(event.target.value); }}>{REPORT_PERIODS.slice(1).map(value => <option key={value.value} value={value.value}>{value.label}</option>)}</select></fieldset>
      <label htmlFor="export-band">Age group</label><select id="export-band" value={band} onChange={event => setBand(event.target.value)}>{REPORT_BANDS.map(value => <option key={value}>{value}</option>)}</select>
    </div> : step === 1 ? <fieldset className="export-modules"><legend>Data modules</legend><label className="export-select-all" data-selected={chosen.length === modules.length}><input type="checkbox" checked={chosen.length === modules.length} ref={input => { if (input) input.indeterminate = chosen.length > 0 && chosen.length < modules.length; }} onChange={event => setChosen(event.target.checked ? modules.map(module => module.id) : [])} />Select all</label><div>{modules.map(module => <label key={module.id} data-selected={chosen.includes(module.id)}><input type="checkbox" checked={chosen.includes(module.id)} onChange={event => setChosen(previous => event.target.checked ? [...previous, module.id] : previous.filter(item => item !== module.id))} />{module.label}</label>)}</div><p className="field-hint">Includes selected-period totals, detailed counts and planning insights for the chosen modules. No individual youth records are exported.</p></fieldset> : <>
      <dl className="export-summary"><div><dt>Timeframe</dt><dd>{year} · {REPORT_PERIODS.find(value => value.value === period)?.label}</dd></div><div><dt>Age group</dt><dd>{band}</dd></div><div><dt>Data modules ({chosen.length})</dt><dd><ul className="export-chosen-modules">{modules.filter(module => chosen.includes(module.id)).map(module => <li key={module.id}><YouthIcon name="check" />{module.label}</li>)}</ul></dd></div></dl>
      <p className="field-hint">{report?.count} approved profiles match this export. {report?.through ? ' ' + report.through + '.' : ''} Files include denominator notes.</p><fieldset disabled={busy} className="export-formats"><legend>Choose a format</legend>{([['pdf', 'PDF report (.pdf)', 'Formatted totals, distribution charts, monthly tables and planning insights'], ['xlsx', 'Excel workbook (.xlsx)', 'Numeric counts, percentages, monthly breakdowns and insights by topic']] as const).map(([value, label, description]) => <label key={value} data-selected={format === value}><input type="radio" name="export-format" value={value} checked={format === value} onChange={() => { setFormat(value); setStatus(''); setError(''); }} /><span className="export-format-icon">{value === 'pdf' ? 'PDF' : 'XLSX'}</span><span><strong>{label}</strong><small>{description}</small></span></label>)}</fieldset>
    </>}
    {error && <p role="alert" className="export-error">{error}</p>}{status && <p role="status" className="export-download-status">{status}</p>}
    <footer className="export-actions">{step > 0 && <button type="button" className="secondary-button" disabled={busy} onClick={() => move(step - 1)}>Back</button>}{step < 2 ? <button type="button" className="button" disabled={step === 1 && !chosen.length} onClick={() => move(step + 1)}>Next</button> : <button type="button" className="button" disabled={busy || !report} onClick={download}>{busy ? 'Preparing report…' : format === 'pdf' ? 'Download PDF' : 'Download Excel'}</button>}</footer>
  </AnalyticsDialog>;
}
