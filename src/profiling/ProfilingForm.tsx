import StatusToast from '../demo/StatusToast';
import LoadingAction from '../demo/LoadingAction';
import { usePractice } from '../demo/PracticeStore';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { allFields, sections, visibleFields, siblingRows, displayAnswer, addressSuggestions, TALIPAPA_LOCALITY, type Answers, type Field } from './fields';
import { changeAnswer, hasDraftAnswers, normalizeMobile, profilingDate, syntheticAnswers, validate } from './validation';
import PrivacyGate from './PrivacyNotice';
import AddressAutocomplete from './AddressAutocomplete';
import YouthIcon from '../demo/YouthIcon';
import type { YouthStateV1 } from '../../contracts/v1/youth';
import { savedAnswers } from '../auth/saved-answers';
import SiblingBirthdateEditor from './SiblingBirthdateEditor';

export type SavedFormBinding = {
  record: Extract<YouthStateV1, { kind: 'draft' | 'submitted' }>;
  busy: boolean; uncertain: boolean; error: string; message: string;
  save: (answers: Answers, submit?: boolean) => Promise<void>;
  reload: () => Promise<void>;
  submissionNotice?: ReactNode;
  privacyAccepted?: boolean;
  writesBlocked?: boolean;
};


export default function ProfilingForm({ saved, siblingDates = false, serverDate, loading = false }: { loading?: boolean; saved?: SavedFormBinding; siblingDates?: boolean; serverDate?: string }) {
  const practice = usePractice();
  const formBusy = loading || Boolean(saved?.busy);
  const [certificationToast, setCertificationToast] = useState(0);
  const dismissCertificationToast = useCallback(() => setCertificationToast(0), []);
  const [pendingAction,setPendingAction] = useState<'save'|'submit'|null>(null);
  const formUncertain = Boolean(saved?.uncertain);
  const navigate = useNavigate();
  const existing = !loading && !saved && practice.signedIn ? practice.responses.find(response => response.key === practice.profileKey) : undefined;
  const correction = existing?.status === 'Needs changes' ? existing : undefined;
  const [params] = useSearchParams();
  const target = correction?.correctionFields?.includes(params.get('field') || '') ? params.get('field') : null;
  const [sentToStaff, setSentToStaff] = useState(false);
  const [referenceDate] = useState(() => serverDate || correction?.referenceDate || profilingDate());
  const [answers, setAnswers] = useState<Answers>((): Answers => saved ? { contactNumber: '+63', locality: TALIPAPA_LOCALITY, ...saved.record.answers, certification: '' } : correction ? { ...correction.answers, privacyConsent: '', certification: '', certificationAcceptedAt: '' } : { contactNumber: '+63', locality: TALIPAPA_LOCALITY });
  const [consented, setConsented] = useState(loading || Boolean(saved?.privacyAccepted));
  const [step, setStep] = useState(() => target ? Math.max(0, sections.findIndex(section => section.fields.some(field => field.id === target))) : 0);
  const [editingSection, setEditingSection] = useState(false);
  const [reviewCertification, setReviewCertification] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftMessage, setDraftMessage] = useState('');
  const [complete, setComplete] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const focusErrors = useRef(false);
  const mounted = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const focusFrame = useRef<number | null>(null);
  useEffect(() => {
    if (saved) setAnswers(previous => ({ contactNumber: '+63', locality: TALIPAPA_LOCALITY, ...saved.record.answers, certification: '', privacyConsent: previous.privacyConsent, privacyAcceptedAt: previous.privacyAcceptedAt, noticeVersion: previous.noticeVersion }));
  }, [saved?.record]);
  function centerFocusedField() {
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = null;
      const input = document.activeElement;
      if (!(input instanceof HTMLElement) || !form.current?.contains(input) || !input.matches('input:not([type="checkbox"]),select,textarea')) return;
      const field = input.closest('.sibling-row, .profile-field') as HTMLElement | null;
      if (!field) return;
      const viewport = window.visualViewport;
      let top = viewport?.offsetTop || 0;
      const bottom = top + (viewport?.height || window.innerHeight);
      const header = document.querySelector('.civic-header, .staff-sidebar')?.getBoundingClientRect();
      if (header && header.top <= top && header.height < (bottom - top) / 2) top = Math.max(top, header.bottom);
      const rect = field.getBoundingClientRect();
      const available = Math.max(32, bottom - top - 32);
      const desiredTop = top + 16 + (available - Math.min(rect.height, available)) / 2;
      if (Math.abs(rect.top - desiredTop) > 16) window.scrollBy({ top: rect.top - desiredTop, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }
  useEffect(() => {
    window.visualViewport?.addEventListener('resize', centerFocusedField);
    return () => { window.visualViewport?.removeEventListener('resize', centerFocusedField); if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current); };
  }, []);
  useEffect(() => {
    if (mounted.current && heading.current) {
      heading.current.focus({preventScroll: true});
      const header = document.querySelector('.civic-header')?.getBoundingClientRect();
      const offset = header && header.top <= 0 ? Math.max(0, header.bottom) : 0;
      window.scrollTo({top: Math.max(0, window.scrollY + heading.current.getBoundingClientRect().top - offset - 24), behavior: 'instant'});
    }
    mounted.current = true;
  }, [step, complete]);
  useEffect(() => {
    if (!focusErrors.current || !Object.keys(errors).length) return;
    focusErrors.current = false;
    const certification = errors.certification ? document.getElementById('certification') : null;
    if (certification) { certification.focus({preventScroll: true}); certification.scrollIntoView({block: 'center', behavior: 'instant'}); }
    else if (step === sections.length) errorSummary.current?.focus();
    else { const first = Object.keys(errors)[0]; document.getElementById(first === 'age' || first === 'ageGroup' ? 'birthdate' : first)?.focus(); }
  }, [errors]);
  useEffect(() => {
    if (!consented || !target) return;
    const frame = requestAnimationFrame(() => { const element = document.getElementById(target); element?.focus(); element?.scrollIntoView({ block: 'center', behavior: 'instant' }); });
    return () => cancelAnimationFrame(frame);
  }, [consented, target]);
  const review = step === sections.length;
  const summaryErrors = Object.entries(errors).filter(([id]) => id !== 'certification');
  function update(id: string, value: string) {
    if (formBusy || formUncertain) return;
    setDraftMessage('');
    setAnswers(previous => changeAnswer(previous, id, value, referenceDate));
    if (id === 'certification' && value === 'true') setCertificationToast(0);
    setErrors(previous => { const next = { ...previous }; delete next[id]; if (id === 'birthdate') { delete next.age; delete next.ageGroup; } return next; });
  }
  function advance() {
    if (formBusy || formUncertain) return;
    const prepared = saved ? { ...answers, ...savedAnswers(answers, profilingDate()) } : answers;
    const nextErrors = validate(prepared, saved ? profilingDate() : referenceDate, review ? allFields : sections[step].fields);
    if (saved) setAnswers(prepared);
    focusErrors.current = Object.keys(nextErrors).length > 0;
    setErrors(nextErrors);
    if (review && nextErrors.certification) setCertificationToast(value => value + 1);
    if (Object.keys(nextErrors).length) return;
    if (review) {
      if (saved) { setPendingAction('submit'); void saved.save(prepared, true).finally(() => setPendingAction(null)); return; }
      if (practice.signedIn) {
        if (correction) practice.resubmit(correction.key, answers);
        else practice.submit(answers, referenceDate);
        navigate('/youth/dashboard');
        return;
      }
      setComplete(true);
      setAnswers({});
    } else if (editingSection) {
      setEditingSection(false);
      setStep(sections.length);
    } else setStep(step + 1);
  }
  function edit(index: number) { if (formBusy || formUncertain) return; setErrors({}); if (review) setReviewCertification(true); setEditingSection(review); setStep(index); }
  function renderField(field: Field) {
    const error = errors[field.id];
    const hint = field.id === 'certification' ? ((reviewCertification || correction) && answers.certification !== 'true' ? 'Please check the box again to certify your updated answers before submitting.' : undefined) : field.hint;
    const describedBy = [hint && `${field.id}-hint`, error && `${field.id}-error`].filter(Boolean).join(' ') || undefined;
    const required = field.required || (['osyFrom', 'osyTo'].includes(field.id) && answers.isOsy === 'Yes');
    const common = { id: field.id, name: field.id, required, disabled: Boolean(formBusy || formUncertain), 'aria-invalid': Boolean(error), 'aria-describedby': describedBy };
    if (field.id === 'siblings') {
      const rows = siblingRows(answers.siblings);
      if (siblingDates) return <SiblingBirthdateEditor key={field.id} rows={rows} referenceDate={referenceDate} onChange={rows => update('siblings', JSON.stringify(rows))} disabled={formBusy || formUncertain} error={error} />;
      return <fieldset className="profile-field wide sibling-fields" key={field.id}><legend>{field.label} <span className="field-optional">(Optional)</span></legend><p id="siblings-hint" className="field-hint">{field.hint}</p>{rows.map((row, index) => <div className="sibling-row" key={index}><div><label htmlFor={index === 0 ? 'siblings' : `sibling-name-${index}`}>Sibling name {index + 1}</label><input id={index === 0 ? 'siblings' : `sibling-name-${index}`} value={row.name} aria-invalid={Boolean(error)} aria-describedby={describedBy} onChange={event => update('siblings', JSON.stringify(rows.map((item, i) => i === index ? { ...item, name: event.target.value } : item)))} /></div><div><label htmlFor={`sibling-age-${index}`}>Age</label><input id={`sibling-age-${index}`} type="number" min={0} max={120} value={row.age} onChange={event => update('siblings', JSON.stringify(rows.map((item, i) => i === index ? { ...item, age: event.target.value } : item)))} /></div><button className="text-button" type="button" aria-label={`Remove sibling ${index + 1}`} onClick={() => update('siblings', JSON.stringify(rows.length > 1 ? rows.filter((_, i) => i !== index) : [{ name: '', age: '' }]))}><YouthIcon name="close" /></button></div>)}<button className="secondary-button" type="button" onClick={() => update('siblings', JSON.stringify([...rows, { name: '', age: '' }]))}><YouthIcon name="plus" /> Add sibling</button>{error && <p className="field-error" id="siblings-error">{error}</p>}</fieldset>;
    }
    return <div className={`profile-field ${field.type === 'textarea' || field.type === 'checkbox' ? 'wide' : ''}`} key={field.id}>
      {field.type === 'checkbox' ? <label className="certification" htmlFor={field.id}>
        <input {...common} type="checkbox" checked={answers[field.id] === 'true'} onChange={event => update(field.id, event.target.checked ? 'true' : '')} />
        <span>{field.label} <span className="field-required" aria-hidden="true">*</span><span className="sr-only"> (Required)</span></span>
      </label> : <>
        <label htmlFor={field.id}>{field.label} {required ? <><span className="field-required" aria-hidden="true">*</span><span className="sr-only"> (Required)</span></> : <span className="field-optional">(Optional)</span>}</label>
        {['age', 'ageGroup', 'locality'].includes(field.id) ? <input {...common} readOnly value={answers[field.id] || ''} /> : field.type === 'select' ? <div className="profile-select"><select {...common} value={answers[field.id] || ''} onChange={event => update(field.id, event.target.value)}>
          <option value="">Select an answer</option>{field.options?.map(option => <option key={option}>{option}</option>)}
        </select><span className="field-dropdown-icon" aria-hidden="true"><YouthIcon name="chevron" /></span></div> : (field.id === 'street' || field.id === 'subdivision') ? <AddressAutocomplete {...common} value={answers[field.id] || ''} suggestions={addressSuggestions[field.id]} onChange={value => update(field.id, value)} /> : field.id === 'contactNumber' ? <div className="mobile-number-control"><span className="mobile-number-prefix">+63</span><input {...common} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} pattern="9[0-9]{9}" placeholder="9XXXXXXXXX" value={(answers.contactNumber || '').replace(/^\+63/, '')} onChange={event => update(field.id, '+63' + event.target.value.replace(/\D/g, ''))} onPaste={event => { event.preventDefault(); const text = event.clipboardData.getData('text'); const normalized = normalizeMobile(text); const digits = /^\+639\d{9}$/.test(normalized) ? normalized.slice(3) : text.replace(/\D/g, ''); update(field.id, '+63' + digits); }} /></div> : field.type === 'textarea' ? <textarea {...common} rows={3} value={answers[field.id] || ''} onChange={event => update(field.id, event.target.value)} /> :
          <input {...common} type={field.type || 'text'} inputMode={field.type === 'number' ? 'numeric' : undefined} min={field.id.startsWith('osy') ? 1900 : undefined} max={field.id.startsWith('osy') ? Number(referenceDate.slice(0, 4)) : field.type === 'date' ? referenceDate : undefined} step={field.type === 'number' ? 1 : undefined} value={answers[field.id] || ''} onInput={field.type === 'date' ? event => update(field.id, event.currentTarget.value) : undefined} onChange={field.type === 'date' ? undefined : event => update(field.id, event.target.value)} />}
      </>}
      <div className="field-feedback">
        {hint && <p className={field.id === 'certification' ? 'field-hint certification-hint-required' : 'field-hint'} id={`${field.id}-hint`}>{hint}</p>}
        {error && <p className="field-error" id={`${field.id}-error`}>{error}</p>}
      </div>
    </div>;
  }
  if (!loading && existing && !correction) return <Navigate to="/youth/dashboard" replace />;
  return <main id="main-content" className="container profiling-main" data-youth-loading={loading || undefined} aria-busy={formBusy} inert={loading || undefined}>
    {consented && !complete && (step > 0 || editingSection) ? <button className="back-link dashboard-back-link" type="button" disabled={formBusy || formUncertain} onClick={() => { setErrors({}); if (editingSection) { setEditingSection(false); setStep(sections.length); } else setStep(step - 1); }}>← Back</button> : <Link className="back-link dashboard-back-link" to={correction ? '/youth/profile' : '/youth'}>← Back</Link>}
    <div className="profiling-header">
      <h1>{correction ? 'Correct your youth profile' : 'Youth profiling'}</h1>
      <p>For Barangay Talipapa youth aged 15–30.</p>
    </div>
    {correction && <section className="correction-prompt"><h2>Changes requested</h2><p>{correction.note}</p><p>Your submitted answers are filled in below. Update them and confirm the certification again. The original profiling date is retained for the application.</p></section>}
    {!consented ? <PrivacyGate saved={Boolean(saved)} onAccept={receipt => { setAnswers(previous => ({ ...previous, ...receipt })); setConsented(true); }} /> : complete ? <section className="profile-card completion">
      <span className="eyebrow">Submission complete</span>
      <h2 tabIndex={-1} ref={heading}>Your practice submission is complete.</h2>
      <p>{sentToStaff ? "Your answers are available in the staff list in this tab until reload. Nothing was saved to a database or registered." : "No profile was saved. Your answers have been cleared."}</p>
      {sentToStaff && <Link className="button" to="/admin/youth/demo">View the response in the staff list →</Link>}
      <div className="form-actions"><button className="button" onClick={() => { setComplete(false); setSentToStaff(false); setStep(0); setAnswers({ contactNumber: '+63', locality: TALIPAPA_LOCALITY }); setConsented(false); setErrors({}); }}>Start another practice form</button><Link to="/youth">Return to Youth &amp; Community</Link></div>
    </section> : <>
      <div className="profile-layout">
        <aside className="profile-sidebar" aria-label="Form progress">
          <p className="progress-caption">Step {step + 1} of {sections.length + 1}</p>
          <ol>{[...sections.map(section => section.title), 'Review answers'].map((title, index) => <li key={title} aria-current={step === index ? 'step' : undefined} className={index < step ? 'finished' : ''}>
            <span className="step-number">{index + 1}</span><span>{title}</span>
          </li>)}</ol>
          <div className="profile-sidebar-footer"><p className="field-hint">Profiling date: {referenceDate}</p>
          <button className="demo-fill" type="button" disabled={formBusy || formUncertain} onClick={() => { setAnswers(previous => ({ ...syntheticAnswers(referenceDate), privacyConsent: previous.privacyConsent, privacyAcceptedAt: previous.privacyAcceptedAt, noticeVersion: previous.noticeVersion })); setStep(0); setEditingSection(false); setErrors({}); setDraftMessage(''); }}>Autofill form</button></div>
        </aside>
        <form ref={form} className="profile-card" noValidate autoComplete="off" onFocusCapture={centerFocusedField} onSubmit={event => { event.preventDefault(); advance(); }}>
          <div className="profiling-section-heading">
            <h2 tabIndex={-1} ref={heading}>{review ? 'Review your answers' : sections[step].title}</h2>
            {!review && <span className="eyebrow">Section {step + 1}</span>}
          </div>
          {saved?.error && <p className="auth-error" role="alert">{saved.error}</p>}
          {saved?.message && <p role="status">{saved.message}</p>}
          {review && saved?.submissionNotice}
          {formUncertain && <p role="status">Save or submission outcome unknown. Inputs are locked. Check saved record or retry the same submission.</p>}
          {editingSection && <p className="edit-notice">Editing this section only. Continue to return directly to your review; your other answers stay in place.</p>}
          {review && summaryErrors.length > 0 && <div className="error-summary" ref={errorSummary} tabIndex={-1} role="alert">
            <strong>Please check {summaryErrors.length} answer(s).</strong>
            <ul>{summaryErrors.map(([id, message]) => <li key={id}><a href={`#${id}`} onClick={event => { event.preventDefault(); if (review) { const index = sections.findIndex(section => section.fields.some(field => field.id === id)); if (index >= 0) { edit(index); requestAnimationFrame(() => document.getElementById(id)?.focus()); } } else document.getElementById(id)?.focus(); }}>{allFields.find(field => field.id === id)?.label}: {message}</a></li>)}</ul>
          </div>}
          {review ? <div className="review-sections">{sections.map((section, index) => <section key={section.title}>
            <div className="review-heading"><h3>{section.title}</h3><button className="text-button" type="button" onClick={() => edit(index)} aria-label={`Edit ${section.title}`}>Edit</button></div>
            <dl>{visibleFields(section.fields, answers).map(field => <div className={field.type === 'textarea' || field.type === 'checkbox' ? 'wide' : ''} key={field.id}><dt>{field.type === 'checkbox' && (reviewCertification || answers[field.id] !== 'true') ? 'Confirm your updated answers' : field.label}</dt><dd>{field.type === 'checkbox' ? reviewCertification || answers[field.id] !== 'true' ? renderField(field) : 'Accepted' : displayAnswer(field.id, answers)}</dd></div>)}</dl>
          </section>)}</div> : <div className="profile-fields">{visibleFields(sections[step].fields, answers).map(renderField)}</div>}
          {certificationToast > 0 && <StatusToast key={certificationToast} pending message="Please check the certification box again after editing your answers, then submit your profile." onClose={dismissCertificationToast} />}
          {draftMessage && <p className="field-error" role="alert">{draftMessage}</p>}
          <div className="form-actions" aria-busy={formBusy}>
            {(saved || loading) && <LoadingAction className="secondary-button" type="button" busy={pendingAction === 'save' && formBusy} disabled={formBusy || saved?.uncertain || saved?.writesBlocked} onClick={() => { if (!saved) return; if (!hasDraftAnswers(answers)) { setDraftMessage('Please fill in at least one answer before saving your draft.'); return; } setDraftMessage(''); setPendingAction('save'); void saved.save(answers).finally(() => setPendingAction(null)); }}>Save draft</LoadingAction>}
            {!formUncertain && <LoadingAction busy={pendingAction === 'submit' && formBusy} disabled={formBusy || (review && saved?.writesBlocked)} type="submit">{review ? correction ? 'Resubmit corrected profile' : saved || practice.signedIn ? 'Submit profile' : 'Submit answers' : editingSection ? 'Return to review' : step === sections.length - 1 ? 'Review answers' : 'Continue'} <span aria-hidden="true">→</span></LoadingAction>}
            {formUncertain && <LoadingAction busy={formBusy} type="button" onClick={() => { void saved?.save(answers, true); }}>{saved ? 'Retry same operation' : 'Retry same submission'}</LoadingAction>}
          </div>
          {review && !saved && !practice.signedIn && <div className="practice-transfer"><h3>Try the staff-review journey</h3><p>Send these answers to the staff list in this tab. They disappear on reload and are visible without login.</p><button className="secondary-button" type="button" onClick={() => { const nextErrors = validate(answers, referenceDate); setErrors(nextErrors); if (Object.keys(nextErrors).length) return; practice.submit(answers, referenceDate); setSentToStaff(true); setComplete(true); setAnswers({}); }}>Send answers for review</button></div>}
        </form>
      </div>
    </>}
  </main>;
}
