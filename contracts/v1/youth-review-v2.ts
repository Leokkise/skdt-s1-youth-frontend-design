import type { StaffCursorV1 } from './youth-staff';
export type ReviewDecisionV2 = 'approved' | 'needs_changes' | 'rejected';
export type ReviewEventV2 = { eventId: string; revision: 1; decision: ReviewDecisionV2; note: string; recordedAt: string; actorLabel: string; position: 'chairperson' | 'treasurer' | 'secretary' | 'legacy_reviewer' };
export type ReviewStateV2 = { responseId: string; status: 'not_shared' | 'pending_review' | ReviewDecisionV2; revision: 0 | 1; history: ReviewEventV2[] };
export type ReviewRowV2 = { responseId: string; kkNumber: string; firstName: string; surname: string; submittedAt: string; isVerified: false; reviewStatus: 'pending_review' | ReviewDecisionV2; reviewRevision: 0 | 1 };
export type ReviewDetailV2 = { responseId: string; kkNumber: string; submittedAt: string; answers: Record<string, string>; isVerified: false; noticeVersion: 'synthetic-s1-027-review-v1'; acknowledgedAt: string; review: ReviewStateV2 };
export type ReviewCountsV2 = { submittedCount: number; pendingCount: number; approvedCount: number; needsChangesCount: number; rejectedCount: number };
export type ReviewResultV2<T> = { kind: 'ok'; data: T } | { kind: 'denied' | 'invalid' | 'conflict' | 'unavailable' };
export interface YouthReviewV2 {
  list(limit?: number, before?: StaffCursorV1): Promise<ReviewResultV2<{ items: ReviewRowV2[]; nextCursor: StaffCursorV1 | null }>>;
  detail(responseId: string): Promise<ReviewResultV2<ReviewDetailV2>>;
  counts(): Promise<ReviewResultV2<ReviewCountsV2>>;
  decide(responseId: string, decision: ReviewDecisionV2, note: string, expectedRevision: number, requestId: string): Promise<ReviewResultV2<ReviewStateV2>>;
  mine(): Promise<ReviewResultV2<ReviewStateV2>>;
  acknowledge(accepted: boolean): Promise<ReviewResultV2<{ responseId: string; noticeVersion: 'synthetic-s1-027-review-v1'; recordedAt: string }>>;
}
