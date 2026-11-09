export type StaffCursorV1 = { submittedAt: string; responseId: string };
export type StaffSubmissionV1 = {
  responseId: string; kkNumber: string; firstName: string; surname: string;
  status: "submitted"; submittedAt: string; isVerified: false;
};
export type StaffPageV1 = { items: StaffSubmissionV1[]; nextCursor: StaffCursorV1 | null };
export type StaffDetailV1 = {
  responseId: string; kkNumber: string; status: "submitted"; submittedAt: string;
  revision: number; answers: Record<string, string>; isVerified: false;
  receiptId: string; noticeVersion: "synthetic-s1-023-v1";
  staffNoticeVersion: "synthetic-s1-025-staff-read-v1"; staffAcknowledgedAt: string;
};
export type StaffReadReceiptV1 = { responseId: string; noticeVersion: "synthetic-s1-025-staff-read-v1"; recordedAt: string };
export type StaffResultV1<T> = { kind: "ok"; data: T } | { kind: "denied" | "invalid" | "unavailable" };
export interface YouthStaffV1 {
  list(limit?: number, before?: StaffCursorV1): Promise<StaffResultV1<StaffPageV1>>;
  detail(responseId: string): Promise<StaffResultV1<StaffDetailV1>>;
  counts(): Promise<StaffResultV1<{ submittedCount: number }>>;
  // Called by the submission owner after separate, explicit addendum acceptance.
  acknowledgeStaffRead(accepted: boolean): Promise<StaffResultV1<StaffReadReceiptV1>>;
}
