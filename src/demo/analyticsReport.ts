import type { SampleRecord } from './registryData';
import { ANALYTICS_CARD_TITLES, DEMOGRAPHIC_GROUPS, REPORT_BANDS, REPORT_YEARS, REPORT_PERIODS, selectedApproved, demographicRows, demographicMonths, expandedPlanningInsights, educationAgeRows, educationAgeInsights, analyticsSummary, reportWindow, seriesLabel, type DemographicKey, type OverviewRow, type MonthlyRow, type ReportSelection } from './analyticsOverview';

export const EXPORT_MODULES = [
  { id: 'demographics', label: ANALYTICS_CARD_TITLES.demographics, groups: ['age', 'gender', 'civil'] },
  { id: 'osy', label: DEMOGRAPHIC_GROUPS.osy.title, groups: ['osy'] },
  { id: 'civic', label: DEMOGRAPHIC_GROUPS.civic.title, groups: ['civic'] },
  { id: 'educationWork', label: ANALYTICS_CARD_TITLES.workEducation, groups: ['work', 'education'] },
  { id: 'programs', label: DEMOGRAPHIC_GROUPS.programs.title, groups: ['programs'] },
  { id: 'cross', label: ANALYTICS_CARD_TITLES.cross, groups: [] },
] as const;
export type ExportModule = typeof EXPORT_MODULES[number]['id'];
export type ReportSection = {
  key: string; title: string; note: string; rows: OverviewRow[]; denominator: number;
  columns: string[]; matrix: (string | number)[][];
  insights: { title: string; text: string }[];
};
export type AnalyticsReport = {
  selection: ReportSelection; period: string; through: string; generatedAt: string; count: number;
  modules: string[]; notice: string; summary: { label: string; value: number | null; rate?: boolean; context: string }[];
  sections: ReportSection[];
};
export const REPORT_NOTICE = 'Fictional presentation data - approved, dated profiles only. Aggregate counts; no individual youth information. Not official barangay statistics.';
const titles: Partial<Record<DemographicKey, string>> = { work: ANALYTICS_CARD_TITLES.work, education: ANALYTICS_CARD_TITLES.education };

export function buildAnalyticsReport(all: SampleRecord[], selection: ReportSelection, chosen: ExportModule[], referenceDate: string, generatedAt = new Date().toISOString(), saved = false): AnalyticsReport {
  if (!REPORT_YEARS.includes(selection.year) || !REPORT_PERIODS.some(row => row.value === selection.period) || !REPORT_BANDS.includes(selection.band)) throw new Error('Choose a valid report timeframe and age group.');
  const modules = EXPORT_MODULES.filter(module => chosen.includes(module.id));
  if (!modules.length) throw new Error('Select at least one data module.');
  const records = selectedApproved(all, selection, referenceDate);
  const window = reportWindow(selection, referenceDate);
  const sections: ReportSection[] = [];
  for (const module of modules) {
    for (const group of module.groups) {
      const categories = demographicRows(records, group);
      const rows = categories.map(row => ({ ...row, label: seriesLabel(group, row.label) }));
      const ranked = group !== 'age' && group !== 'gender' && group !== 'civic';
      const overview = group === 'work' || group === 'education' ? rows.filter(row => row.count > 0) : rows;
      const months: MonthlyRow[] = demographicMonths(records, group, selection, referenceDate);
      sections.push({ key: group, title: titles[group] || DEMOGRAPHIC_GROUPS[group].title, denominator: records.length, rows: ranked ? [...overview].sort((a, b) => b.count - a.count) : overview,
        note: `${DEMOGRAPHIC_GROUPS[group].detail} Shares use all ${records.length} selected approved profiles. Monthly counts use ${saved ? 'reporting dates' : 'first submission dates'}. A dash marks a future month.`,
        columns: ['Category', ...months.map(row => row.label), 'Period total'],
        matrix: rows.map((row, index) => [row.label, ...months.map(month => month.observed ? month.counts[index] : '—'), row.count]),
        insights: expandedPlanningInsights(records, group, selection, referenceDate),
      });
    }
    if (module.id === 'cross') {
      const cross = educationAgeRows(records).filter(row => row.count > 0);
      sections.push({ key: 'cross', title: ANALYTICS_CARD_TITLES.cross, denominator: records.length, rows: [...cross].sort((a, b) => b.count - a.count),
        note: 'Counts compare age groups within each education level, not months. Row shares use all profiles at that education level. Missing age groups are shown separately and included in the row total.',
        columns: ['Education', ...REPORT_BANDS.slice(1), 'Age group not provided', 'Education total'],
        matrix: cross.map(row => [row.label, ...row.counts, row.count - row.counts.reduce((sum, count) => sum + count, 0), row.count]),
        insights: educationAgeInsights(records),
      });
    }
  }
  // Summary measures follow module choices, so an OSY-only report does not export unrelated work answers.
  const summary = analyticsSummary(records, window, saved).filter(metric => metric.key === 'approved' || metric.key === 'new' || modules.some(module => module.id === metric.key));
  const through = window.through < window.start ? 'This period has not started' : window.partial ? `Data through ${window.through}` : '';
  const notice = saved ? 'Aggregate data from saved approved profiles. No individual youth information.' : REPORT_NOTICE;
  return { selection: { ...selection }, period: window.label, through, generatedAt, count: records.length, modules: modules.map(module => module.label), notice, summary, sections };
}

export function analyticsReportFilename(report: AnalyticsReport, format: 'pdf' | 'xlsx') {
  return `sk-digitalipapa-youth-${report.selection.year}-${report.selection.period}-${report.selection.band.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${format}`;
}
