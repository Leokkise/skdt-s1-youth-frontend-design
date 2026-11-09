import type { StaffCursorV1 } from './youth-staff';
export type ReviewDecisionV1 = 'approved' | 'needs_changes' | 'rejected';
export type ReviewEventV1 = { eventId: string; revision: 1; decision: ReviewDecisionV1; note: string; recordedAt: string; actorLabel: 'Designated synthetic reviewer' };
export type ReviewStateV1 = { responseId: string; status: 'not_shared' | 'pending_review' | ReviewDecisionV1; revision: 0 | 1; history: ReviewEventV1[] };
export type ReviewRowV1 = { responseId: string; kkNumber: string; firstName: string; surname: string; submittedAt: string; isVerified: false; reviewStatus: 'pending_review' | ReviewDecisionV1; reviewRevision: 0 | 1 };
export type ReviewDetailV1 = { responseId: string; kkNumber: string; submittedAt: string; answers: Record<string, string>; isVerified: false; noticeVersion: 'synthetic-s1-026-review-v1'; acknowledgedAt: string; review: ReviewStateV1 };
export type ReviewCountsV1 = { submittedCount: number; pendingCount: number; approvedCount: number; needsChangesCount: number; rejectedCount: number };
export type ReviewResultV1<T> = { kind: 'ok'; data: T } | { kind: 'denied' | 'invalid' | 'conflict' | 'unavailable' };
export interface YouthReviewV1 {
  list(limit?: number, before?: StaffCursorV1): Promise<ReviewResultV1<{ items: ReviewRowV1[]; nextCursor: StaffCursorV1 | null }>>;
  detail(responseId: string): Promise<ReviewResultV1<ReviewDetailV1>>;
  counts(): Promise<ReviewResultV1<ReviewCountsV1>>;
  decide(responseId: string, decision: ReviewDecisionV1, note: string, expectedRevision: number, requestId: string): Promise<ReviewResultV1<ReviewStateV1>>;
  mine(): Promise<ReviewResultV1<ReviewStateV1>>;
  acknowledge(accepted: boolean): Promise<ReviewResultV1<{ responseId: string; noticeVersion: 'synthetic-s1-026-review-v1'; recordedAt: string }>>;
}
