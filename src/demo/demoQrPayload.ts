// Fixed fictional fixture, independent of the signed-in youth and registry.
// Never add submitted answers, uploaded pictures, youth/Auth IDs or RBI here.
export const demoQrProfile = Object.freeze({
  name: 'Alex Demo',
  age: '20',
  ageGroup: 'Core Youth (18–24)',
  barangay: 'Talipapa, Quezon City',
  education: 'College Undergraduate',
  workStatus: 'Student',
});

export const demoQrFields = [
  ['Name', demoQrProfile.name],
  ['Age', demoQrProfile.age],
  ['Age group', demoQrProfile.ageGroup],
  ['Barangay', demoQrProfile.barangay],
  ['Education', demoQrProfile.education],
  ['Work status', demoQrProfile.workStatus],
] as const;

export const demoQrText = [
  'SK-DigiTalipapa — FICTIONAL SAMPLE',
  'DEMO ONLY — Not a real person',
  ...demoQrFields.map(([label, value]) => `${label}: ${value}`),
  'NOT VALID FOR IDENTIFICATION OR EVENT CHECK-IN',
].join('\n');
