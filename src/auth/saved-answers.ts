import fields from '../../contracts/v1/youth-fields.json';
import { ageAt, groupForAge, normalizeMobile } from '../profiling/validation';
import type { Answers } from '../profiling/fields';

export function savedAnswers(answers: Answers, date: string): Answers {
  const keys = new Set(fields.map(field => field.id));
  const result = Object.fromEntries(Object.entries(answers).filter(([key]) => keys.has(key)));
  if (result.contactNumber) result.contactNumber = normalizeMobile(result.contactNumber);
  if (result.gender !== 'LGBTQIA+') delete result.lgbtqiaDetails;
  if (result.isOsy !== 'Yes') { delete result.osyFrom; delete result.osyTo; }
  const age = ageAt(result.birthdate || '', date);
  if (age !== null) {
    if (result.age !== String(age) || result.ageGroup !== groupForAge(age)) result.certification = '';
    result.age = String(age); result.ageGroup = groupForAge(age);
  }
  return result;
}
