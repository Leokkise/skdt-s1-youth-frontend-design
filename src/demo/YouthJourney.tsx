import { Link } from 'react-router-dom';
import { SkeletonText } from './StaffLoading';
import { displayLabel } from '../presentation-copy';
import { type ReviewStatus } from './presentationWorkflow';
import YouthIcon from './YouthIcon';

export const journeySteps = [
  ['Account', 'Create an account, then sign in.'],
  ['Youth profiling', 'Complete the five sections about yourself.'],
  ['Review & submit', 'Check your answers and confirm they are accurate.'],
  ['Staff review', 'Check your dashboard for the decision or requested changes.'],
  ['Join events', 'After review, explore youth events when event services are connected.'],
];

export default function YouthJourney({ status, loading = false, correctionPath = '/youth/profile' }: { correctionPath?: string; loading?: boolean; status?: ReviewStatus | 'unavailable' }) {
  const submitted = Boolean(status), changes = status === 'Needs changes';
  const approved = status === 'Approved (demo)', rejected = status === 'Rejected (demo)';
  const final = approved || rejected;
  const reviewState = approved ? 'approved' : rejected ? 'rejected' : changes ? 'needs_changes' : status === 'For review' ? 'pending_review' : 'draft';
  const outcomeLabel = approved ? 'Approved' : rejected ? 'Rejected' : changes ? 'Needs changes' : status === 'For review' ? 'Pending review' : status === 'unavailable' ? 'Status unavailable' : 'Ready to complete';
  const current = !submitted || changes ? 1 : final ? 3 : 2;
  const steps = [
    ['Account', 'Signed in'],
    ['Youth profiling', changes ? 'Update requested answers' : submitted ? 'Submitted' : 'Complete and submit your profile'],
    ['Staff review', status === 'unavailable' ? 'Status unavailable — open My profile' : changes ? 'After resubmission' : final ? 'Review completed' : submitted ? 'Awaiting staff review' : 'After submission'],
    ['Review outcome', final ? status === 'Approved (demo)' ? 'Approved' : 'Rejected — read the staff note' : changes ? 'Changes requested' : 'Awaiting a decision'],
  ];
  return <section className="youth-journey" data-review-state={reviewState} data-status={changes ? 'needs-changes' : undefined} aria-labelledby="journey-title" aria-hidden={loading || undefined} inert={loading || undefined}>
    <div className="journey-heading"><h2 id="journey-title">{changes ? 'Your profile needs changes' : 'Your profiling progress'}</h2><span className="journey-outcome"><YouthIcon name={approved ? 'check' : rejected ? 'close' : changes ? 'edit' : 'clock'} />{outcomeLabel}</span><p>{changes ? 'Staff requested updates to your profile. Read the notes, correct your answers, then resubmit.' : approved ? 'Your profile is approved. You can view your profile and open your Digital Youth ID below.' : rejected ? 'Your profile was rejected. Open My profile to read the staff explanation.' : submitted ? 'Your profile is submitted. Follow its review progress here.' : 'Complete and submit your profile to open your youth dashboard.'}</p>{changes && <Link className="button journey-correction-action" to={correctionPath}><YouthIcon name="edit" />Update requested answers<YouthIcon name="arrow" /></Link>}</div>
    <ol>{steps.map(([title, detail], index) => <li key={title} className={index < current || final ? 'is-complete' : index === current ? 'is-current' : ''} aria-current={index === current ? 'step' : undefined}>
      <span className="journey-marker">{index === 3 && rejected ? <YouthIcon name="close" /> : index === 3 && changes ? <YouthIcon name="edit" /> : index < current || final ? <YouthIcon name="check" /> : index + 1}</span><div><strong>{displayLabel(title)}</strong><span>{loading ? <SkeletonText>{detail}</SkeletonText> : detail}</span></div>
    </li>)}</ol>
  </section>;
}
