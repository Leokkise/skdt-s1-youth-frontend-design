import type { SampleRecord } from './registryData';
import { REPORT_BANDS, REPORT_YEARS, REPORT_PERIODS, reportWindow, submissionDate } from './analyticsOverview';

export type RosterFilters = { year: string; period: string; band: string; query: string };
export const ROSTER_COLUMNS = [
  { id: 'kk', label: 'Registration No.', width: 14 },
  { id: 'name', label: 'Youth name', width: 32 },
  { id: 'band', label: 'Age group', width: 22 },
  { id: 'education', label: 'Educational attainment', width: 36 },
  { id: 'submitted', label: 'Reporting date', width: 19 },
  { id: 'status', label: 'Review status', width: 23 },
] as const;
export type RosterColumn = typeof ROSTER_COLUMNS[number]['id'];
export type RegistryRoster = {
  title: string; description: string; generatedAt: string; count: number; filename: string;
  columns: typeof ROSTER_COLUMNS[number][]; rows: string[][];
};
export function rosterPeriodLabel(filters: RosterFilters) {
  return filters.year === 'all' ? 'All dates' : `${filters.year} | ${REPORT_PERIODS.find(period => period.value === filters.period)?.label || ''}`;
}
export function approvedRosterRecords(records: SampleRecord[], filters: RosterFilters, referenceDate: string) {
  if ((filters.year !== 'all' && !REPORT_YEARS.includes(filters.year)) || !REPORT_PERIODS.some(period => period.value === filters.period) || !REPORT_BANDS.includes(filters.band)) throw new Error('Choose valid roster filters.');
  const window = filters.year === 'all' ? null : reportWindow(filters, referenceDate);
  const query = filters.query.trim().toLocaleLowerCase();
  return records.filter(record => {
    if (record.status !== 'Approved (demo)' || (filters.band !== 'All age groups' && record.band !== filters.band)) return false;
    if (query && !`${record.name} ${record.kkNumber || ''}`.toLocaleLowerCase().includes(query)) return false;
    const submitted = submissionDate(record);
    return !window || (submitted !== null && submitted >= window.start && submitted <= window.through);
  });
}
export function buildRegistryRoster(records: SampleRecord[], filters: RosterFilters, selectedKeys: string[] | null, chosenColumns: RosterColumn[], referenceDate: string, generatedAt = new Date().toISOString()): RegistryRoster {
  const columns = ROSTER_COLUMNS.filter(column => chosenColumns.includes(column.id));
  if (!columns.length) throw new Error('Select at least one column.');
  const matching = approvedRosterRecords(records, filters, referenceDate);
  const included = selectedKeys === null ? matching : matching.filter(record => selectedKeys.includes(record.key));
  if (!included.length) throw new Error('No approved youth match this export.');
  const rows = included.map(record => {
    const values: Record<RosterColumn, string> = { kk: record.kkNumber || 'Unassigned', name: record.name, band: record.band || 'Not provided', education: record.education || 'Not provided', submitted: submissionDate(record) || 'Not recorded', status: record.status };
    return columns.map(column => values[column.id]);
  });
  return { title: 'Approved youth roster', count: included.length, columns, rows, generatedAt,
    description: `${rosterPeriodLabel(filters)} | ${filters.band} | Date basis: reporting date; imported examples use illustrative dates, not server activity times. ${selectedKeys === null ? 'All matching' : 'Selected matching'} approved registry records${filters.query.trim() ? ' | Search filter applied' : ''}.`,
    filename: `sk-digitalipapa-approved-youth-${filters.year === 'all' ? 'all-dates' : filters.year + '-' + filters.period}-${filters.band.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  };
}
