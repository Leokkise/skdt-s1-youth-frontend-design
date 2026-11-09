// Presentation labels only. Stored records, status values and audit snapshots remain unchanged.
export function displayLabel(value: string) {
  return value.replace(/\s*\(demo\)/gi, '').replace(/\b(?:synthetic|fictional|dummy)\s*/gi, '').replace(/\b(?:demo|sample)\b/gi, '').replace(/\bexample\b/gi, 'record').replace(/\s{2,}/g, ' ').trim();
}
export const submitCheckbox = 'I agree to submit my answers to the three-person staff review queue, including an attributed outcome and note, recorded review activity, and the private registry and Analytics uses described above.';
export const encoderCheckbox = 'I confirm the information entered and record my own staff-encoder attestation. This does not claim consent or certification from a youth or guardian.';
export const reviewCheckbox = 'I agree that the chairperson, treasurer and secretary may review this submission, record an outcome and note, and include the review in private staff history and workload counts.';

// Presentation summaries only; exact versioned notices remain in contracts and operator documentation.
export function revisionNoticeCopy(staff: boolean, family: boolean) {
  const recipients = 'The chairperson, treasurer and secretary';
  const history = 'Earlier submitted answers, field-specific notes, decisions, staff attribution and server times remain in private review history. Approved or Rejected registrations cannot be reopened through this workflow.';
  const limits = 'Review does not verify identity, residency or eligibility. Retention, withdrawal and deletion procedures remain unresolved.';
  const staffScope = 'This records staff activity and data-scope acknowledgment only. It is not youth or guardian consent, a paper signature, identity verification or an account link. Original encoder evidence remains separate.';
  const familyAges = 'Optional sibling birthdates may be stored when supplied. Ages are calculated using the server date in the Philippines. Older name-and-age answers remain without an invented birthdate.';
  return family ? {
    paragraphs: [
      ...(staff ? [staffScope] : []), familyAges,
      `${recipients} may review all profiling answers and, after approval, download private PDF or spreadsheet reports for selected sections: personal information; household and residency, including private contact, RBI and family answers; education and livelihood; family and participation; and voice and certification. Optional sibling birthdates are included with the household section.`,
      `These reports are private and must not be publicly released. ${limits}`,
    ],
    checkbox: staff ? 'I acknowledge the family information and private export scope for this staff-entered record, including optional sibling birthdates and approved-profile downloads by the chairperson, treasurer and secretary.' : 'I agree to the family information and private approved-profile export scope described above for the chairperson, treasurer and secretary.',
  } : {
    paragraphs: [
      staff ? `${recipients} may correct requested fields and required dependent answers after Needs changes, then resubmit the same registration.` : 'I agree that the chairperson, treasurer and secretary may review my submitted and corrected answers. When changes are requested, I may edit only requested answers and their required dependent answers, then resubmit the same registration.',
      history, ...(staff ? [staffScope] : []),
      'Corrected family answers may include optional sibling birthdates. These dates and earlier revisions remain private. Ages are recalculated using the server date in the Philippines. Full-section downloads require a separate family/export scope acknowledgment.',
      limits,
    ],
    checkbox: staff ? 'I acknowledge the attributed correction revisions and review history for this staff-entered record. This is my staff acknowledgment, not consent from a youth or guardian.' : 'I agree to retain and share correction revisions and review history with the chairperson, treasurer and secretary.',
  };
}
