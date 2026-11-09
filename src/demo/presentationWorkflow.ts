import { type Answers } from '../profiling/fields';
import { validate } from '../profiling/validation';
import { editableCorrectionFields } from '../profiling/fields';

export type ReviewStatus = 'For review' | 'Needs changes' | 'Approved (demo)' | 'Rejected (demo)';
export type ConsentReceipt = { privacyAccepted: true; privacyAcceptedAt: string; noticeVersion: string; certified: true; certifiedAt: string };
export type HistoryEntry = { action: string; actor: string; at: string; note: string; consent?: ConsentReceipt; correctionFields?: string[] };
export type PracticeResponse = { key: string; kkNumber?: string; consent?: ConsentReceipt; correctionFields?: string[]; answers: Answers; referenceDate: string; status: ReviewStatus; note: string; history: HistoryEntry[] };
export type FixtureReview = { status: ReviewStatus; note: string; history: HistoryEntry[]; correctionFields?: string[] };

export function formatKkNumber(sequence: number): string {
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new Error('Invalid KK sequence.');
  return String(sequence).padStart(4, '0');
}
export function consentReceipt(answers: Answers): ConsentReceipt {
  if (answers.privacyConsent !== 'true' || answers.certification !== 'true' || !answers.noticeVersion || !answers.privacyAcceptedAt || !answers.certificationAcceptedAt || !Number.isFinite(Date.parse(answers.privacyAcceptedAt)) || !Number.isFinite(Date.parse(answers.certificationAcceptedAt)) || Date.parse(answers.certificationAcceptedAt) < Date.parse(answers.privacyAcceptedAt)) throw new Error('Accept the privacy notice and certify the current answers.');
  return { privacyAccepted: true, privacyAcceptedAt: answers.privacyAcceptedAt, noticeVersion: answers.noticeVersion, certified: true, certifiedAt: answers.certificationAcceptedAt };
}

export function recordDecision(previous: { history: HistoryEntry[] }, status: ReviewStatus, note: string, at: string, correctionFields: string[] = []): FixtureReview {
  const cleanNote = note.trim();
  if (['Needs changes', 'Rejected (demo)'].includes(status) && !cleanNote) throw new Error('Explain what needs to be changed or why the profile was rejected.');
  const fields = status === 'Needs changes' ? [...new Set(correctionFields)].filter(id => editableCorrectionFields.some(field => field.id === id)) : [];
  return { status, note: cleanNote, correctionFields: fields, history: [...previous.history, { action: status, actor: 'Synthetic staff', at, note: cleanNote, correctionFields: fields }] };
}

export function correctResponse(response: PracticeResponse, answers: Answers, at: string): PracticeResponse {
  if (response.status !== 'Needs changes') throw new Error('Only profiles returned for changes can be resubmitted.');
  if (Object.keys(validate(answers, response.referenceDate)).length) throw new Error('Please check the corrected answers.');
  const consent = consentReceipt(answers);
  return { ...response, consent, correctionFields: [], answers: { ...answers }, status: 'For review', note: '', history: [...response.history, { action: 'Corrections submitted', actor: 'Synthetic youth', at, note: '', consent }] };
}

// Illustrative exact-match warning only. Never use this as a youth identity,
// residency check, merge rule, or approved duplicate policy.
export function possibleDuplicates(answers: Answers, candidates: { key: string; answers: Answers }[], excludeKey?: string) {
  const normalized = (value: string | undefined) => (value || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const fields = ['firstName', 'surname', 'birthdate'];
  if (fields.some(field => !normalized(answers[field]))) return [];
  return candidates.filter(candidate => candidate.key !== excludeKey && fields.every(field => normalized(candidate.answers[field]) === normalized(answers[field])));
}
