import { useEffect, useRef, useState, type ReactNode } from 'react';
import AnalyticsDialog from './AnalyticsDialog';
import { PROFILE_EXPORT_SECTIONS, ProfileExportError, buildApprovedProfileExport, type ApprovedExportSource } from './approvedProfileExport';
import type { LoadedApprovedProfiles } from './RegistryExport';

export default function ApprovedProfileSectionExport({ count, load, onClose, scopeControls, scopeLabel, unavailableReason }: {
  scopeControls?: ReactNode; scopeLabel?: string; unavailableReason?: string; count: number; load: (sections: string[]) => Promise<LoadedApprovedProfiles>; onClose: () => void;
}) {
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const [selected, setSelected] = useState<string[]>(PROFILE_EXPORT_SECTIONS.map(section => section.id));
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  async function download() {
    if (busy || !selected.length || !count) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const loaded = await load(selected);
      const records: ApprovedExportSource[] = Array.isArray(loaded) ? loaded : loaded.records;
      if (!live.current) return;
      if (records.length !== count) throw new Error('The approved selection changed. Reload the registry and try again.');
      const report = buildApprovedProfileExport(records, selected, undefined, scopeLabel);
      const {approvedProfilesPdf,approvedProfilesExcel} = await import('./approvedProfileExportFiles');
      const bytes = await (format === 'pdf' ? approvedProfilesPdf(report) : approvedProfilesExcel(report));
      if (!live.current) return;
      if (!Array.isArray(loaded)) await loaded.revalidate();
      if (!live.current) return;
      const url=URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer],{type:format==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
      const link=document.createElement('a');link.href=url;link.download=`approved-youth-profiles.${format}`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);setMessage('Download started.');
    } catch (failure) { setError(failure instanceof ProfileExportError || (failure instanceof Error && failure.message === 'The approved selection changed. Reload the registry and try again.') ? failure.message : 'Profiles could not be exported. Check access and reload the approved selection.'); }
    finally {setBusy(false);}
  }
  return <AnalyticsDialog compact title="Export approved profiles" onClose={onClose}>
    <p>{count} approved {count===1?'profile':'profiles'} in the current selection.</p>
    <div inert={busy || undefined}>{scopeControls}</div>
    <fieldset className="export-modules profile-export-sections" disabled={busy}><legend>Sections to include</legend><div>{PROFILE_EXPORT_SECTIONS.map(section=><section className="profile-export-section" key={section.id} data-selected={selected.includes(section.id)}><label><input type="checkbox" checked={selected.includes(section.id)} onChange={event=>setSelected(previous=>event.target.checked?[...previous,section.id]:previous.filter(id=>id!==section.id))}/><strong>{section.title}</strong></label><p>{section.fields.map(field=>field.label).join(' · ')}</p></section>)}</div></fieldset>
    <p className="field-hint">All sections are selected by default. Registration No. and profile name are included for each record.</p>
    <fieldset className="export-formats" disabled={busy}><legend>File format</legend><label><input type="radio" name="profile-export-format" checked={format==='pdf'} onChange={()=>setFormat('pdf')}/>PDF · Profiles grouped by section</label><label><input type="radio" name="profile-export-format" checked={format==='xlsx'} onChange={()=>setFormat('xlsx')}/>Excel · One worksheet per section</label></fieldset>
    {unavailableReason && <p className="field-hint" role="status">{unavailableReason}</p>}
    {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
    <footer className="export-actions"><button type="button" className="secondary-button" disabled={busy} onClick={onClose}>Cancel</button><button type="button" className="button" disabled={busy||!selected.length||!count||Boolean(unavailableReason)} onClick={()=>{void download();}}>{busy?'Preparing profiles…':`Download ${format==='pdf'?'PDF':'Excel'}`}</button></footer>
  </AnalyticsDialog>;
}
