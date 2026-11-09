import { type Answers } from '../profiling/fields';
import { formatKkNumber } from './presentationWorkflow';
import { groupForAge, syntheticAnswers } from '../profiling/validation';
import { type FixtureReview, type HistoryEntry, type PracticeResponse, type ReviewStatus } from './presentationWorkflow';
export type SampleRecord = { answerRevision?: number | null; key: string; kkNumber?: string; correctionFields?: string[]; name: string; band: string; education: string; status: ReviewStatus; note?: string; answers?: Answers; referenceDate?: string; history?: HistoryEntry[]; reportingDate?: string; reportingDateKind?: 'actual_submission' | 'synthetic_illustration'; source?: 'self_service' | 'walk_in' | 'demo_import'; programCategories?: string[]; organizationPresent?: boolean };
export const initialRecords: SampleRecord[] = [
  { key: 'fixture-alpha', name: 'Juan Miguel Dela Cruz', band: 'Core Youth', education: 'College Undergraduate', status: 'For review' },
  { key: 'fixture-bravo', name: 'Maria Clara Santos', band: 'Child Youth', education: 'High School Undergraduate', status: 'Needs changes' },
  { key: 'fixture-charlie', name: 'Carlo Reyes', band: 'Young Adult', education: 'College Graduate', status: 'Approved (demo)' },
  { key: 'fixture-delta', name: 'Angela Garcia', band: 'Core Youth', education: 'Senior High School Completer', status: 'For review' },
  { key: 'fixture-echo', name: 'Paolo Mendoza', band: 'Child Youth', education: 'High School Undergraduate', status: 'For review' },
  { key: 'fixture-foxtrot', name: 'Michelle Ramos', band: 'Young Adult', education: 'College Graduate', status: 'Approved (demo)' },
].map((record, index) => ({ ...record, status: record.status as ReviewStatus, kkNumber: formatKkNumber(index + 1) }));
/** Fixed fictional submission dates make every offered year/quarter demonstrable. */
const starterDates = ['2026-10-02', '2026-07-14', '2026-02-12', '2026-04-18', '2026-09-09', '2026-08-21'];
const datedStarters: SampleRecord[] = initialRecords.map((record, index) => ({ ...record, history: [{ action: 'Profile submitted', actor: 'Fictional starter youth', at: starterDates[index] + 'T09:00:00+08:00', note: 'Fixed synthetic submission date for the registry demonstration.' }] }));
// Invented names keep period coverage separate from the profile identity.
const periodNames: Record<string, [string, string]> = {
  '2024-q1': ['Isabel', 'Navarro'], '2024-q2': ['Gabriel', 'Torres'],
  '2024-q3': ['Sofia', 'Villanueva'], '2024-q4': ['Daniel', 'Castillo'],
  '2025-q1': ['Camille', 'Flores'], '2025-q2': ['Adrian', 'Bautista'],
  '2025-q3': ['Bianca', 'Mercado'], '2025-q4': ['Rafael', 'Domingo'],
  '2026-q2': ['Alyssa', 'Santiago'], '2026-q4': ['Miguel', 'Aquino'],
};
const periodExamples: SampleRecord[] = [2024, 2025, 2026].flatMap(year => [1, 2, 3, 4].filter(quarter => year !== 2026 || ![1, 3].includes(quarter)).map(quarter => {
  const date = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-05`;
  const [firstName, surname] = periodNames[`${year}-q${quarter}`];
  const answers = { ...syntheticAnswers('2026-10-16'), firstName, surname, age: '20', ageGroup: 'Core Youth (18 - 24 yrs old)', education: 'College Undergraduate' };
  return { key: `fixture-period-${year}-q${quarter}`, name: `${answers.firstName} ${answers.surname}`, band: 'Core Youth', education: answers.education, status: 'Approved (demo)' as ReviewStatus, answers, referenceDate: '2026-10-16', history: [{ action: 'Profile submitted', actor: 'Fictional starter youth', at: date + 'T09:00:00+08:00', note: 'Fixed synthetic submission date for year and quarter filter demonstrations.' }] };
}));
export const registryFixtures: SampleRecord[] = [...datedStarters, ...periodExamples.map((record, index) => ({ ...record, kkNumber: formatKkNumber(initialRecords.length + index + 1) }))];
export function registryRecords(responses: PracticeResponse[], reviews: Record<string, FixtureReview>): SampleRecord[] {
  return [...responses.map(response => ({ ...response, name: response.answers.firstName + ' ' + response.answers.surname, band: response.answers.ageGroup.split(' (')[0], education: response.answers.education })), ...registryFixtures.map(record => ({ ...record, ...reviews[record.key], history: reviews[record.key] ? [...(record.history || []), ...reviews[record.key].history.filter(entry => !(record.history || []).some(seed => seed.action === entry.action && seed.at === entry.at))] : record.history }))];
}
export function fixtureAnswers(key: string, referenceDate: string): Answers {
  const index = initialRecords.findIndex(record => record.key === key);
  if (index < 0) throw new Error('Unknown presentation fixture.');
  const age = [20, 16, 27, 22, 17, 29][index];
  const firstName = ['Juan Miguel', 'Maria Clara', 'Carlo', 'Angela', 'Paolo', 'Michelle'][index];
  const surname = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Ramos'][index];
  return {
    ...syntheticAnswers(referenceDate), firstName, surname, middleName: 'Santos', suffix: '',
    birthdate: (Number(referenceDate.slice(0, 4)) - age) + '-01-01', age: String(age), ageGroup: groupForAge(age),
    gender: [1, 3, 5].includes(index) ? 'Female' : 'Male', education: initialRecords[index].education,
    address: 'House ' + (index + 1) + ', Halimbawang Street (made-up), Barangay Talipapa',
    rbiNumber: 'DEMO-NOT-A-REAL-RBI-' + (index + 1), headOfFamily: surname + ', Roberto, S. (made-up)',
    siblings: JSON.stringify([{ name: 'Ana Demo (fictional)', age: '15' }]), jobDescription: '', income: '', isOsy: index === 4 ? 'Yes' : 'No', osyFrom: index === 4 ? '2022' : '', osyTo: index === 4 ? referenceDate.slice(0, 4) : '', pwdDetails: '',
    election2023: 'No, I was not registered then (made-up answer).', organization: 'Halimbawang Youth Club (made-up)',
    suggestions: 'Basketball training and skills workshops.', message: 'Sana po magkaroon ng libreng training para sa kabataan.', certification: 'true',
  };
}
