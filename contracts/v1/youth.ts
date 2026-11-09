// Local synthetic S1-023 RPC contract. No arbitrary youth/actor argument exists.
export type YouthStateV1 =
  | { kind: "unlinked" }
  | { kind: "linkPending"; requestId: string; createdAt: string }
  | { kind: "draft" | "submitted"; youthId: string; revision: number;
      answers: Record<string, string>; updatedAt: string; responseId: string | null;
      submittedAt: string | null; kkNumber: string | null; receiptId: string | null;
      noticeVersion: string | null; isVerified: false };
export type YouthResultV1 = { kind: "ok"; state: YouthStateV1 } |
  { kind: "denied" | "invalid" | "conflict" | "closed" | "unavailable" };
export interface YouthServiceV1 {
  read(): Promise<YouthResultV1>;
  create(): Promise<YouthResultV1>;
  save(revision: number, answers: Record<string, string>): Promise<YouthResultV1>;
  submit(revision: number, requestId: string, privacyAccepted: boolean, certified: boolean): Promise<YouthResultV1>;
}
