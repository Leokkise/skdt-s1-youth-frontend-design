import type { ReviewResultV2 } from './youth-review-v2';
import type { EncodedSubmissionV1 } from './youth-workflow';
export type SiblingV2 = { name: string; age: string; birthdate?: string };
export type ProfileSectionV1 = 'personal' | 'household' | 'education' | 'participation' | 'voice';
export type ApprovedExportSelectionV1 = { responseId: string; answerRevision: number | null };
export type FamilyScopeReceiptV1 = { youthId: string; noticeVersion: string; kind: 'associated_youth_scope' | 'fictional_staff_data_scope'; recordedAt: string };
export type FamilySaveReceiptV1 = { youthId: string; revision: number; updatedAt: string };
export type FamilySubmissionReceiptV1 = { responseId: string; revision: number; kkNumber: string; submittedAt: string };
export type YouthRevisionOptionsV1 = { serverDate: string; correctionsEnabled: boolean; siblingBirthdatesEnabled: boolean; fullSectionExportEnabled: boolean; ownerCorrectionNoticeVersion: 'synthetic-s1-030-corrections-v1'; staffCorrectionNoticeVersion: 'synthetic-s1-030-staff-corrections-v1'; ownerFamilyNoticeVersion: 'synthetic-s1-031-family-export-v1'; staffFamilyNoticeVersion: 'synthetic-s1-031-staff-family-export-v1' };
export type ApprovedProfileExportV1 = {
  requestId: string; recordedAt: string; sections: ProfileSectionV1[];
  items: { responseId: string; kkNumber: string; firstName: string; surname: string; reportingDate: string; reportingDateKind: 'actual_submission' | 'synthetic_illustration'; answerRevision: number | null; source: 'self_service' | 'walk_in' | 'demo_import'; sections: { sectionId: ProfileSectionV1; answers: Record<string,string> }[] }[];
};
export type YouthFamilyExportV1 = {
  options(): Promise<ReviewResultV2<YouthRevisionOptionsV1>>;
  exportProfiles(selection: ApprovedExportSelectionV1[], sections: ProfileSectionV1[], requestId: string): Promise<ReviewResultV2<ApprovedProfileExportV1>>;
};
