import LoadingAction from '../demo/LoadingAction';
import { useEffect, useRef, useState } from 'react';
import type { CorrectionDetailV1 } from '../../contracts/v1/youth-corrections';
import { sections, visibleFields, siblingRows, type Answers } from '../profiling/fields';
import { changeAnswer, normalizeMobile, validate } from '../profiling/validation';
import SiblingBirthdateEditor from '../profiling/SiblingBirthdateEditor';
import { siblingBirthdateError } from '../profiling/sibling-birthdate';
import RevisionNotice from './RevisionNotice';
import { correctionService, acknowledgmentService } from './review-services';
import { useYouthAuth } from './AuthProvider';

export default function CorrectionEditor({ detail, staff = false, serverDate, siblingDates, reload, denied }: {
  detail: CorrectionDetailV1; staff?: boolean; serverDate: string; siblingDates: boolean; reload: () => void; denied: () => void;
}) {
  const { checking } = useYouthAuth();
  const editor = useRef<HTMLElement>(null);
  useEffect(() => {
    let frame = 0;
    function revealField() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const input = document.activeElement;
        if (!window.matchMedia('(max-width: 800px)').matches || !(input instanceof HTMLElement) || !editor.current?.contains(input) || !input.matches('input:not([type="checkbox"]),select,textarea')) return;
        const viewport = window.visualViewport;
        let top = viewport?.offsetTop || 0;
        const bottom = top + (viewport?.height || window.innerHeight);
        const header = document.querySelector('.civic-header')?.getBoundingClientRect();
        if (header && header.top <= top) top = Math.max(top, header.bottom);
        const rect = input.getBoundingClientRect();
        const desiredTop = top + Math.max(16, (bottom - top - rect.height) / 2);
        if (Math.abs(rect.top - desiredTop) > 16) window.scrollBy({top: rect.top - desiredTop, behavior: 'instant'});
      });
    }
    const element = editor.current;
    element?.addEventListener('focusin', revealField);
    window.visualViewport?.addEventListener('resize', revealField);
    return () => { cancelAnimationFrame(frame); element?.removeEventListener('focusin', revealField); window.visualViewport?.removeEventListener('resize', revealField); };
  }, []);
  const [answers, setAnswers] = useState<Answers>(detail.draft?.answers || {});
  const [accepted, setAccepted] = useState(false), [certified, setCertified] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [unconfirmed,setUnconfirmed] = useState(false);
  const pending = useRef<{kind: 'save' | 'submit'; requestId: string; patch: Answers; version: number} | null>(null), live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  if (!detail.draft || detail.status !== 'needs_changes') return null;
  const targets = detail.decision?.targets || [];
  const ids = new Set(detail.editableFieldIds);
  // Only these direct dependents are permitted by the reviewed server contract.
  if (targets.some(target => target.fieldId === 'gender') && answers.gender === 'LGBTQIA+') ids.add('lgbtqiaDetails');
  if (targets.some(target => target.fieldId === 'isOsy') && answers.isOsy === 'Yes') { ids.add('osyFrom'); ids.add('osyTo'); }
  const editable = visibleFields(sections.flatMap(section => section.fields), answers).filter(field => ids.has(field.id));
  const patch = Object.fromEntries(editable.filter(field => answers[field.id] !== detail.draft!.answers[field.id]).map(field => [field.id, answers[field.id] || '']));
  const dirty = Object.keys(patch).length > 0;
  function update(id: string, value: string) { setAnswers(previous => changeAnswer(previous, id, id === 'contactNumber' ? normalizeMobile(value) : value, serverDate)); setCertified(false); setError(''); }
  async function act() {
    if (!correctionService || (!staff && !acknowledgmentService) || !detail.draft || busy || checking) return;
    if (!pending.current) {

      if ((staff && !accepted) || !certified) { setError('Confirm accuracy and acknowledge any required notice before resubmitting.'); return; }
      const errors = validate({...answers, certification: 'true'}, serverDate, editable);
      const siblingError = ids.has('siblings') && siblingDates ? siblingBirthdateError(siblingRows(answers.siblings), serverDate) : '';
      if (Object.keys(errors).length || siblingError) { setError(siblingError || Object.values(errors)[0]); return; }
      pending.current = {kind: dirty ? 'save' : 'submit', requestId: crypto.randomUUID(), patch, version: detail.draft.version};
    }
    const attempt = pending.current;
    setBusy(true); setError('');
    let result = attempt.kind === 'save'
      ? await (staff ? correctionService.staffSave(detail.responseId, detail.answerRevision, attempt.version, attempt.patch, attempt.requestId) : correctionService.save(detail.answerRevision, attempt.version, attempt.patch, attempt.requestId))
      : await (staff ? correctionService.staffResubmit(detail.responseId, detail.answerRevision, attempt.version, attempt.requestId, true, true) : acknowledgmentService!.resubmit(detail.answerRevision, attempt.version, attempt.requestId, certified));
    if (!live.current) return;
    if (attempt.kind === 'save' && result.kind === 'ok') {
      // Retain the acknowledged version and request ID when resubmission needs a retry.
      attempt.kind = 'submit'; attempt.version = result.data.draftVersion; attempt.requestId = crypto.randomUUID();
      result = await (staff
        ? correctionService.staffResubmit(detail.responseId, detail.answerRevision, attempt.version, attempt.requestId, true, true)
        : acknowledgmentService!.resubmit(detail.answerRevision, attempt.version, attempt.requestId, certified));
      if (!live.current) return;
    }
    setBusy(false);
    if (result.kind === 'unavailable') { setUnconfirmed(true); setError('The result is unconfirmed. Retry the same operation before changing these answers.'); return; }
    pending.current = null; setUnconfirmed(false);
    if (result.kind === 'ok' || result.kind === 'conflict') reload();
    else if (result.kind === 'denied') denied();
    else setError('The server did not accept these answers. Check the requested fields and reload if needed.');
  }
  return <section ref={editor} className="correction-editor"><h3>{staff ? 'Correct this walk-in profile' : 'Requested corrections'}</h3><p>Follow the staff notes to correct your answers, confirm accuracy, then resubmit for review.</p>
    {error && <p role="alert" className="auth-error">{error}</p>}
    <fieldset className="auth-fields" disabled={busy || checking || Boolean(pending.current)}>
      {sections.map(section => { const fields = editable.filter(field => section.fields.some(item => item.id === field.id)); if (!fields.length) return null;
        return <section key={section.title} className="correction-editor-section"><h4>{section.title}</h4><div className="profile-fields">{fields.map(field => {
          const target = targets.find(target => target.fieldId === field.id);
          return <div className={`profile-field ${field.type === 'textarea' ? 'wide' : ''}`} key={field.id}>
            <div className="correction-field-heading"><label htmlFor={`correct-${field.id}`}>{field.label}</label><p id={`correct-note-${field.id}`} className="answer-correction-note"><strong>{target ? `Staff note for ${field.label}:` : 'Related answer:'}</strong>{target?.note || 'Required by the requested change above.'}</p></div>
            {field.id === 'siblings' && siblingDates ? <SiblingBirthdateEditor rows={siblingRows(answers.siblings)} referenceDate={serverDate} onChange={rows => update('siblings', JSON.stringify(rows))} />
              : field.options ? <select id={`correct-${field.id}`} aria-describedby={`correct-note-${field.id}`} value={answers[field.id] || ''} onChange={event => update(field.id, event.target.value)}><option value="">Select an answer</option>{field.options.map(option => <option key={option}>{option}</option>)}</select>
              : field.type === 'textarea' ? <textarea id={`correct-${field.id}`} aria-describedby={`correct-note-${field.id}`} rows={3} value={answers[field.id] || ''} onChange={event => update(field.id, event.target.value)} />
              : <input id={`correct-${field.id}`} aria-describedby={`correct-note-${field.id}`} type={field.type || 'text'} max={field.type === 'date' ? serverDate : undefined} value={answers[field.id] || ''} onChange={event => update(field.id, event.target.value)} />}
          </div>;
        })}</div></section>;
      })}
      {staff && <RevisionNotice staff accepted={accepted} onChange={setAccepted} />}
      <label className="review-sharing-choice"><input type="checkbox" checked={certified} onChange={event => setCertified(event.target.checked)} />These corrections are accurate to the best of my knowledge.</label>
    </fieldset>
    <div className="form-actions"><LoadingAction busy={busy} disabled={busy || checking || (!pending.current && ((staff && !accepted) || !certified))} onClick={() => { void act(); }}>{unconfirmed ? 'Retry resubmission' : 'Resubmit for review'}</LoadingAction></div>
  </section>;
}

export function WalkinCorrection({ detail, serverDate, siblingDates, reload, denied }: {detail: CorrectionDetailV1; serverDate: string; siblingDates: boolean; reload: () => void; denied: () => void}) {
  const [editing, setEditing] = useState<CorrectionDetailV1 | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  async function load() {
    if (!correctionService || busy) return;
    setEditing(null); setBusy(true); setError('');
    const result = await correctionService.staffEdit(detail.responseId);
    if (!live.current) return;
    setBusy(false);
    if (result.kind === 'ok') { setEditing(result.data); if (!result.data.draft) reload(); }
    else if (result.kind === 'denied') denied();
    else setError('The returned walk-in profile could not be loaded. Retry the editor.');
  }
  if (detail.source === 'self_service' || detail.status !== 'needs_changes') return null;
  return <>{error && <p role="alert">{error}</p>}{editing?.draft ? <CorrectionEditor key={`${editing.answerRevision}-${editing.draft.version}`} detail={editing} staff serverDate={serverDate} siblingDates={siblingDates} reload={() => { void load(); }} denied={denied} /> : <div className="form-actions"><button className="button" disabled={busy} onClick={() => { void load(); }}>{busy ? 'Loading corrections…' : 'Correct requested walk-in answers'}</button></div>}</>;
}
