import { fixtureAnswers, type SampleRecord } from './registryData';
import { submissionDate } from './analyticsOverview';

export type CountRow = { label: string; count: number; percent: number };
export function distribution(values: string[]): CountRow[] {
  const counts = new Map<string, number>();
  values.forEach(value => { const label = value.trim() || 'Not provided'; counts.set(label, (counts.get(label) || 0) + 1); });
  return [...counts].map(([label, count]) => ({ label, count, percent: values.length ? count / values.length * 100 : 0 })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
export function sourceOf(record: SampleRecord) {
  if (record.source) return record.source === 'walk_in' ? 'Walk-in submission' : record.source === 'demo_import' ? 'Stored fictional example' : 'Online submission';
  if (record.key.startsWith('illustration-')) return 'Illustrative history';
  return !record.answers ? 'Starter sample' : record.history?.[0]?.action === 'Walk-in profile submitted' ? 'Walk-in submission' : 'Online submission';
}
export function currentPeriod(mode: string, referenceDate: string): string {
  return mode === 'Quarterly' ? `${referenceDate.slice(0, 4)} Q${Math.ceil(Number(referenceDate.slice(5, 7)) / 3)}` : referenceDate.slice(0, 4);
}
export function previousPeriod(mode: string, period: string): string {
  if (mode === 'Yearly' && /^\d{4}$/.test(period)) return String(Number(period) - 1);
  const match = /^(\d{4}) Q([1-4])$/.exec(period);
  if (mode === 'Quarterly' && match) return Number(match[2]) === 1 ? `${Number(match[1]) - 1} Q4` : `${match[1]} Q${Number(match[2]) - 1}`;
  return '';
}
export function comparePeriods(records: SampleRecord[], mode: string, period: string) {
  const previous = previousPeriod(mode, period);
  const currentRecords = filterPeriod(records, mode, period);
  const previousRecords = previous ? filterPeriod(records, mode, previous) : [];
  const difference = currentRecords.length - previousRecords.length;
  const change = previousRecords.length ? difference / previousRecords.length * 100 : null;
  const osyRate = (rows: SampleRecord[]) => {
    const known = rows.filter(record => ['Yes', 'No'].includes(record.answers?.isOsy || ''));
    return known.length ? known.filter(record => record.answers?.isOsy === 'Yes').length / known.length * 100 : null;
  };
  return { current: period, previous, currentCount: currentRecords.length, previousCount: previousRecords.length, difference, change, currentOsyRate: osyRate(currentRecords), previousOsyRate: osyRate(previousRecords) };
}
export function comparisonInsights(records: SampleRecord[], mode: string, period: string): string[] {
  if (mode === 'All time' || !previousPeriod(mode, period)) return ['Choose a specific quarter or year to compare it with the immediately preceding period.'];
  const result = comparePeriods(records, mode, period);
  const change = result.change === null ? 'Percentage change is unavailable because the previous period has no submissions.' : `${Math.abs(result.change).toFixed(1)}% ${result.difference === 0 ? 'change' : result.difference > 0 ? 'increase' : 'decrease'} in submission count.`;
  const text = [`${periodLabel(period)}: ${result.currentCount} submissions, compared with ${result.previousCount} in ${periodLabel(result.previous)}. ${Math.abs(result.difference)} ${result.difference < 0 ? 'fewer' : result.difference > 0 ? 'more' : 'difference in'} submissions. ${change}`];
  if (result.currentOsyRate !== null && result.previousOsyRate !== null) {
    const delta = result.currentOsyRate - result.previousOsyRate;
    text.push(`Among known Yes/No OSY answers, the OSY share is ${result.currentOsyRate.toFixed(1)}%, compared with ${result.previousOsyRate.toFixed(1)}% previously (${Math.abs(delta).toFixed(1)} percentage points ${delta < 0 ? 'lower' : delta > 0 ? 'higher' : 'difference'}). Unanswered OSY values are excluded from this rate.`);
  } else text.push('An OSY rate comparison needs known Yes/No answers in both periods. Missing answers are not treated as No.');
  return text;
}
export function monthlyComparison(records: SampleRecord[], year: number) {
  const current = Array<number>(12).fill(0);
  const previous = Array<number>(12).fill(0);
  for (const record of records) {
    const date = submissionDate(record);
    if (!date) continue;
    const recordYear = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7)) - 1;
    if (recordYear === year) current[month]++;
    else if (recordYear === year - 1) previous[month]++;
  }
  const formatter = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, index) => {
    return { label: formatter.format(new Date(Date.UTC(year, index, 1))), current: current[index], previous: previous[index] };
  });
}
export function filterRecords(records: SampleRecord[], band: string, status: string) {
  return records.filter(record => (band === 'All age groups' || record.band === band) && (status === 'All statuses' || record.status === status));
}
export function submissionPeriod(record: SampleRecord, mode: string): string | null {
  const date = submissionDate(record);
  if (!date) return null;
  return mode === 'Quarterly' ? `${date.slice(0, 4)} Q${Math.ceil(Number(date.slice(5, 7)) / 3)}` : date.slice(0, 4);
}
export function periodLabel(value: string): string {
  const quarter = /^(\d{4}) Q([1-4])$/.exec(value);
  const ranges = ['January–March', 'April–June', 'July–September', 'October–December'];
  return quarter ? `${quarter[1]} · Q${quarter[2]} (${ranges[Number(quarter[2]) - 1]})` : value;
}
export function periodOptions(records: SampleRecord[], mode: string, referenceDate: string): string[] {
  const years = [...new Set([referenceDate.slice(0, 4), ...records.map(record => submissionPeriod(record, 'Yearly')).filter((value): value is string => Boolean(value))])].sort().reverse();
  return mode === 'Quarterly' ? years.flatMap(year => [1, 2, 3, 4].map(quarter => `${year} Q${quarter}`)) : years;
}
export function filterPeriod(records: SampleRecord[], mode: string, period: string) {
  if (mode === 'All time') return records;
  return records.filter(record => { const value = submissionPeriod(record, mode); return value && (period === 'All periods' || value === period); });
}
export function narrativeInsights(records: SampleRecord[], referenceDate: string): string[] {
  if (!records.length) return ['No profiles match these filters. Adjust the age, status or submission period to see an interpretation.'];
  const insights = staffInsights(records, referenceDate);
  const largest = (rows: CountRow[]) => rows.filter(row => row.count === rows[0]?.count).map(row => row.label).join(', ');
  const osy = insights.osy.find(row => row.label === 'Yes')?.count || 0;
  return [
    `${records.length} fictional ${records.length === 1 ? 'profile is' : 'profiles are'} included. The largest age group${distribution(records.map(record => record.band)).filter(row => row.count === distribution(records.map(record => record.band))[0].count).length > 1 ? 's are' : ' is'} ${largest(distribution(records.map(record => record.band)))}.`,
    `${largest(insights.education)} has the highest reported education count (${insights.education[0].count} of ${records.length}; ties are shown together).`,
    `${osy} of ${records.length} profiles (${(osy / records.length * 100).toFixed(1)}%) self-report OSY. Missing answers are reported separately; unemployment does not establish OSY status.`,
    'These summaries describe the selected fictional submissions. They do not measure population coverage, establish causes, verify eligibility or recommend funding.',
  ];
}
export function staffInsights(records: SampleRecord[], referenceDate: string) {
  const answers = records.map(record => record.answers || (record.source ? {} : fixtureAnswers(record.key, referenceDate)));
  return {
    status: distribution(records.map(record => record.status)),
    education: distribution(records.map(record => record.education)),
    source: distribution(records.map(sourceOf)),
    work: distribution(answers.map(answer => answer.workStatus || '')),
    gender: distribution(answers.map(answer => answer.gender || '')),
    osy: distribution(answers.map(answer => answer.isOsy || '')),
    osyYears: distribution(answers.filter(answer => answer.isOsy === 'Yes').map(answer => answer.osyFrom && answer.osyTo ? `${answer.osyFrom}–${answer.osyTo}` : 'Not provided')),
    skVoter: distribution(answers.map(answer => answer.skVoter || '')),
    nationalVoter: distribution(answers.map(answer => answer.nationalVoter || '')),
    suggestions: answers.filter(answer => answer.suggestions?.trim()).length,
    organizations: answers.filter(answer => answer.organization?.trim()).length,
    assembly: distribution(answers.map(answer => answer.kkAttendance || '')),
    activity: records.flatMap(record => (record.history || []).map(entry => ({ ...entry, key: record.key, name: record.name }))).sort((a, b) => b.at.localeCompare(a.at)),
  };
}
export function aggregateCsv(groups: { title: string; rows: CountRow[] }[], denominator: number) {
  const quote = (value: string | number) => {
    const safe = typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? "'" + value : String(value);
    return '"' + safe.replaceAll('"', '""') + '"';
  };
  const rows = [['Data scope', 'Report', 'Category', 'Count', 'Percentage', 'Filtered profiles'], ...groups.flatMap(group => group.rows.map(row => ['FICTIONAL DEMO ONLY', group.title, row.label, row.count, row.percent.toFixed(1), denominator]))];
  return '\ufeff' + rows.map(row => row.map(quote).join(',')).join('\r\n');
}
