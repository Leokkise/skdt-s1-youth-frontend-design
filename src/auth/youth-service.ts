import type { SupabaseClient } from "@supabase/supabase-js";
import type { YouthResultV1, YouthServiceV1, YouthStateV1 } from "../../contracts/v1/youth";

const uuid = (x: unknown): x is string => typeof x === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const timestamp = (x: unknown): x is string => typeof x === "string" && Number.isFinite(Date.parse(x));
function valid(x: unknown): x is YouthStateV1 {
  if (!x || typeof x !== "object" || !("kind" in x)) return false;
  const s = x as Record<string, unknown>;
  if (s.kind === "unlinked") return true;
  if (s.kind === "linkPending") return uuid(s.requestId) && timestamp(s.createdAt);
  if (s.kind !== "draft" && s.kind !== "submitted") return false;
  return uuid(s.youthId) && Number.isInteger(s.revision) && Number(s.revision) >= 0 && timestamp(s.updatedAt) &&
    s.isVerified === false && !!s.answers && typeof s.answers === "object" && !Array.isArray(s.answers) &&
    Object.values(s.answers).every(v => typeof v === "string") &&
    (s.kind === "draft" ? [s.responseId, s.submittedAt, s.kkNumber, s.receiptId, s.noticeVersion].every(v => v === null) :
      uuid(s.responseId) && timestamp(s.submittedAt) && typeof s.kkNumber === "string" && /^\d{4,}$/.test(s.kkNumber) &&
      uuid(s.receiptId) && s.noticeVersion === "synthetic-s1-023-v1");
}
export function youthServiceV1(client: SupabaseClient): YouthServiceV1 {
  async function call(name: string, args = {}): Promise<YouthResultV1> {
    try {
      const initial = await client.auth.getSession();
      if (initial.error || !initial.data.session) return { kind: "denied" };
      const { data, error } = await client.rpc(name, args);
      const latest = await client.auth.getSession();
      if (latest.error || latest.data.session?.access_token !== initial.data.session.access_token ||
        latest.data.session?.user.id !== initial.data.session.user.id) return { kind: "unavailable" };
      if (error) return { kind: ({ "42501": "denied", "22023": "invalid", "40001": "conflict", "55000": "closed" } as const)[error.code] ?? "unavailable" };
      return valid(data) ? { kind: "ok", state: data } : { kind: "unavailable" };
    } catch { return { kind: "unavailable" }; }
  }
  return {
    read: () => call("youth_get_mine_v1"), create: () => call("youth_create_mine_v1"),
    save: (revision, answers) => call("youth_save_mine_v1", { p_revision: revision, p_answers: answers }),
    submit: (revision, requestId, privacyAccepted, certified) => call("youth_submit_mine_v1", {
      p_revision: revision, p_request_id: requestId, p_notice_version: "synthetic-s1-023-v1",
      p_privacy_accepted: privacyAccepted, p_certified: certified,
    }),
  };
}
