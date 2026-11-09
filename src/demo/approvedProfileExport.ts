import { sections, visibleFields, displayReviewAnswer, type Answers } from '../profiling/fields';
import { displayLabel } from '../presentation-copy';
export class ProfileExportError extends Error {}
export function profileExportFailure(kind: string) {
  if (kind === 'denied') return new ProfileExportError('Export access was not granted for every selected profile. Check your staff access and reload the approved selection.');
  if (kind === 'conflict') return new ProfileExportError('The approved selection changed. Reload the registry and try again.');
  if (kind === 'invalid') return new ProfileExportError('The export selection could not be accepted. Reload the registry and choose the records and sections again.');
  return new ProfileExportError('The export service could not confirm the request. Retry after reloading the registry.');
}
const sectionIds = ['personal', 'household', 'education', 'participation', 'voice'] as const;
export const PROFILE_EXPORT_SECTIONS = sections.map((section, index) => ({ id: sectionIds[index], title: section.title, fields: section.fields }));
export type ProfileExportSectionId = typeof PROFILE_EXPORT_SECTIONS[number]['id'];
export type ApprovedExportSource = { responseId: string; registrationNo: string; name: string; approved: boolean; answers: Answers; reportingDate: string };
export type ApprovedProfileExport = { generatedAt: string; scope?: string; profiles: { registrationNo: string; name: string; reportingDate: string; sections: { title: string; answers: { label: string; value: string }[] }[] }[] };
export function buildApprovedProfileExport(records: ApprovedExportSource[], selectedSections: string[], generatedAt = new Date().toISOString(), scope?: string): ApprovedProfileExport {
  if (!selectedSections.length || selectedSections.some(id => !PROFILE_EXPORT_SECTIONS.some(section => section.id === id))) throw new Error('Choose valid profile sections.');
  if (!records.length || records.some(record => !record.approved)) throw new Error('Only approved profiles can be exported.');
  if (new Set(records.map(record => record.responseId)).size !== records.length) throw new Error('A profile was included more than once.');
  return { generatedAt, scope, profiles: records.map(record => ({registrationNo: record.registrationNo || 'Unassigned', name: displayLabel(record.name), reportingDate: record.reportingDate || 'Not recorded',
    sections: sections.filter((_, index) => selectedSections.includes(PROFILE_EXPORT_SECTIONS[index].id)).map(section => ({title: section.title, answers: visibleFields(section.fields, record.answers).map(field => ({label: field.label, value: displayReviewAnswer(field, record.answers)}))}))
  })) };
}
