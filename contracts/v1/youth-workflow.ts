import type { YouthStateV1 } from './youth';
import type { StaffCursorV1 } from './youth-staff';
import type { ReviewDecisionV2, ReviewStateV2, ReviewDetailV2, ReviewResultV2 } from './youth-review-v2';
export type ProfileSourceV3 = 'self_service' | 'walk_in' | 'demo_import';
export type ReportingDateKindV1 = 'actual_submission' | 'synthetic_illustration';
export type RegistryRowV3 = {
  responseId: string; kkNumber: string; firstName: string; surname: string;
  ageGroup: string; education: string; submittedAt: string; reportingDate: string;
  reportingDateKind: ReportingDateKindV1; source: ProfileSourceV3;
  reviewStatus: 'pending_review' | ReviewDecisionV2; reviewRevision: 0 | 1; isVerified: false;
};
export type AnalyticsRowV1 = {
  reportingDate: string; reportingDateKind: ReportingDateKindV1; source: ProfileSourceV3;
  age: string; ageGroup: string; gender: string; civilStatus: string; education: string;
  workStatus: string; isOsy: string | null; skVoter: string; nationalVoter: string;
  election2023: 'Yes' | 'No' | null; kkAttendance: string; organizationPresent: boolean;
  programCategories: string[];
};
export type EncoderReceiptV1 = {
  kind: 'fictional_staff_attestation'; actorLabel: string;
  position: 'chairperson' | 'treasurer' | 'secretary'; recordedAt: string;
  noticeVersion: 'synthetic-s1-028-encoder-v1';
};
export type RegistryDetailV3 = {
  source: ProfileSourceV3;
  detail: Omit<ReviewDetailV2, 'noticeVersion'> & { noticeVersion: 'synthetic-s1-027-review-v1' | 'synthetic-s1-028-encoder-v1' };
  encoderReceipt: EncoderReceiptV1 | null;
};
export type WorkflowPageV1<T> = { items: T[]; nextCursor: StaffCursorV1 | null };
export type EncodedSubmissionV1 = { responseId: string; kkNumber: string; submittedAt: string; review: ReviewStateV2 };
export interface YouthWorkflowV1 {
  submit(revision: number, requestId: string, privacyAccepted: boolean, certified: boolean, reviewAccepted: boolean): Promise<ReviewResultV2<{ state: YouthStateV1; review: ReviewStateV2 }>>;
  registry(limit?: number, before?: StaffCursorV1): Promise<ReviewResultV2<WorkflowPageV1<RegistryRowV3>>>;
  analytics(limit?: number, before?: StaffCursorV1): Promise<ReviewResultV2<WorkflowPageV1<AnalyticsRowV1>>>;
  detail(responseId: string): Promise<ReviewResultV2<RegistryDetailV3>>;
  decide(responseId: string, decision: ReviewDecisionV2, note: string, expectedRevision: number, requestId: string): Promise<ReviewResultV2<ReviewStateV2>>;
}
