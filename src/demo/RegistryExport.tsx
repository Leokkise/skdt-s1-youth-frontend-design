import { useState } from 'react';
import type { SampleRecord } from './registryData';
import { approvedRosterRecords, rosterPeriodLabel, type RosterFilters } from './registryRoster';
import ApprovedProfileSectionExport from './ApprovedProfileSectionExport';
import type { ApprovedExportSource } from './approvedProfileExport';

export type LoadedApprovedProfiles = ApprovedExportSource[] | {records: ApprovedExportSource[]; revalidate: () => Promise<void>};
export type ApprovedProfileLoader = (records: SampleRecord[], sections: string[]) => Promise<LoadedApprovedProfiles>;
export default function RegistryExport({ records, filters, selectedKeys, referenceDate, onClose, loadProfiles, exportNotice }: {
  records: SampleRecord[]; filters: RosterFilters; selectedKeys: string[]; referenceDate: string; onClose: () => void; loadProfiles?: ApprovedProfileLoader; exportNotice?: import('react').ReactNode;
}) {
  const [scope, setScope] = useState<'all' | 'selected'>(selectedKeys.length ? 'selected' : 'all');
  const matching = approvedRosterRecords(records, filters, referenceDate);
  const selected = matching.filter(record => selectedKeys.includes(record.key));
  const included = scope === 'all' ? matching : selected;
  const timeframe = `${rosterPeriodLabel(filters)} · ${filters.band}`;
  return <ApprovedProfileSectionExport count={included.length} onClose={onClose}
    scopeLabel={`${timeframe} · ${scope === 'all' ? 'All matching approved youth' : 'Selected rows'} (${included.length})`}
    unavailableReason={!loadProfiles ? 'Full-section downloads are not enabled on this server yet.' : undefined}
    load={async sections => { if (!loadProfiles) throw new Error('Full-section export unavailable.'); return loadProfiles(included, sections); }}
    scopeControls={<><p className="field-hint">{timeframe}. Search and age filters apply.</p><fieldset className="export-formats"><legend>Which records?</legend><label data-selected={scope==='all'}><input type="radio" name="approved-profile-scope" checked={scope==='all'} onChange={()=>setScope('all')}/>All matching approved youth ({matching.length})</label><label data-selected={scope==='selected'}><input type="radio" name="approved-profile-scope" checked={scope==='selected'} disabled={!selected.length} onChange={()=>setScope('selected')}/>Selected rows ({selected.length})</label></fieldset>{exportNotice}</>}
  />;
}
