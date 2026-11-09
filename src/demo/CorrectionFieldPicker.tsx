import { useId, useState } from 'react';
import { displayAnswer, sections, visibleFields, type Answers } from '../profiling/fields';

// Local UI draft only; the accepted server adapter must validate and persist each target.
export type CorrectionNoteDraft = { fieldId: string; note: string };
export default function CorrectionFieldPicker({ answers, allowedFieldIds, value, onChange, disabled = false }: {
  answers: Answers; allowedFieldIds: readonly string[]; value: CorrectionNoteDraft[];
  onChange: (value: CorrectionNoteDraft[]) => void; disabled?: boolean;
}) {
  const id = useId();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => Object.fromEntries(sections.map(section => [section.title, section.fields.some(field => value.some(item => item.fieldId === field.id))])));
  function change(fieldId: string, note: string | null) {
    const rest = value.filter(item => item.fieldId !== fieldId);
    onChange(note === null ? rest : [...rest, { fieldId, note }]);
  }
  return <fieldset className="correction-field-picker" disabled={disabled}>
    <legend>Choose answers that need changes</legend>
    <p>Select each answer, then explain exactly what the youth should correct.</p>
    {sections.map((section, index) => {
      const fields = visibleFields(section.fields, answers).filter(field => allowedFieldIds.includes(field.id));
      if (!fields.length) return null;
      const count = fields.filter(field => value.some(item => item.fieldId === field.id)).length;
      return <details key={section.title} open={expanded[section.title]} onToggle={event => {
        const open = event.currentTarget.open;
        setExpanded(previous => previous[section.title] === open ? previous : { ...previous, [section.title]: open });
      }}>
        <summary>{section.title}<span>{count ? `${count} selected` : 'Select answers'}</span></summary>
        <div className="correction-target-grid">{fields.map(field => {
          const selected = value.find(item => item.fieldId === field.id);
          const noteId = `${id}-${index}-${field.id}`;
          return <div className="correction-target" key={field.id} data-selected={Boolean(selected)} data-wide={field.type === 'textarea'} onClick={event => {
            if (disabled || event.currentTarget.closest('fieldset:disabled') || (event.target as Element).closest('label, input, textarea, button, a, .profile-field')) return;
            event.currentTarget.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
          }}>
            <label className="correction-target-choice"><input type="checkbox" checked={Boolean(selected)} onChange={event => change(field.id, event.target.checked ? '' : null)} /><span>{field.label}</span></label>
            <p className="correction-current-answer"><span>Current answer</span>{displayAnswer(field.id, answers)}</p>
            {selected && <div className="profile-field"><label htmlFor={noteId}>What needs to change?</label><textarea id={noteId} value={selected.note} required maxLength={1000} rows={2} onChange={event => change(field.id, event.target.value)} placeholder="Explain the correction for this answer" /></div>}
          </div>;
        })}</div>
      </details>;
    })}
    <p role="status">{value.length} {value.length === 1 ? 'answer selected' : 'answers selected'}</p>
  </fieldset>;
}
