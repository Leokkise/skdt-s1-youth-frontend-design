import type { SupabaseClient } from '@supabase/supabase-js';
import type { YouthReviewV2, ReviewResultV2 } from '../../contracts/v1/youth-review-v2';
import fields from '../../contracts/v1/youth-fields.json';
const object = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const uuid = (x: unknown) => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const time = (x: unknown) => typeof x === 'string' && Number.isFinite(Date.parse(x));
const keys = (x: Record<string, unknown>, allowed: string[]) => Object.keys(x).length === allowed.length && Object.keys(x).every(k => allowed.includes(k));
const decision = (x: unknown) => ['approved', 'needs_changes', 'rejected'].includes(String(x));
const reference = (x: unknown) => typeof x === 'string' && /^\d{4,}$/.test(x);
function event(x: unknown) {
  return object(x) && keys(x, ['eventId', 'revision', 'decision', 'note', 'recordedAt', 'actorLabel', 'position']) && uuid(x.eventId) && x.revision === 1 &&
    decision(x.decision) && typeof x.note === 'string' && [...x.note].length <= 1000 && (x.decision === 'approved' || [...x.note.trim()].length >= 10) &&
    time(x.recordedAt) && typeof x.actorLabel === 'string' && x.actorLabel.trim().length > 0 && [...x.actorLabel].length <= 80 && ['chairperson','treasurer','secretary','legacy_reviewer'].includes(String(x.position));
}
function state(x: unknown) {
  return object(x) && keys(x, ['responseId', 'status', 'revision', 'history']) && uuid(x.responseId) && Array.isArray(x.history) &&
    ((x.revision === 0 && ['not_shared', 'pending_review'].includes(String(x.status)) && x.history.length === 0) ||
      (x.revision === 1 && decision(x.status) && x.history.length === 1 && event(x.history[0]) && x.history[0].decision === x.status));
}
function row(x: unknown) {
  return object(x) && keys(x, ['responseId', 'kkNumber', 'firstName', 'surname', 'submittedAt', 'isVerified', 'reviewStatus', 'reviewRevision']) &&
    uuid(x.responseId) && reference(x.kkNumber) && typeof x.firstName === 'string' && typeof x.surname === 'string' && time(x.submittedAt) && x.isVerified === false &&
    ((x.reviewRevision === 0 && x.reviewStatus === 'pending_review') || (x.reviewRevision === 1 && decision(x.reviewStatus)));
}
const fieldKeys = new Set(fields.map(f => f.id));
export function youthReviewV2(client: SupabaseClient): YouthReviewV2 {
  async function call<T>(name: string, args: object, valid: (x: unknown) => boolean): Promise<ReviewResultV2<T>> {
    try {
      const initial = await client.auth.getSession();
      if (initial.error || !initial.data.session) return { kind: 'denied' };
      const { data, error } = await client.rpc(name, args);
      const latest = await client.auth.getSession();
      if (latest.error || latest.data.session?.access_token !== initial.data.session.access_token || latest.data.session?.user.id !== initial.data.session.user.id) return { kind: 'unavailable' };
      if (error) return { kind: error.code === '42501' ? 'denied' : error.code === '40001' ? 'conflict' : ['22023', '22P02', '22007', '22008'].includes(error.code) ? 'invalid' : 'unavailable' };
      return valid(data) ? { kind: 'ok', data: data as T } : { kind: 'unavailable' };
    } catch { return { kind: 'unavailable' }; }
  }
  return {
    list: (limit = 25, before) => call('youth_review_list_v2', { p_limit: limit, p_before_time: before?.submittedAt ?? null, p_before_id: before?.responseId ?? null },
      x => object(x) && keys(x, ['items', 'nextCursor']) && Array.isArray(x.items) && x.items.length <= limit && x.items.every(row) &&
        (x.nextCursor === null || (object(x.nextCursor) && keys(x.nextCursor, ['submittedAt', 'responseId']) && time(x.nextCursor.submittedAt) && uuid(x.nextCursor.responseId)))),
    detail: responseId => call('youth_review_detail_v2', { p_response_id: responseId }, x => object(x) &&
      keys(x, ['responseId', 'kkNumber', 'submittedAt', 'answers', 'isVerified', 'noticeVersion', 'acknowledgedAt', 'review']) &&
      x.responseId === responseId && uuid(x.responseId) && reference(x.kkNumber) && time(x.submittedAt) && x.isVerified === false &&
      x.noticeVersion === 'synthetic-s1-027-review-v1' && time(x.acknowledgedAt) && state(x.review) && object(x.review) && x.review.responseId === responseId &&
      object(x.answers) && Object.entries(x.answers).every(([k, v]) => fieldKeys.has(k) && typeof v === 'string')),
    counts: () => call('youth_review_counts_v2', {}, x => object(x) && keys(x, ['submittedCount', 'pendingCount', 'approvedCount', 'needsChangesCount', 'rejectedCount']) &&
      Object.values(x).every(v => Number.isSafeInteger(v) && Number(v) >= 0) && x.submittedCount === Number(x.pendingCount) + Number(x.approvedCount) + Number(x.needsChangesCount) + Number(x.rejectedCount)),
    decide: (responseId, outcome, note, revision, requestId) => call('youth_review_decide_v2', {
      p_response_id: responseId, p_decision: outcome, p_note: note, p_expected_revision: revision, p_request_id: requestId,
    }, x => state(x) && object(x) && x.responseId === responseId && x.status === outcome && x.revision === 1 && Array.isArray(x.history) && x.history[0].note === note),
    mine: () => call('youth_get_my_review_v2', {}, state),
    acknowledge: accepted => call('youth_allow_review_v2', { p_notice_version: 'synthetic-s1-027-review-v1', p_accepted: accepted },
      x => object(x) && keys(x, ['responseId', 'noticeVersion', 'recordedAt']) && uuid(x.responseId) && x.noticeVersion === 'synthetic-s1-027-review-v1' && time(x.recordedAt)),
  };
}
