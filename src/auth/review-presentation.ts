import type { ReviewDecisionV2 } from '../../contracts/v1/youth-review-v2';

export type DecisionAttempt = { authId: string; responseId: string; outcome: ReviewDecisionV2; note: string; revision: number; requestId: string };
export function decisionError(outcome: ReviewDecisionV2, note: string) {
  if ([...note].length > 1000) return 'Use at most 1,000 characters in the review note.';
  if (outcome !== 'approved' && [...note.trim()].length < 10) return 'Needs changes and Rejected require a note of at least 10 characters.';
  return '';
}
export const reviewLabel = (status: string) => ({ not_shared: 'Not shared for review', pending_review: 'Pending review', approved: 'Approved', needs_changes: 'Needs changes', rejected: 'Rejected' }[status] || status);
export const positionLabel = (position: string) => ({ chairperson: 'Chairperson', treasurer: 'Treasurer', secretary: 'Secretary', legacy_reviewer: 'Legacy reviewer' }[position] || position);
export const manilaTime = (instant: string) => new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(instant));
