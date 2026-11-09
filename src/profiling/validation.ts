import { allFields, visibleFields, siblingRows, TALIPAPA_LOCALITY, type Answers, type Field } from './fields';

export function profilingDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
}
export function ageAt(birthdate: string, referenceDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate) || !/^\d{4}-\d{2}-\d{2}$/.test(referenceDate)) return null;
  const birth = new Date(`${birthdate}T00:00:00Z`);
  const reference = new Date(`${referenceDate}T00:00:00Z`);
  if (!Number.isFinite(birth.getTime()) || !Number.isFinite(reference.getTime()) ||
      birth.toISOString().slice(0, 10) !== birthdate || reference.toISOString().slice(0, 10) !== referenceDate || birth > reference) return null;
  const [by, bm, bd] = birthdate.split('-').map(Number);
  const [ry, rm, rd] = referenceDate.split('-').map(Number);
  return ry - by - (rm < bm || (rm === bm && rd < bd) ? 1 : 0);
}
export function groupForAge(age: number): string {
  if (age >= 15 && age <= 17) return 'Child Youth (15 - 17 yrs old)';
  if (age >= 18 && age <= 24) return 'Core Youth (18 - 24 yrs old)';
  if (age >= 25 && age <= 30) return 'Young Adult (25 - 30 yrs old)';
  return '';
}
export function validate(answers: Answers, referenceDate: string, fields: Field[] = allFields): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of visibleFields(fields, answers)) {
    const value = answers[field.id]?.trim() || '';
    if (field.required && !value) errors[field.id] = field.type === 'checkbox' ? 'Please accept the accuracy certification to continue.' : 'Please complete this required field.';
    else if (field.type === 'checkbox' && field.required && value !== 'true') errors[field.id] = 'Please accept the accuracy certification to continue.';
    else if (value && field.options && !field.options.includes(value)) errors[field.id] = 'Please choose one of the listed options.';
  }
  const ids = new Set(fields.map(field => field.id));
  if (ids.has('contactNumber') && answers.contactNumber && !/^\+639\d{9}$/.test(normalizeMobile(answers.contactNumber))) errors.contactNumber = 'Enter a Philippine mobile number: +63 followed by 10 digits starting with 9.';
  if (ids.has('locality') && answers.locality !== TALIPAPA_LOCALITY) errors.locality = 'The barangay and city must be Talipapa, Quezon City.';
  if (ids.has('siblings') && siblingRows(answers.siblings).some(row => (row.name.trim() || row.age) && (!row.name.trim() || !/^\d{1,3}$/.test(row.age) || Number(row.age) > 120))) errors.siblings = 'Complete each sibling’s name and age (0–120), or leave the whole row blank.';
  if (ids.has('osyFrom') && answers.isOsy === 'Yes') {
    const year = Number(referenceDate.slice(0, 4));
    for (const id of ['osyFrom', 'osyTo']) if (!/^\d{4}$/.test(answers[id] || '') || Number(answers[id]) < 1900 || Number(answers[id]) > year) errors[id] = `Enter a year from 1900 to ${year}.`;
    if (!errors.osyFrom && !errors.osyTo && Number(answers.osyTo) < Number(answers.osyFrom)) errors.osyTo = 'To must be the same year as or later than From.';
  }
  const calculated = ageAt(answers.birthdate || '', referenceDate);
  if (ids.has('birthdate') && answers.birthdate && calculated === null) errors.birthdate = 'Enter a valid birthdate on or before the profiling date.';
  const age = Number(answers.age);
  if (ids.has('age') && answers.age) {
    if (!/^\d+$/.test(answers.age) || !Number.isInteger(age) || age < 15 || age > 30) errors.age = 'Age must be a whole number from 15 to 30.';
    else if (calculated !== null && age !== calculated) errors.age = `Your birthdate gives an age of ${calculated} on ${referenceDate}. Please check both answers.`;
  }
  if (ids.has('ageGroup') && answers.ageGroup && answers.age && answers.ageGroup !== groupForAge(age)) errors.ageGroup = 'Choose the age group that matches your age.';
  return errors;
}
export function normalizeMobile(value: string): string {
  const compact = value.replace(/[\s()-]/g, '');
  if (/^09\d{9}$/.test(compact)) return '+63' + compact.slice(1);
  if (/^9\d{9}$/.test(compact)) return '+63' + compact;
  return compact;
}
export function changeAnswer(answers: Answers, id: string, value: string, referenceDate = profilingDate()): Answers {
  const updated = { ...answers, [id]: value };
  if (id === 'gender' && value !== 'LGBTQIA+') delete updated.lgbtqiaDetails;
  if (id === 'birthdate') {
    const age = ageAt(value, referenceDate);
    updated.age = age === null ? '' : String(age);
    updated.ageGroup = age === null ? '' : groupForAge(age);
  }
  if (id === 'isOsy' && value !== 'Yes') { delete updated.osyFrom; delete updated.osyTo; delete updated.osyDuration; }
  if (id === 'certification') updated.certificationAcceptedAt = value === 'true' ? new Date().toISOString() : '';
  else { updated.certification = ''; updated.certificationAcceptedAt = ''; }
  if (['houseNumber', 'street', 'subdivision', 'locality'].includes(id)) updated.address = [updated.houseNumber, updated.street, updated.subdivision, updated.locality].filter(Boolean).join(', ');
  return updated;
}
export function syntheticAnswers(referenceDate: string): Answers {
  const year = Number(referenceDate.slice(0, 4)) - 20;
  return {
    surname: 'DEMO', firstName: 'SYNTHETIC YOUTH', birthdate: `${year}-01-01`, age: '20',
    gender: 'Male', civilStatus: 'Single', contactNumber: '+639000000000',
    houseNumber: 'DEMO 001', street: 'Demo Street (fictional)', subdivision: '', locality: TALIPAPA_LOCALITY,
    address: 'FICTIONAL HOUSE 001, DEMO STREET, BARANGAY TALIPAPA', rbiNumber: 'DEMO-NOT-A-REAL-RBI-001',
    headOfFamily: 'Demo, Synthetic Parent, X.', ageGroup: 'Core Youth (18 - 24 yrs old)',
    education: 'College Undergraduate', workStatus: 'Student', children: 'No', skVoter: 'No',
    election2023: 'No — synthetic demonstration answer.', nationalVoter: 'No', kkAttendance: 'No',
    suggestions: 'Demo suggestion: skills workshops.', message: 'This is synthetic test data.',
  };
}
