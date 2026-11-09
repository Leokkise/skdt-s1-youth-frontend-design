export type YouthQrProfile = { name: string; age: string; ageGroup: string; barangay: string; education: string; workStatus: string };
const text = (value: string | undefined) => (value || '').replace(/\s+/g, ' ').trim();
// An explicit basic-field allowlist; never include identifiers, contact or household answers.
export function youthQrProfile(answers: Record<string, string>): YouthQrProfile {
  return {
    name: ['firstName', 'middleName', 'surname', 'suffix'].map(key => text(answers[key])).filter(Boolean).join(' '),
    age: text(answers.age), ageGroup: text(answers.ageGroup), barangay: text(answers.locality),
    education: text(answers.education), workStatus: text(answers.workStatus),
  };
}
export function youthQrFields(profile: YouthQrProfile) {
  return [['Name', profile.name], ['Age', profile.age], ['Age group', profile.ageGroup], ['Barangay', profile.barangay], ['Education', profile.education], ['Work status', profile.workStatus]] as const;
}
export function youthQrText(profile: YouthQrProfile) {
  return ['SK-DigiTalipapa — SYNTHETIC PROFILE PREVIEW', ...youthQrFields(profile).map(([label, value]) => `${label}: ${value || 'Not provided'}`), 'UNVERIFIED — NOT VALID FOR IDENTIFICATION OR EVENT CHECK-IN'].join('\n');
}
