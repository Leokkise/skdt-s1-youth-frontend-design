import { ageAt } from './validation';
import type { SiblingBirthdateRow } from './SiblingBirthdateEditor';
export function siblingBirthdateError(rows: SiblingBirthdateRow[], referenceDate: string) {
  if (rows.length > 20) return 'Add no more than 20 siblings.';
  for (const row of rows) {
    if (!row.name.trim() && !row.birthdate && !row.age) continue;
    if (!row.name.trim()) return 'Complete each sibling’s name.';
    if (row.birthdate) {
      const age=ageAt(row.birthdate, referenceDate);
      if(age===null||age>120) return 'Enter a valid sibling birthdate with an age from 0 to 120.';
    } else if (!/^\d{1,3}$/.test(row.age)||Number(row.age)>120) return 'Enter a sibling birthdate to calculate age.';
  }
  return '';
}
