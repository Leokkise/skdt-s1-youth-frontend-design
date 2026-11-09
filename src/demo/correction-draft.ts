import type { CorrectionNoteDraft } from './CorrectionFieldPicker';

export function correctionDraftError(targets: CorrectionNoteDraft[], allowedFieldIds: readonly string[]) {
  if (!targets.length || targets.length > 32) return 'Select between 1 and 32 answers that need changes.';
  const seen = new Set<string>();
  let length = 0;
  for (const target of targets) {
    if (seen.has(target.fieldId) || !allowedFieldIds.includes(target.fieldId)) return 'Choose each permitted answer only once.';
    seen.add(target.fieldId);
    const count = [...target.note.trim()].length;
    if (!count || count > 1000) return 'Add a note of 1–1,000 characters for every selected answer.';
    length += count;
  }
  return length > 16000 ? 'Keep all correction notes within 16,000 characters in total.' : '';
}
