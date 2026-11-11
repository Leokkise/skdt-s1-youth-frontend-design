import useAutoRefresh from './useAutoRefresh';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RegistryDetailV3, WorkflowPageV1 } from '../../contracts/v1/youth-workflow';
import type { ReviewResultV2 } from '../../contracts/v1/youth-review-v2';
import type { StaffCursorV1 } from '../../contracts/v1/youth-staff';
import type { SampleRecord } from '../demo/registryData';
import StaffDashboard from '../demo/StaffDashboard';
import { RegistryDemo } from '../demo/DemoPages';
import AdminLayout from '../demo/AdminLayout';
import StaffActivity from './StaffActivity';
import DashboardRecovery from './DashboardRecovery';
import { workflowService, correctionService, familyService } from './review-services';
import { analyticsRecord, registryRecord } from './staff-records';
import type { YouthRevisionOptionsV1, ProfileSectionV1 } from '../../contracts/v1/youth-family-export';
import type { CorrectionDetailV1 } from '../../contracts/v1/youth-corrections';
import type { ApprovedProfileLoader } from '../demo/RegistryExport';
import CorrectionReview from './CorrectionReview';
import CorrectionEnrollment from './CorrectionEnrollment';
import { useYouthAuth } from './AuthProvider';
import { WalkinCorrection } from './CorrectionEditor';
import { profileExportFailure } from '../demo/approvedProfileExport';

async function pages<T>(read: (limit: number, cursor?: StaffCursorV1) => Promise<ReviewResultV2<WorkflowPageV1<T>>>) {
  const items: T[] = [], seen = new Set<string>();
  let cursor: StaffCursorV1 | undefined;
  do {
    const result = await read(50, cursor);
    if (result.kind !== 'ok') throw new Error(result.kind);
    items.push(...result.data.items);
    cursor = result.data.nextCursor || undefined;
    if (cursor) {
      const key = cursor.submittedAt + cursor.responseId;
      if (seen.has(key)) throw new Error('unavailable');
      seen.add(key);
    }
  } while (cursor);
  return items;
}

export default function DatabaseStaffScreens({ view }: { view: 'dashboard' | 'registry' | 'reports' }) {
  const { checking, signingOut } = useYouthAuth();
  const accessChecking = useRef(false); accessChecking.current = checking || signingOut;
  const [options, setOptions] = useState<YouthRevisionOptionsV1 | null>(null);
  const [correction, setCorrection] = useState<CorrectionDetailV1 | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [data, setData] = useState<{ records: SampleRecord[]; analytics: SampleRecord[] } | null>(null);
  const [selected, setSelected] = useState<RegistryDetailV3 | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const live = useRef(true), loadVersion = useRef(0), detailVersion = useRef(0);
  const clear = useCallback(() => {
    ++loadVersion.current; ++detailVersion.current;
    setData(null); setSelected(null); setCorrection(null); setBusy(false);
    setError('Saved staff records are unavailable or access changed. Retry the database check.');
  }, []);
  const load = useCallback(async (background = false) => {
    const version = ++loadVersion.current;
    if (!background) setBusy(true); setError('');
    try {
      if (!workflowService) throw new Error('unavailable');
      const availability = await familyService?.options();
      const enabled = availability?.kind === 'ok' ? availability.data : null;
      const service = enabled?.correctionsEnabled && correctionService ? correctionService : workflowService;
      const [registry, analytics] = await Promise.all([pages(service.registry), pages(service.analytics)]);
      if (!live.current || version !== loadVersion.current) return false;
      setData({ records: registry.map(registryRecord), analytics: analytics.map(analyticsRecord) });
      setOptions(enabled);
      return true;
    } catch {
      if (live.current && version === loadVersion.current) clear();
      return false;
    } finally { if (live.current && version === loadVersion.current) setBusy(false); }
  }, [clear]);
  const open = useCallback(async (key: string | null) => {
    const version = ++detailVersion.current;
    setSelected(null); setCorrection(null); setSelectedKey(key); setError('');
    if (!key || !workflowService) return;
    if (data?.records.find(record => record.key === key)?.answerRevision && correctionService) {
      const result = await correctionService.detail(key);
      if (!live.current || version !== detailVersion.current) return;
      if (result.kind === 'ok') setCorrection(result.data);
      else if (result.kind === 'denied') clear();
      else setError('Correction review could not be loaded. Close the profile and retry.');
      return;
    }
    const result = await workflowService.detail(key);
    if (!live.current || version !== detailVersion.current) return;
    if (result.kind === 'ok' && result.data.detail.responseId === key) setSelected(result.data);
    else if (result.kind === 'denied') clear();
    else setError('The selected saved profile could not be loaded. Close it and try again.');
  }, [clear, data]);
  const loadProfiles: ApprovedProfileLoader = async (records, sections) => {
    if (!familyService || !options?.fullSectionExportEnabled || accessChecking.current) throw new Error('unavailable');
    const version = loadVersion.current;
    const valid = () => { if (!live.current || accessChecking.current || version !== loadVersion.current) throw new Error('Access or selection changed.'); };
    const batches: {selection: {responseId: string; answerRevision: number | null}[]; requestId: string; fingerprint: string}[] = [];
    const output: import('../demo/approvedProfileExport').ApprovedExportSource[] = [];
    try {
      for (let start = 0; start < records.length; start += 25) {
        valid(); const selection = records.slice(start, start + 25).map(record => ({responseId: record.key, answerRevision: record.answerRevision ?? null}));
        const requestId = crypto.randomUUID();
        const result = await familyService.exportProfiles(selection, sections as ProfileSectionV1[], requestId); valid();
        if (result.kind !== 'ok') throw profileExportFailure(result.kind);
        batches.push({selection, requestId, fingerprint: JSON.stringify(result.data)});
        output.push(...result.data.items.map(item => ({responseId: item.responseId, registrationNo: item.kkNumber, name: `${item.firstName} ${item.surname}`, approved: true, reportingDate: item.reportingDate, answers: Object.assign({}, ...item.sections.map(section => section.answers))})));
      }
      return { records: output, revalidate: async () => {
        for (const batch of batches) {
          valid(); const result = await familyService!.exportProfiles(batch.selection, sections as ProfileSectionV1[], batch.requestId); valid();
          if (result.kind !== 'ok' || JSON.stringify(result.data) !== batch.fingerprint) { output.length = 0; throw new Error('Export selection changed.'); }
        }
      }};
    } catch (failure) { output.length = 0; throw failure; }
  };
  useEffect(() => { live.current = true; void load(); return () => { live.current = false; ++loadVersion.current; ++detailVersion.current; }; }, [load]);
  useAutoRefresh(async () => { await load(true); }, !busy && !checking && !signingOut);
  if (!data && !busy) return <AdminLayout title={view === 'dashboard' ? 'Staff dashboard' : view === 'reports' ? 'Analytics' : 'KK Youth Registry'} description="Saved records from the local database.">
    <p role="alert">{error}</p><button className="secondary-button" onClick={() => { void load(); }}>Retry saved records</button>
  </AdminLayout>;
  return <div aria-busy={busy}>
    {busy && <span role="status" className="sr-only">{data ? 'Refreshing saved records…' : 'Loading saved staff records…'}</span>}
    <div inert={busy || undefined}>
    {view === 'registry' ? <RegistryDemo loading={!data} backend={{ records: data?.records ?? [], detail: selected?.detail || null, busy, error,
      open: key => { void open(key); }, refresh: () => load(), denied: clear, decide: workflowService!.decide, encoderReceipt: selected?.encoderReceipt,
      loadProfiles: options?.fullSectionExportEnabled ? loadProfiles : undefined,
      suppressLegacyDecision: options?.correctionsEnabled && selected?.detail.review.status === 'pending_review',
      reviewContent: correction ? notify => <CorrectionReview onDecisionSaved={outcome => notify({approved: 'Youth profile approved successfully.', needs_changes: 'Changes requested for the youth profile.', rejected: 'Youth profile rejected.'}[outcome], outcome)} staff key={`${correction.responseId}-${correction.answerRevision}-${correction.status}`} detail={correction} reload={() => { void load().then(() => { void open(correction.responseId); }); }} denied={clear} >{options && <WalkinCorrection detail={correction} serverDate={options.serverDate} siblingDates={options.siblingBirthdatesEnabled} reload={() => { void load().then(() => { void open(correction.responseId); }); }} denied={clear} />}</CorrectionReview> : undefined,
      beforeDecision: options?.correctionsEnabled && selected?.detail.review.status === 'pending_review' && !correction ? selected.encoderReceipt ? <CorrectionEnrollment responseId={selectedKey!} enrolled={() => { if (!correctionService || !selectedKey) return; void correctionService.detail(selectedKey).then(result => { if (live.current && result.kind === 'ok') { setSelected(null); setCorrection(result.data); void load(); } }); }} denied={clear} /> : <p className="field-hint">Correction review for this existing profile is awaiting the simplified privacy backend update.</p> : undefined }} /> :
      <StaffDashboard loading={!data} reports={view === 'reports'} records={data?.records ?? []} analyticsRecords={data?.analytics ?? []} recovery={<DashboardRecovery pending={!data} />} activity={<StaffActivity denied={clear} preview pending={!data} />} />}
    </div>
  </div>;
}
