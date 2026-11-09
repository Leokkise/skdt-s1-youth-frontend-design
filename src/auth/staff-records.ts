import type { AnalyticsRowV1, RegistryRowV3 } from '../../contracts/v1/youth-workflow';
import type { SampleRecord } from '../demo/registryData';
import type { ReviewStatus } from '../demo/presentationWorkflow';

const statuses: Record<RegistryRowV3['reviewStatus'], ReviewStatus> = { pending_review: 'For review', approved: 'Approved (demo)', needs_changes: 'Needs changes', rejected: 'Rejected (demo)' };
export function registryRecord(row: RegistryRowV3 & {answerRevision?: number | null}): SampleRecord {
  return { answerRevision: row.answerRevision ?? null, key: row.responseId, kkNumber: row.kkNumber, name: `${row.firstName} ${row.surname}`, band: row.ageGroup.split(' (')[0], education: row.education,
    status: statuses[row.reviewStatus], referenceDate: row.reportingDate, reportingDate: row.reportingDate, reportingDateKind: row.reportingDateKind, source: row.source };
}
export function analyticsRecord(row: AnalyticsRowV1, index: number): SampleRecord {
  return { key: `private-aggregate-row-${index}`, name: '', band: row.ageGroup.split(' (')[0], education: row.education, status: 'Approved (demo)',
    referenceDate: row.reportingDate, reportingDate: row.reportingDate, reportingDateKind: row.reportingDateKind, source: row.source,
    programCategories: row.programCategories, organizationPresent: row.organizationPresent,
    answers: { age: row.age, ageGroup: row.ageGroup, gender: row.gender, civilStatus: row.civilStatus, education: row.education, workStatus: row.workStatus,
      isOsy: row.isOsy || '', skVoter: row.skVoter, nationalVoter: row.nationalVoter, election2023: row.election2023 || '', kkAttendance: row.kkAttendance } };
}
