import type { SampleRecord } from './registryData';

/** Illustrative analytics only: never enters the actionable registry or session history. */
export function analyticsSamples(referenceDate: string): SampleRecord[] {
  const currentYear = Number(referenceDate.slice(0, 4));
  const currentMonth = Number(referenceDate.slice(5, 7));
  const records: SampleRecord[] = [];
  const bands = ['Child Youth', 'Core Youth', 'Young Adult'];
  const education = ['High School Undergraduate', 'College Undergraduate', 'College Graduate', 'Senior High School Completer'];
  for (let year = currentYear - 2; year <= currentYear; year++) {
    for (let month = 1; month <= (year === currentYear ? currentMonth : 12); month++) {
      const count = 3 + (month * 3 + year - currentYear + 2) % 6;
      for (let index = 0; index < count; index++) {
        const seed = month + index + year - currentYear + 2;
        const day = year === currentYear && month === currentMonth ? Math.min(10, Number(referenceDate.slice(8, 10))) : 10;
        const at = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T09:00:00+08:00`;
        const isOsy = seed % 4 === 0;
        records.push({
          key: `illustration-${year}-${month}-${index}`, name: `Historical sample ${year}-${month}-${index + 1}`,
          band: bands[seed % 3], education: education[seed % 4],
          status: (month + index) % 7 === 0 ? 'Needs changes' : (index + year) % 5 === 0 ? 'For review' : 'Approved (demo)',
          answers: { age: String(seed % 3 === 0 ? 15 + Math.floor(seed / 3) % 3 : seed % 3 === 1 ? 18 + seed % 7 : 25 + seed % 6), gender: seed % 11 === 0 ? 'LGBTQIA+' : seed % 2 ? 'Female' : 'Male', civilStatus: ['Single', 'Single', 'Single', 'Single', 'Single', 'Single', 'Single', 'Married', 'Live-in', 'Annulled', 'Separated', 'Widowed'][seed % 12], workStatus: isOsy ? (seed % 8 === 0 ? 'Employed' : 'Unemployed') : ['Student', 'Employed', 'Working Student', 'Unemployed'][seed % 4], isOsy: isOsy ? 'Yes' : 'No', osyFrom: isOsy ? String(year - 1) : '', osyTo: isOsy ? String(year) : '', skVoter: seed % 2 ? 'Yes' : 'No', nationalVoter: seed % 3 ? 'Yes' : 'No', kkAttendance: ['No', 'Yes', '2 to 3 times', 'More than 4 times'][seed % 4], organization: seed % 3 ? 'Fictional youth club' : '', suggestions: seed % 2 ? 'Illustrative skills workshop' : '' },
          history: [{ action: 'Profile submitted', actor: 'Illustrative history', at, note: 'Generated example, not a real submission or session action.' }],
        });
      }
    }
  }
  return records;
}
