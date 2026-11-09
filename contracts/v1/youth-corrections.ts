import type { ReviewResultV2, ReviewDecisionV2 } from './youth-review-v2';
import type { RegistryRowV3, EncoderReceiptV1, AnalyticsRowV1, WorkflowPageV1 } from './youth-workflow';
import type { StaffCursorV1 } from './youth-staff';
export type CorrectionTargetInputV1 = { fieldId: string; note: string };
export type CorrectionTargetV1 = CorrectionTargetInputV1 & { sectionId: string };
export type CorrectionStatusV1 = 'pending_review' | ReviewDecisionV2;
export type CorrectionActorV1 = { kind: 'associated_youth' } | { kind: 'staff'; actorLabel: string; position: 'chairperson' | 'treasurer' | 'secretary' };
export type CorrectionDecisionV1 = {
  eventId: string; decision: ReviewDecisionV2; note: string; targets: CorrectionTargetV1[];
  actorLabel: string; position: 'chairperson' | 'treasurer' | 'secretary'; recordedAt: string;
};
export type CorrectionDetailV1 = {
  responseId: string; kkNumber: string; answerRevision: number; status: CorrectionStatusV1;
  answers: Record<string,string>; submittedAt: string; snapshotAt: string;
  revisionKind: 'enrollment_snapshot' | 'resubmission'; recordedBy: CorrectionActorV1;
  source: 'self_service' | 'walk_in' | 'demo_import'; encoderReceipt: EncoderReceiptV1 | null;
  decision: CorrectionDecisionV1 | null; allowedFieldIds: string[]; editableFieldIds: string[];
  draft: { version: number; answers: Record<string,string> } | null;
};
export type CorrectionHistoryV1 = {
  responseId: string;
  items: { answerRevision: number; answers: Record<string,string>; submittedAt: string; snapshotAt: string; revisionKind: 'enrollment_snapshot' | 'resubmission'; recordedBy: CorrectionActorV1; decision: CorrectionDecisionV1 | null }[];
  nextBeforeRevision: number | null;
};
export type CorrectionReceiptV1 = { responseId: string; answerRevision: number; draftVersion: number; status: CorrectionStatusV1; recordedAt: string };
export type YouthCorrectionsV1 = {
  mine(): Promise<ReviewResultV2<CorrectionDetailV1>>;
  detail(responseId: string): Promise<ReviewResultV2<CorrectionDetailV1>>;
  history(responseId: string, beforeRevision?: number, limit?: number): Promise<ReviewResultV2<CorrectionHistoryV1>>;
  decide(responseId: string, answerRevision: number, decision: ReviewDecisionV2, note: string, targets: CorrectionTargetInputV1[], requestId: string): Promise<ReviewResultV2<CorrectionReceiptV1>>;
  save(answerRevision: number, draftVersion: number, patch: Record<string,string>, requestId: string): Promise<ReviewResultV2<CorrectionReceiptV1>>;
  staffBegin(responseId: string, requestId: string, attested: boolean): Promise<ReviewResultV2<CorrectionReceiptV1>>;
  staffEdit(responseId: string): Promise<ReviewResultV2<CorrectionDetailV1>>;
  staffSave(responseId: string, answerRevision: number, draftVersion: number, patch: Record<string,string>, requestId: string): Promise<ReviewResultV2<CorrectionReceiptV1>>;
  staffResubmit(responseId: string, answerRevision: number, draftVersion: number, requestId: string, attested: boolean, certified: boolean): Promise<ReviewResultV2<CorrectionReceiptV1>>;
  registry(limit?: number, before?: StaffCursorV1): Promise<ReviewResultV2<WorkflowPageV1<RegistryRowV3 & { answerRevision: number | null }>>>;
  analytics(limit?: number, before?: StaffCursorV1): Promise<ReviewResultV2<WorkflowPageV1<AnalyticsRowV1>>>;
};
