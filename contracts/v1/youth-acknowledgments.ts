import type { ReviewResultV2 } from './youth-review-v2';
import type { CorrectionReceiptV1 } from './youth-corrections';
import type { FamilySaveReceiptV1 } from './youth-family-export';
export type ProfilingNoticeV1 = { noticeVersion: 'synthetic-s1-032-v1'; receipt: null | { userId: string; noticeVersion: 'synthetic-s1-032-v1'; recordedAt: string } };
export type YouthAcknowledgmentsV1 = {
  mine(): Promise<ReviewResultV2<ProfilingNoticeV1>>;
  accept(requestId: string, accepted: boolean): Promise<ReviewResultV2<ProfilingNoticeV1>>;
  save(revision: number, answers: Record<string,string>, requestId: string): Promise<ReviewResultV2<FamilySaveReceiptV1>>;
  submit(revision: number, requestId: string, certified: boolean): Promise<ReviewResultV2<CorrectionReceiptV1>>;
  begin(requestId: string): Promise<ReviewResultV2<CorrectionReceiptV1>>;
  resubmit(answerRevision: number, draftVersion: number, requestId: string, certified: boolean): Promise<ReviewResultV2<CorrectionReceiptV1>>;
};
