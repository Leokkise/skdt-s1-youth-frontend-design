import type { SampleRecord } from './registryData';
import { sections } from '../profiling/fields';
import { profilingDate } from '../profiling/validation';

export const REPORT_YEARS = ['2026', '2025', '2024'];
export const REPORT_PERIODS = [
  { value: 'full', label: 'Full Year (Jan – Dec)', months: [1, 12] },
  { value: 'Q1', label: 'Q1 (Jan – Mar)', months: [1, 3] },
  { value: 'Q2', label: 'Q2 (Apr – Jun)', months: [4, 6] },
  { value: 'Q3', label: 'Q3 (Jul – Sep)', months: [7, 9] },
  { value: 'Q4', label: 'Q4 (Oct – Dec)', months: [10, 12] },
];
export const REPORT_BANDS = ['All age groups', 'Child Youth', 'Core Youth', 'Young Adult'];
export type ReportSelection = { year: string; period: string; band: string };
export const PROGRAM_LABELS = ['Skills/Livelihood', 'Sports', 'Education support', 'Health', 'Environment', 'Arts', 'Governance', 'Unclassified suggestion'];
export const DEMOGRAPHIC_GROUPS = {
  programs: { title: 'Requested programs', labels: PROGRAM_LABELS, detail: 'One suggestion can match more than one theme. Percentages can add up to more than 100%.' },
  work: { title: 'Work status by month', labels: sections.flatMap(section => section.fields).find(field => field.id === 'workStatus')?.options || [], detail: 'Work status recorded at profiling.' },
  education: { title: 'Educational attainment by month', labels: sections.flatMap(section => section.fields).find(field => field.id === 'education')?.options || [], detail: 'Education recorded at profiling.' },
  osy: { title: 'Out of School Youth', labels: ['Not OSY', 'OSY', 'Not provided'], detail: 'Self-reported school status.' },
  civic: { title: 'Civic participation', labels: ['Registered SK voter', 'Registered national voter', 'Voted in SK election (2023)', 'Attended KK assembly'], detail: 'One profile can count toward more than one activity. Percentages can add up to more than 100%.' },
  age: { title: 'Youth age groups', labels: ['Child Youth', 'Core Youth', 'Young Adult'], detail: 'Age groups recorded at profiling.' },
  gender: { title: 'Gender', labels: ['Male', 'Female', 'LGBTQIA+'], detail: 'Self-reported gender.' },
  civil: { title: 'Civil status', labels: ['Single', 'Married', 'Live-in', 'Annulled', 'Separated', 'Widowed'], detail: 'Self-reported civil status.' },
};
export type DemographicKey = keyof typeof DEMOGRAPHIC_GROUPS;
export const ANALYTICS_CARD_TITLES = {
  demographics: 'Core demographics & status',
  workEducation: 'Work & education',
  work: 'Work status',
  education: 'Educational attainment',
  cross: 'Educational attainment × youth age group',
};
const ageLabels: Record<string, string> = { 'Child Youth': 'Child Youth (15–17)', 'Core Youth': 'Core Youth (18–24)', 'Young Adult': 'Young Adult (25–30)' };
export const seriesLabel = (group: DemographicKey, label: string) => group === 'age' ? ageLabels[label] || label : label;
export type OverviewRow = { label: string; count: number; percent: number };
export type MonthlyRow = { month: number; label: string; observed: boolean; counts: number[]; total?: number };
export function monthlyBarSeries(rows: MonthlyRow[], labels: string[], selectedCategory: number | null = null) {
  const totals = labels.map((_, index) => rows.reduce((sum, row) => sum + (row.observed ? row.counts[index] || 0 : 0), 0));
  const values = rows.map(row => row.observed ? labels.map((_, index) => row.counts[index] || 0) : null);
  const max = Math.max(0, ...values.flatMap(counts => {
    if (!counts) return [];
    return selectedCategory === null ? counts : [counts[selectedCategory] ?? 0];
  }));
  const targetStep = Math.max(1, max / 5);
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const tickStep = [1, 2, 5, 10].map(step => step * magnitude).find(step => step >= targetStep) ?? 10 * magnitude;
  return { totals, values, tickStep, ceiling: Math.max(tickStep, Math.ceil(max / tickStep) * tickStep) };
}
const monthName = (month: number) => new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, month - 1, 1)));

export function analyticsSummary(records: SampleRecord[], window: ReturnType<typeof reportWindow>, saved: boolean) {
  const latest = (window.through >= window.start ? window.through : window.start).slice(0, 7);
  const metrics = overviewMetrics(records);
  return [
    { key: 'approved', label: 'Approved youth profiles', value: records.length, rate: false, context: saved ? 'Reporting dates in this period' : 'First submitted in this period' },
    { key: 'osy', label: 'Out of school rate', value: metrics.osy.value === null ? null : metrics.osy.value / 100, rate: true, context: `${metrics.osy.count} of ${metrics.osy.known} known OSY answers` },
    { key: 'educationWork', label: 'Employment share', value: metrics.employment.value === null ? null : metrics.employment.value / 100, rate: true, context: `${metrics.employment.count} of ${metrics.employment.known} known work answers` },
    { key: 'new', label: `New profiles · ${monthName(Number(latest.slice(5)))}`, value: records.filter(record => submissionDate(record)?.startsWith(latest)).length, rate: false, context: saved ? 'Approved profiles by reporting month' : 'Approved profiles by submission month' },
  ];
}

export function analyticsMetricLabel({ value, rate }: { value: number | null; rate?: boolean }) {
  return value === null ? '—' : rate ? `${Math.round(value * 100)}%` : String(value);
}
export function submissionDate(record: SampleRecord): string | null {
  if (record.reportingDate) return record.reportingDate;
  const at = record.history?.find(entry => ['Profile submitted', 'Walk-in profile submitted'].includes(entry.action))?.at;
  return at && Number.isFinite(Date.parse(at)) ? profilingDate(new Date(at)) : null;
}
export function reportWindow(selection: ReportSelection, referenceDate: string) {
  const config = REPORT_PERIODS.find(period => period.value === selection.period) || REPORT_PERIODS[0];
  const [first, last] = config.months;
  const year = Number(selection.year);
  const start = `${selection.year}-${String(first).padStart(2, '0')}-01`;
  const end = new Date(Date.UTC(year, last, 0)).toISOString().slice(0, 10);
  const through = referenceDate < end ? referenceDate : end;
  return { first, last, start, end, through, partial: through < end, label: `${selection.year} · ${config.label}` };
}
export function selectedApproved(records: SampleRecord[], selection: ReportSelection, referenceDate: string): SampleRecord[] {
  const window = reportWindow(selection, referenceDate);
  return records.filter(record => {
    if (record.status !== 'Approved (demo)' || (selection.band !== 'All age groups' && record.band !== selection.band)) return false;
    const date = submissionDate(record);
    return date !== null && date >= window.start && date <= window.through;
  });
}
function category(record: SampleRecord, group: DemographicKey): string {
  if (group === 'education') return record.answers?.education || record.education || '';
  if (group === 'work') return record.answers?.workStatus || '';
  if (group === 'osy') return record.answers?.isOsy === 'Yes' ? 'OSY' : record.answers?.isOsy === 'No' ? 'Not OSY' : 'Not provided';
  return group === 'age' ? record.band : record.answers?.[group === 'gender' ? 'gender' : 'civilStatus'] || '';
}
export function demographicRows(records: SampleRecord[], group: DemographicKey): OverviewRow[] {
  if (group === 'programs') return PROGRAM_LABELS.map(label => { const count = records.filter(record => programCategories(record).includes(label)).length; return { label, count, percent: records.length ? count / records.length * 100 : 0 }; });
  if (group === 'civic') return civicDefinitions.map(item => { const count = records.filter(record => civicAnswer(record, item.field) === true).length; return { label: item.label, count, percent: records.length ? count / records.length * 100 : 0 }; });
  const labels: string[] = [...DEMOGRAPHIC_GROUPS[group].labels];
  const unknown = records.filter(record => category(record, group) === 'Not provided' || !labels.includes(category(record, group))).length;
  if (unknown && !labels.includes('Not provided')) labels.push('Not provided');
  return labels.map(label => {
    const count = label === 'Not provided' ? unknown : records.filter(record => category(record, group) === label).length;
    return { label, count, percent: records.length ? count / records.length * 100 : 0 };
  });
}
export function demographicMonths(records: SampleRecord[], group: DemographicKey, selection: ReportSelection, referenceDate: string): MonthlyRow[] {
  const window = reportWindow(selection, referenceDate);
  const labels = demographicRows(records, group).map(row => row.label);
  return Array.from({ length: window.last - window.first + 1 }, (_, index) => {
    const month = window.first + index;
    const datePrefix = `${selection.year}-${String(month).padStart(2, '0')}`;
    const monthly = records.filter(record => submissionDate(record)?.startsWith(datePrefix));
    return { month, label: monthName(month), total: monthly.length, observed: `${datePrefix}-01` <= window.through, counts: demographicRows(monthly, group).reduce((result, row) => { result[labels.indexOf(row.label)] = row.count; return result; }, Array<number>(labels.length).fill(0)) };
  });
}
export function demographicInsight(records: SampleRecord[], group: DemographicKey): string {
  if (!records.length) return 'No approved profiles in this selection. Try another period or age group.';
  const known = demographicRows(records, group).filter(row => row.label !== 'Not provided');
  const max = Math.max(...known.map(row => row.count));
  if (!max) return 'These answers are missing. Check profile completeness before planning from this chart.';
  const leaders = known.filter(row => row.count === max).map(row => row.label).join(' and ');
  if (group === 'age') return `${leaders} ${known.filter(row => row.count === max).length > 1 ? 'each account' : 'accounts'} for ${max} of ${records.length} profiles. Use this age mix to set activity schedules and age-appropriate sessions.`;
  if (group === 'gender' || group === 'civil') {
    const others = records.length - max;
    const missing = records.length - known.reduce((sum, row) => sum + row.count, 0);
    return `${leaders} ${known.filter(row => row.count === max).length > 1 ? 'each represent' : 'represents'} ${max} of ${records.length} profiles (${Math.round(max / records.length * 100)}%). ${others} profiles fall outside a single leading category, including ${missing} missing answers. ${group === 'gender' ? 'A program based only on the largest group could miss other participants. Check outreach and ask each group about access needs before setting activities.' : 'Civil status shows different household situations, but does not measure support needs. Ask about caregiving and availability before choosing schedules or services.'}`;
  }
  return `${leaders} ${known.filter(row => row.count === max).length > 1 ? 'each account' : 'accounts'} for ${max} of ${records.length} profiles. Ask about support needs directly; civil status alone does not identify them.`;
}
export function agePlanningInsight(records: SampleRecord[]) {
  const groups = [
    { label: 'Child Youth (15–17)', band: 'Child Youth', boundary: 17, first: 15 },
    { label: 'Core Youth (18–24)', band: 'Core Youth', boundary: 24, first: 18 },
    { label: 'Young Adults (25–30)', band: 'Young Adult', boundary: 30, first: 25 },
  ];
  const boundaries = groups.map(group => {
    const members = records.filter(record => record.band === group.band);
    const known = members.filter(record => /^\d+$/.test(record.answers?.age || '') && Number(record.answers?.age) >= group.first && Number(record.answers?.age) <= group.boundary);
    const count = known.filter(record => Number(record.answers?.age) === group.boundary).length;
    return { ...group, total: members.length, count, percent: members.length ? count / members.length * 100 : 0, missing: members.length - known.length };
  }).filter(group => group.total > 0);
  const total = records.length;
  const max = Math.max(0, ...boundaries.map(group => group.total));
  const leaders = boundaries.filter(group => group.total === max);
  const missing = boundaries.reduce((sum, group) => sum + group.missing, 0);
  const nearBoundary = boundaries.reduce((sum, group) => sum + group.count, 0);
  const finding = !total ? 'No approved profiles in this selection.' : !leaders.length ? 'Age groups are missing. Check them before planning age-based activities.' : `${leaders.map(group => group.label).join(' and ')} ${leaders.length > 1 ? 'tie for the largest group' : 'is the largest group'}: ${max} of ${total} (${Math.round(max / total * 100)}%)${leaders.length > 1 ? ' each' : ''}.`;
  return {
    finding, boundaries, missing,
    meaning: nearBoundary ? 'These ages are close to a group change. Youth aged 17 or 24 move to the next group after their next birthday; those aged 30 move beyond the profiled 15–30 range.' : missing ? 'Some ages are missing or inconsistent, so the next group changes cannot be fully assessed.' : 'No recorded ages are at a group’s upper limit. Keep age-based activities open to the whole selected group.',
    action: nearBoundary ? 'Check current birthdays, plan voter education for those approaching 18, and update activity groups or mentoring roles for older youth.' : missing ? 'Complete the missing ages before choosing age-specific activities.' : 'Match activities to the current age mix and recheck ages before the next profiling cycle.',
  };
}
export function monthlyInsight(records: SampleRecord[], group: DemographicKey, selection: ReportSelection, referenceDate: string): string {
  if (!records.length) return 'No monthly pattern to interpret for this selection.';
  const totals = demographicRows(records, group);
  const max = Math.max(...totals.map(row => row.count));
  const leaders = totals.map((row, index) => ({ ...row, index })).filter(row => row.count === max && row.label !== 'Not provided');
  if (!leaders.length) return 'Missing answers prevent a category comparison.';
  const series = demographicMonths(records, group, selection, referenceDate).filter(row => row.observed);
  const leader = leaders[0];
  const peak = Math.max(...series.map(row => row.counts[leader.index]));
  const peaks = series.filter(row => row.counts[leader.index] === peak).map(row => row.label);
  if (leaders.length > 1) return `${leaders.map(row => row.label).join(' and ')} tie at ${max} profiles each. Monthly counts reflect submissions, not changes in population.`;
  return `${leader.label} leads with ${max} profiles. Its highest monthly count is ${peak}${peaks.length <= 3 ? ` in ${peaks.join(', ')}` : ` across ${peaks.length} months`}. Use busier months to plan review capacity; they do not prove higher community need.`;
}
const rate = (records: SampleRecord[], field: string, accepted: string[], yes: string[]) => {
  const known = records.filter(record => accepted.includes(record.answers?.[field] || ''));
  const count = known.filter(record => yes.includes(record.answers?.[field] || '')).length;
  return { count, known: known.length, value: known.length ? count / known.length * 100 : null };
};
export function overviewMetrics(records: SampleRecord[]) {
  return {
    osy: rate(records, 'isOsy', ['Yes', 'No'], ['Yes']),
    employment: rate(records, 'workStatus', ['Student', 'Working Student', 'Self-Employed', 'Employed', 'Unemployed', 'Business Owner', 'Currently looking for a Job', 'Not Interested in looking for a Job'], ['Working Student', 'Self-Employed', 'Employed', 'Business Owner']),
    voter: rate(records, 'nationalVoter', ['Yes', 'No'], ['Yes']),
    assembly: rate(records, 'kkAttendance', ['No', 'Yes', '2 to 3 times', 'More than 4 times'], ['Yes', '2 to 3 times', 'More than 4 times']),
  };
}
export function strategicInsights(records: SampleRecord[]): { title: string; text: string }[] {
  if (!records.length) return [{ title: 'No findings yet', text: 'Choose another period or age group. No planning conclusion can be drawn from an empty selection.' }];
  const { osy } = overviewMetrics(records);
  const civicRecords = records.filter(record => ['Yes', 'No'].includes(record.answers?.nationalVoter || '') && ['No', 'Yes', '2 to 3 times', 'More than 4 times'].includes(record.answers?.kkAttendance || ''));
  const { voter, assembly } = overviewMetrics(civicRecords);
  const osyText = osy.value === null ? 'OSY answers are missing. Complete them before estimating education-support needs.' : osy.count ? `${osy.count} of ${osy.known} known answers report OSY (${Math.round(osy.value)}%). Ask these youth about barriers to returning to school before choosing education or skills support.` : `No OSY is reported among ${osy.known} known answers. Keep outreach open; missing or unsubmitted profiles can hide unmet needs.`;
  const civicText = voter.value !== null && assembly.value !== null ? `Among ${civicRecords.length} profiles with both answers, voter registration is ${Math.round(voter.value)}% and KK assembly participation is ${Math.round(assembly.value)}%. ${voter.value > assembly.value ? 'Registration is stronger than assembly involvement. Ask about meeting times and access before scheduling the next assembly.' : 'Build on reported assembly involvement. Check how youth prefer to hear about upcoming meetings.'}` : 'Civic answers are incomplete. Check voter and assembly responses before choosing a participation strategy.';
  const boundary = records.filter(record => ['17', '24', '30'].includes(record.answers?.age || '')).length;
  return [{ title: 'Education support', text: osyText }, { title: 'Civic participation', text: civicText }, { title: 'Age planning', text: boundary ? `${boundary} profiles were aged 17, 24 or 30 at profiling—near an age-group boundary. Recheck ages before the next cycle so program audiences stay appropriate.` : demographicInsight(records, 'age') }];
}

export const civicDefinitions = [
  { label: 'Registered SK voter', field: 'skVoter' },
  { label: 'Registered national voter', field: 'nationalVoter' },
  { label: 'Voted in SK election (2023)', field: 'election2023' },
  { label: 'Attended KK assembly', field: 'kkAttendance' },
];
export function civicAnswer(record: SampleRecord, field: string): boolean | null {
  const answer = (record.answers?.[field] || '').trim();
  if (field === 'kkAttendance' && ['Yes', '2 to 3 times', 'More than 4 times'].includes(answer)) return true;
  if (/^yes(?:$|[,.!\s])/i.test(answer)) return true;
  if (/^no(?:$|[,.!\s])/i.test(answer)) return false;
  return null;
}
export function communityInsights(records: SampleRecord[], group: 'osy' | 'civic') {
  if (!records.length) return [{ title: 'No findings yet', text: 'Choose another period or age group before planning.' }];
  if (group === 'osy') {
    const known = records.filter(r => ['Yes', 'No'].includes(r.answers?.isOsy || ''));
    const osy = known.filter(r => r.answers?.isOsy === 'Yes');
    const age = demographicRows(osy, 'age').filter(r => r.label !== 'Not provided').sort((a,b) => b.count-a.count);
    const top = age[0];
    const unknown = records.length-known.length;
    return [{ title: 'Education outreach', text: known.length ? osy.length ? `${osy.length} of ${known.length} known answers (${Math.round(osy.length/known.length*100)}%) report being out of school. ${top?.count ? `${top.label} account for ${top.count} of these ${osy.length} profiles.` : ''} Start outreach with this group, ask why they left school, and discuss ALS or skills training based on their goals.` : 'No known answers report OSY. Continue outreach before concluding that education support is unnecessary.' : 'School-status answers are missing; complete them before estimating OSY needs.' }, { title: 'Check before targeting', text: `${unknown} of ${records.length} profiles have no usable OSY answer. “Not OSY” does not necessarily mean currently in school. Confirm current education and interest before referrals.` }];
  }
  const paired = records.filter(r => civicAnswer(r,'skVoter') !== null && civicAnswer(r,'kkAttendance') !== null);
  const registered = paired.filter(r => civicAnswer(r,'skVoter'));
  const attended = registered.filter(r => civicAnswer(r,'kkAttendance'));
  const missingElection = records.filter(r => civicAnswer(r,'election2023') === null).length;
  return [{ title: 'Registration to participation', text: registered.length ? `Among ${registered.length} registered SK voters with both answers, ${attended.length} (${Math.round(attended.length/registered.length*100)}%) report attending a KK assembly; ${registered.length-attended.length} do not. ${registered.length > attended.length ? 'Registration has not translated into assembly attendance for everyone. Ask non-attendees about timing and access, then trial a suitable meeting format.' : 'Build on this participation by asking attendees to help publicize the next assembly.'}` : 'There are no registered SK voters with both answers to assess participation. Complete the paired responses before drawing a conclusion.' }, { title: 'Check election responses', text: `${missingElection} election responses cannot be classified as Yes or No; review those answers before interpreting turnout. Submission month is not the date an election or assembly happened.` }];
}

export function programCategories(record: SampleRecord): string[] {
  if (record.programCategories) return record.programCategories.filter(label => PROGRAM_LABELS.includes(label));
  const text = (record.answers?.suggestions || '').trim().toLowerCase();
  if (!text) return [];
  const patterns = [/skill|livelihood|training|negosyo|kabuhayan|trabaho/, /sport|basketball|volleyball|liga/, /educat|school|scholar|tutor|paaralan/, /health|mental|medical|kalusugan/, /environment|clean|tree|recycl|kalikasan/, /art|music|dance|sining/, /govern|leadership|civic|assembly/];
  const matched = patterns.flatMap((pattern, index) => pattern.test(text) ? [PROGRAM_LABELS[index]] : []);
  return matched.length ? matched : ['Unclassified suggestion'];
}
export function planningAnalysis(records: SampleRecord[], group: 'programs' | 'work' | 'education') {
  if (!records.length) return 'No approved profiles in this selection. Choose another period before planning.';
  const rows = demographicRows(records, group).filter(row => row.label !== 'Not provided' && row.label !== 'Unclassified suggestion');
  const max = Math.max(0, ...rows.map(row => row.count));
  if (!max) return group === 'programs' ? 'No suggestions match the displayed themes. Read the original suggestions before setting priorities; an empty theme does not mean no demand.' : 'No usable answers are available. Complete the missing information before planning support.';
  const leaders = rows.filter(row => row.count === max).map(row => row.label).join(' and ');
  const finding = leaders + ' lead with ' + max + ' of ' + records.length + ' profiles (' + Math.round(max / records.length * 100) + '%) each. ';
  if (group === 'programs') {
    const respondents = records.filter(record => record.programCategories ? record.programCategories.length > 0 : !!record.answers?.suggestions?.trim()).length;
    const unclassified = records.filter(record => programCategories(record).includes('Unclassified suggestion')).length;
    return finding + respondents + ' profiles supplied suggestions; ' + (records.length - respondents) + ' supplied none; ' + unclassified + ' need manual theme review. Use these requests to shortlist activities, then confirm interest and costs. Keyword coding can miss context. No budget data is available to assess funding gaps.';
  }
  if (group === 'work') {
    const unemployed = records.filter(record => record.answers?.workStatus === 'Unemployed' || record.answers?.workStatus === 'Currently looking for a Job').length;
    return finding + unemployed + ' profiles report unemployment or job seeking. Ask these youth about skills and job-search barriers before choosing referrals or training. Monthly groups are different submitters, so this does not demonstrate individuals moving from school to work.';
  }
  return finding + 'Use the education mix to plan sessions at suitable entry levels. Ask about current enrolment and goals before offering ALS or scholarships; attainment alone does not identify dropouts or financial need.';
}
export function educationAgeRows(records: SampleRecord[]) {
  return demographicRows(records, 'education').map(row => ({ ...row, counts: REPORT_BANDS.slice(1).map(band => records.filter(record => (row.label === 'Not provided' ? !DEMOGRAPHIC_GROUPS.education.labels.includes(category(record, 'education')) : category(record, 'education') === row.label) && record.band === band).length) }));
}

export function monthlyPlotGeometry(count: number, width: number) {
  const left = 72;
  const right = width - 32;
  const slot = (right - left) / Math.max(1, count);
  return {
    left, right,
    x: (index: number) => left + (index + .5) * slot,
    band: (index: number) => ({ left: left + index * slot, right: left + (index + 1) * slot }),
    groupWidth: (categories: number) => Math.max(1, Math.min(Math.max(58, categories * 10), slot - 20)),
  };
}

export function expandedPlanningInsights(records: SampleRecord[], group: DemographicKey, selection: ReportSelection, referenceDate: string) {
  if (!records.length) return [{ title: 'No insights yet', text: 'No approved profiles match this selection.' }];
  const insights: {title:string; text:string}[] = [];
  const all = demographicRows(records, group);
  const ranked = all.filter(row => !['Not provided','Unclassified suggestion'].includes(row.label) && row.count > 0).sort((a,b)=>b.count-a.count);
  const top = ranked[0], next = ranked[1];
  if (top) {
    const leaders = ranked.filter(row=>row.count===top.count);
    insights.push(leaders.length > 1 ? {title:'No single leading category', text: leaders.map(row=>seriesLabel(group,row.label)).join(', ') + ' are tied at ' + top.count + ' profiles each.'} : next ? {title:'Largest category gap', text:seriesLabel(group,top.label)+' exceeds '+seriesLabel(group,next.label)+' by '+(top.count-next.count)+' profiles.'} : {title:'One recorded category',text:seriesLabel(group,top.label)+' is the only category represented in the recorded answers.'});
  }
  if (top) {
    const implications: Record<DemographicKey,string> = {
      age: 'Plan for the largest age group while retaining options for smaller groups.',
      gender: 'Compare this mix with activity attendance to identify outreach gaps.',
      civil: 'Confirm availability before choosing session schedules.',
      osy: 'Compare OSY rates among known answers before deciding which age group needs follow-up.',
      civic: 'Check registration and attendance together; activities can overlap.',
      programs: 'Read the suggestions behind these themes before shortlisting activities.',
      work: 'Confirm support needs separately with job seekers and employed youth.',
      education: 'Match session levels to attainment, then confirm current enrolment.'
    };
    const first=insights[0];
    if(first)first.text+=' '+implications[group];
    if(next && top.count!==next.count && top.percent-next.percent<5)first.text+=' The lead is small; consider both groups.';
  }
  if(group==='osy') {
    const known=records.filter(r=>['Yes','No'].includes(r.answers?.isOsy||''));
    const osy=known.filter(r=>r.answers?.isOsy==='Yes').length;
    if(known.length)insights.unshift({title:osy*2>known.length?'OSY is the larger known group':'OSY follow-up audience',text:osy+' of '+known.length+' known school-status answers ('+(osy/known.length*100).toFixed(1)+'%) report OSY, compared with '+(known.length-osy)+' not OSY. Ask about barriers and learning goals; “Not OSY” does not confirm enrolment.'});
  }
  if(group==='work') {
    const seeking=records.filter(r=>r.answers?.workStatus==='Currently looking for a Job');
    const known=seeking.filter(r=>['Yes','No'].includes(r.answers?.isOsy||''));
    const osy=known.filter(r=>r.answers?.isOsy==='Yes').length;
    if(known.length)insights.unshift({title:'Where work and learning support overlap',text:osy+' of '+known.length+' job-seeking profiles with known school status also report OSY ('+(osy/known.length*100).toFixed(1)+'%). '+(seeking.length-known.length)+' job seekers have no usable school-status answer. Coordinate learning and employment follow-up for these job seekers.'});
  }
  if(group==='education') {
    const osy=records.filter(r=>r.answers?.isOsy==='Yes');
    const levels=demographicRows(osy,'education').filter(row=>row.label!=='Not provided'&&row.count>0).sort((a,b)=>b.count-a.count);
    const leading=levels[0];
    if(leading)insights.unshift({title:'Education support among OSY profiles',text:levels.filter(row=>row.count===leading.count).map(row=>row.label).join(' / ')+' account for '+leading.count+' of '+osy.length+' profiles reporting OSY ('+(leading.count/osy.length*100).toFixed(1)+'%) each. Ask about learning support; confirm eligibility separately.'});
  }
  if (group==='civic') {
    const paired=records.filter(r=>civicAnswer(r,'skVoter')!==null&&civicAnswer(r,'kkAttendance')!==null);
    const voters=paired.filter(r=>civicAnswer(r,'skVoter'));
    const attendance=voters.filter(r=>civicAnswer(r,'kkAttendance')).length;
    if(voters.length) insights.push({title:'Registration versus attendance',text:(voters.length-attendance)+' of '+voters.length+' registered SK voters with both answers report no KK assembly attendance; '+attendance+' report attendance. Ask about access or scheduling before interpreting this gap.'});
  }
  if(group==='osy' && selection.band==='All age groups') {
    const rates=REPORT_BANDS.slice(1).map(band=>{const rows=records.filter(r=>r.band===band&&['Yes','No'].includes(r.answers?.isOsy||''));const count=rows.filter(r=>r.answers?.isOsy==='Yes').length;return {band,count,total:rows.length,rate:rows.length?count/rows.length:0};}).filter(r=>r.total>0).sort((a,b)=>b.rate-a.rate);
    if(rates.length>1 && rates[0].rate>rates.at(-1)!.rate) insights.push({title:'OSY rates across age groups',text:rates[0].band+' has '+rates[0].count+' of '+rates[0].total+' known answers reporting OSY ('+(rates[0].rate*100).toFixed(1)+'%), versus '+rates.at(-1)!.count+' of '+rates.at(-1)!.total+' ('+(rates.at(-1)!.rate*100).toFixed(1)+'%) in '+rates.at(-1)!.band+'. Rates account for different group sizes.'});
  }
  const months=demographicMonths(records,group,selection,referenceDate);
  const completed=months.filter(row=>row.observed && (selection.year+'-'+String(row.month).padStart(2,'0'))<referenceDate.slice(0,7));
  const active=completed.filter(row=>(row.total||0)>0).sort((a,b)=>(b.total||0)-(a.total||0));
  if(completed.length>1 && active.length) {
    const peak=active[0], ties=active.filter(row=>row.total===peak.total);
    const runner=active.find(row=>row.total!==peak.total);
    insights.push({title:'Busiest completed month',text:(ties.length===completed.length?'All completed months are tied at '+peak.total+' submissions each.':ties.length>1?ties.map(row=>row.label).join(', ')+' tied for the most submissions: '+peak.total+' each.':peak.label+' had '+peak.total+' submissions'+(runner?', '+((peak.total||0)-(runner.total||0))+' more than '+runner.label+'.':'; the other completed months had none.'))+''});
    const knownLabels=all.map((row,index)=>({row,index})).filter(x=>!['Not provided','Unclassified suggestion'].includes(x.row.label));
    const winners=completed.filter(row=>(row.total||0)>0).flatMap(row=>{const max=Math.max(...knownLabels.map(x=>row.counts[x.index]));const lead=knownLabels.filter(x=>row.counts[x.index]===max);return max>0&&lead.length===1?[{month:row.label,label:lead[0].row.label,count:max,total:row.total!}]:[];});
    const first=winners[0], changed=winners.find(row=>row.label!==first?.label);
    if(first && changed) insights.push({title:'The leading category changed',text:seriesLabel(group,first.label)+' led in '+first.month+' ('+first.count+' of '+first.total+'), while '+seriesLabel(group,changed.label)+' led in '+changed.month+' ('+changed.count+' of '+changed.total+').'});
  }
  // Compare shares within months so a busy submission month does not imply higher category prevalence.
  const shareFindings=all.flatMap((category,index)=>{
    if(['Not provided','Unclassified suggestion'].includes(category.label))return [];
    const points=completed.flatMap(month=>{
      const denominator=group==='osy' ? month.counts[0]+month.counts[1] : group==='programs'||group==='civic' ? month.total||0 : month.counts.reduce((sum,count,i)=>sum+(all[i].label==='Not provided'?0:count),0);
      return denominator>=10?[{month:month.label,count:month.counts[index],denominator,share:month.counts[index]/denominator}]:[];
    }).sort((a,b)=>b.share-a.share);
    if(points.length<2)return [];
    const high=points[0],low=points[points.length-1],gap=(high.share-low.share)*100;
    return gap>=10?[{label:category.label,high,low,gap}]:[];
  }).sort((a,b)=>b.gap-a.gap);
  const shift=shareFindings[0];
  if(shift) {
    const finding={title:'A change in the monthly mix',text:seriesLabel(group,shift.label)+' made up '+(shift.high.share*100).toFixed(1)+'% in '+shift.high.month+' ('+shift.high.count+'/'+shift.high.denominator+'), versus '+(shift.low.share*100).toFixed(1)+'% in '+shift.low.month+' ('+shift.low.count+'/'+shift.low.denominator+'). The mix differs between months; one month alone may not represent the period.'};
    const changed=insights.findIndex(item=>item.title==='The leading category changed');
    if(changed>=0)insights.splice(changed,1,finding);else insights.push(finding);
  }
  // Prefer a small set of relevant findings over repeating every possible observation.
  const preferred=insights.filter(item=>!['Largest category gap','No single leading category','One recorded category'].includes(item.title));
  if(preferred.length>=3)insights.splice(0,insights.length,...preferred.slice(0,3));
  else if(insights.length>3)insights.splice(3);
  if(group==='civic') {
    const paired=records.filter(r=>civicAnswer(r,'skVoter')!==null&&civicAnswer(r,'kkAttendance')!==null);
    const registered=paired.filter(r=>civicAnswer(r,'skVoter'));
    const other=paired.filter(r=>!civicAnswer(r,'skVoter'));
    const attended=(rows:SampleRecord[])=>rows.filter(r=>civicAnswer(r,'kkAttendance')).length;
    if(registered.length && other.length) {
      const registeredRate=attended(registered)/registered.length*100;
      const otherRate=attended(other)/other.length*100;
      const gap=Math.abs(registeredRate-otherRate);
      insights.push({title:'Attendance across voter groups',text:'KK attendance is '+registeredRate.toFixed(1)+'% among registered SK voters ('+attended(registered)+'/'+registered.length+'), versus '+otherRate.toFixed(1)+'% among non-registered profiles ('+attended(other)+'/'+other.length+'). '+(gap<1?'The rates are similar; registration alone does not distinguish attendance.':'That is a '+gap.toFixed(1)+'-point gap; check participation barriers in both groups. Registration does not establish the cause.')});
    } else if(paired.length) {
      insights.push({title:'Participation beyond registration',text:attended(paired)+' of '+paired.length+' profiles with both answers report KK attendance. '+(other.length?'No registered SK voters':'No non-registered profiles')+' have paired answers in this selection, so attendance rates cannot be compared between voter groups.'});
    }
  }
  if(group!=='civic' && top) {
    const leaders=ranked.slice(0,2);
    const labels=leaders.map(row=>row.label);
    const known=records.filter(record=>group==='programs'?programCategories(record).some(label=>label!=='Unclassified suggestion'):all.some(row=>row.label!=='Not provided'&&row.label===category(record,group)));
    const covered=known.filter(record=>group==='programs'?programCategories(record).some(label=>labels.includes(label)):labels.includes(category(record,group))).length;
    const rest=known.length-covered;
    const title:Record<Exclude<DemographicKey,'civic'>,string>={age:'Balance across age groups',gender:'Representation beyond the largest groups',civil:'How varied the civil-status mix is',osy:'School-status coverage',work:'How broad work support needs to be',education:'How concentrated education levels are',programs:'How widely the leading themes reach'};
    insights.push({title:title[group],text:group==='osy'?known.length+' of '+records.length+' profiles have a usable school-status answer. '+(known.length===records.length?'The OSY rate covers this entire selection.':'Follow up on the '+(records.length-known.length)+' missing answers before treating the OSY rate as complete.'):leaders.length===1?seriesLabel(group,top.label)+' is the only recorded category among '+known.length+' usable profiles. Confirm the range of respondents before treating this as representative.':labels.map(label=>seriesLabel(group,label)).join(' and ')+' together cover '+covered+' of '+known.length+' '+(group==='programs'?'profiles with classified suggestions':'profiles with known answers')+' ('+(covered/Math.max(1,known.length)*100).toFixed(1)+'%). '+(rest?rest+' profiles fall outside these '+(group==='programs'?'themes; retain other suggestions when shortlisting.':'groups; keep support options broad enough for them.'):'No other '+(group==='programs'?'classified themes reach additional profiles.':'categories are represented in the known answers.'))+(group==='programs'?' Each profile is counted once here, even when themes overlap.':'')});
  }
  const notes:string[]=[];
  const missing=all.find(row=>row.label==='Not provided')?.count||0;
  const unclassified=all.find(row=>row.label==='Unclassified suggestion')?.count||0;
  if(missing)notes.push(missing+' of '+records.length+' profiles have no usable category answer.');
  if(unclassified)notes.push(unclassified+' suggestions are unclassified; review their wording before comparing theme demand.');
  if(reportWindow(selection,referenceDate).partial)notes.push('Current and future months are excluded from monthly comparisons.');
  if(notes.length)insights.push({title:'Comparison limits',text:notes.join(' ')});
  return insights.length?insights:[{title:'Not enough comparable answers',text:'No usable category comparison is available for these filters.'}];
}

export function educationAgeInsights(records: SampleRecord[]) {
  if(!records.length)return [{title:'No insights yet',text:'No profiles match this selection.'}];
  const rows=educationAgeRows(records).filter(row=>row.label!=='Not provided');
  const groups=REPORT_BANDS.slice(1).flatMap((band,index)=>{const total=rows.reduce((sum,row)=>sum+row.counts[index],0);const ranked=rows.filter(row=>row.counts[index]>0).sort((a,b)=>b.counts[index]-a.counts[index]);if(!total)return [];const max=ranked[0].counts[index];const leaders=ranked.filter(row=>row.counts[index]===max);return [{band,total,text:band+': '+leaders.map(row=>row.label).join(' / ')+(leaders.length>1?' tie at ':' leads with ')+max+' of '+total+' ('+(max/total*100).toFixed(1)+'%)'+(leaders.length>1?' each':'')+'.'}];});
  if(!groups.length)return [{title:'No paired answers',text:'No profiles have both usable education and age-group answers.'}];
  const result=[{title:groups.length>1?'Education mix across age groups':'Education mix within this age group',text:groups.map(row=>row.text).join(' ')},{title:'How to compare fairly',text:'Shares use known education answers within each age group, so a larger age group does not automatically dominate. Attainment alone does not show current enrolment or support needs.'}];
  const largest=rows.filter(row=>row.count>0).sort((a,b)=>b.count-a.count)[0];
  if(largest) {
    const mix=largest.counts.map((count,index)=>({count,band:REPORT_BANDS[index+1]})).filter(item=>item.count>0).sort((a,b)=>b.count-a.count);
    if(mix.length)result.push({title:'Who makes up the largest education level',text:largest.label+' includes '+mix[0].count+' '+mix[0].band+' profiles out of '+largest.count+' at this level ('+(mix[0].count/largest.count*100).toFixed(1)+'%). '+(mix.length>1?'Other age groups are represented too; avoid assuming this education level belongs to one age group.':'Only one known age group appears at this level in this selection.')});
    const usable=groups.reduce((sum,row)=>sum+row.total,0);
    const topTwo=[...rows].sort((a,b)=>b.count-a.count).slice(0,2);
    const covered=topTwo.reduce((sum,row)=>sum+row.counts.reduce((a,b)=>a+b,0),0);
    result.push({title:'Range of learning levels',text:topTwo.map(row=>row.label).join(' and ')+' cover '+covered+' of '+usable+' profiles with paired answers ('+(covered/Math.max(1,usable)*100).toFixed(1)+'%). '+(usable>covered?'The remaining '+(usable-covered)+' profiles span other levels; consider more than one session entry level.':'Confirm learning goals before choosing a single session level.')});
  }
  const missing=records.length-groups.reduce((sum,row)=>sum+row.total,0);
  if(missing)result.push({title:'Comparison limits',text:missing+' of '+records.length+' profiles lack a usable education or age-group answer and are excluded from this paired comparison.'});
  return result;
}