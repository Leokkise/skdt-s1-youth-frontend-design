import { useId } from 'react';
import YouthIcon from '../demo/YouthIcon';
import { ageAt } from './validation';

export type SiblingBirthdateRow = { name: string; birthdate?: string; age: string };
export default function SiblingBirthdateEditor({ rows, referenceDate, onChange, disabled = false }: {
  rows: SiblingBirthdateRow[]; referenceDate: string; onChange: (rows: SiblingBirthdateRow[]) => void; disabled?: boolean;
}) {
  const id = useId();
  function change(index: number, patch: Partial<SiblingBirthdateRow>) {
    onChange(rows.map((row, position) => {
      if (position !== index) return row;
      const next = { ...row, ...patch };
      if ('birthdate' in patch) { const age = ageAt(next.birthdate || '', referenceDate); next.age = age === null ? '' : String(age); }
      return next;
    }));
  }
  return <fieldset className="profile-field wide sibling-fields" disabled={disabled}><legend>Siblings <span className="field-optional">(Optional)</span></legend>
    {rows.map((row, index) => <div className="sibling-row sibling-birthdate-row" key={index}>
      <div className="profile-field"><label htmlFor={`${id}-name-${index}`}>Sibling name {index + 1}</label><input id={`${id}-name-${index}`} value={row.name} onChange={event => change(index, { name: event.target.value })} /></div>
      <div className="profile-field"><label htmlFor={`${id}-birthdate-${index}`}>Birthdate</label><input id={`${id}-birthdate-${index}`} type="date" max={referenceDate} value={row.birthdate || ''} onChange={event => change(index, { birthdate: event.target.value })} /></div>
      <div className="profile-field"><label htmlFor={`${id}-age-${index}`}>Age</label><input id={`${id}-age-${index}`} type="text" inputMode="numeric" readOnly value={row.birthdate ? String(ageAt(row.birthdate, referenceDate) ?? '') : row.age} /></div>
      <button className="text-button" type="button" aria-label={`Remove sibling ${index + 1}`} onClick={() => onChange(rows.length > 1 ? rows.filter((_, position) => position !== index) : [{ name: '', birthdate: '', age: '' }])}><YouthIcon name="close" /></button>
    </div>)}
    <button className="secondary-button" type="button" disabled={rows.length >= 20} onClick={() => onChange([...rows, { name: '', birthdate: '', age: '' }])}><YouthIcon name="plus" />Add sibling</button>
  </fieldset>;
}
