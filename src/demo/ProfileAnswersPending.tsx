import { sections, type Answers } from '../profiling/fields';
import ReviewSection from './ReviewSection';

export default function ProfileAnswersPending({ label, answers = {} }: { label: string; answers?: Answers }) {
  return <div role="status" aria-label={label}>
    <span className="sr-only">{label}</span>
    <div className="review-sections" aria-hidden="true" inert>{sections.map(section => <ReviewSection key={section.title} section={section} answers={answers} loading />)}</div>
  </div>;
}
