import YouthIcon from './YouthIcon';
import { useEffect, useId, useRef, useState } from 'react';
import { displayReviewAnswer, visibleFields, type Answers, type Field } from '../profiling/fields';
import { SkeletonText } from './StaffLoading';

export default function ReviewSection({ section, answers, targets = [], initiallyOpen = true, loading = false }: { section: { title: string; fields: Field[] }; answers: Answers; targets?: {fieldId: string; note: string}[]; initiallyOpen?: boolean; loading?: boolean }) {
  const id = useId();
  const [open, setOpen] = useState(initiallyOpen);
  const toggledByUser = useRef(false);
  const toggle = () => { toggledByUser.current = true; setOpen(value => !value); };
  const element = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open || !toggledByUser.current) return;
    const frame = requestAnimationFrame(() => {
      const section = element.current;
      const dialog = section?.closest('dialog');
      if (!section || !dialog) return;
      const rect = section.getBoundingClientRect();
      const viewport = dialog.getBoundingClientRect();
      const available = dialog.clientHeight - 32;
      const target = viewport.top + 16 + (available - Math.min(rect.height, available)) / 2;
      dialog.scrollTo({ top: dialog.scrollTop + rect.top - target, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);
  return <section ref={element} className="staff-answer-section" onClick={event => { if (window.getSelection()?.toString() || (event.target as HTMLElement).closest('button,a,input,select,textarea')) return; toggle(); }}>
    <button className="staff-answer-toggle" type="button" disabled={loading} aria-expanded={open} aria-controls={id} onClick={toggle}><span className={open ? "disclosure-icon is-open" : "disclosure-icon"}><YouthIcon name="chevron" /></span>{section.title}</button>
    {open && <div id={id} className="staff-answer-body"><dl>{visibleFields(section.fields, answers).map(field => <div id={`review-answer-${field.id}`} key={field.id} data-correction={targets.some(target => target.fieldId === field.id) || undefined} className={field.type === 'textarea' || field.type === 'checkbox' ? 'wide' : undefined}><dt>{field.label}</dt><dd>{loading ? <SkeletonText>{field.type === 'checkbox' ? 'Not checked' : displayReviewAnswer(field, answers)}</SkeletonText> : displayReviewAnswer(field, answers)}</dd>{targets.filter(target => target.fieldId === field.id).map(target => <dd className="answer-correction-note" key={target.fieldId}><strong>Staff note for {field.label}:</strong>{target.note}</dd>)}</div>)}</dl></div>}
  </section>;
}
