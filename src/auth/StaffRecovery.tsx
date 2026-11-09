import useAutoRefresh from './useAutoRefresh';
import StatusToast from '../demo/StatusToast';
import RecoveryCaseDialog, { recoveryStatusLabel as statusLabel } from './RecoveryCaseDialog';
import { recoveryStatusTones } from './recovery-presentation';
import LoadingAction from '../demo/LoadingAction';
import YouthIcon from '../demo/YouthIcon';
import { SkeletonText, TableSkeleton } from '../demo/StaffLoading';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useYouthAuth } from './AuthProvider';
import { recoveryService, recoveryMessage } from './recovery-services';
import type { RecoveryCaseV1, RecoveryEventV1, RecoveryMethodV1 } from '../../contracts/v1/account-recovery';
import { manilaTime, positionLabel } from './review-presentation';
import StaffSessionNotice from './StaffSessionNotice';
import RecoveryAccountSearch from './RecoveryAccountSearch';
import type { RecoverySearchModeV1, RecoverySelectedV1 } from '../../contracts/v1/recovery-search';

export default function StaffRecovery({ visible = true }: { visible?: boolean }) {
  const {state, checking, signingOut} = useYouthAuth();
  if (state.kind === 'signedOut') return <Navigate to="/admin/youth/login" replace />;
  if (state.kind !== 'signedIn' || state.access.accountStatus !== 'active' || !state.access.capabilities.includes('account.recovery_manage') || signingOut) return <main id="main-content" className="container demo-main"><h1>Account recovery</h1><p role="status">{state.kind === 'loading' ? 'Checking recovery access…' : 'Separate account recovery permission is required.'}</p></main>;
  return <div inert={checking || !visible || undefined} aria-busy={checking}><RecoveryWorkspace key={state.authUserId} blocked={checking || !visible} visible={visible} /></div>;
}
function RecoveryWorkspace({blocked, visible}: {blocked: boolean; visible: boolean}) {
  const [toast, setToast] = useState<{message: string; pending: boolean; id: number} | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const [searchDraft,setSearchDraft] = useState<{mode:RecoverySearchModeV1;query:string}>({mode:'name',query:''});
  const [params] = useSearchParams();
  const target = useRef(params.get('response') || '');
  if (visible && params.get('response')) target.current = params.get('response')!;
  const responseId = target.current;
  const [subject, setSubject] = useState<RecoverySelectedV1['subject'] | null>(null);
  const [items, setItems] = useState<RecoveryCaseV1[]>([]), [cursor, setCursor] = useState<{createdAt:string;caseId:string}|null>(null);
  const [openCaseId,setOpenCaseId] = useState<string|null>(null);
  const linkedCase = useRef('');
  useEffect(() => { if (!visible && openCaseId) setOpenCaseId(null); }, [visible, openCaseId]);
  const [selected, setSelected] = useState<{case:RecoveryCaseV1;events:RecoveryEventV1[]}|null>(null);
  const [email, setEmail] = useState(''), [method, setMethod] = useState<RecoveryMethodV1>('government_photo_id'), [reference, setReference] = useState(''), [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const live = useRef(true), generation = useRef(0), lock = useRef(false);
  const retry = useRef<{responseId:string;email:string;method:RecoveryMethodV1;reference:string;requestId:string}|null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [reload, setReload] = useState(0);
  const [loadState, setLoadState] = useState<'loading'|'ready'|'denied'|'failed'>('loading');
  const denied = () => { setOpenCaseId(null); setSubject(null); setItems([]); setSelected(null); retry.current=null; setUncertain(false); };
  function failure(kind:string) { if(kind==='denied') { denied(); setLoadState('denied'); } setError(recoveryMessage(kind)); }
  async function list(more=false, background=false) {
    if (!recoveryService || blocked || lock.current) return;
    lock.current=true; if (!background) { setBusy(true); setError(''); setLoadState('loading'); } const current=generation.current;
    const result=await recoveryService.list(25,more && cursor ? cursor : undefined);
    if(live.current && generation.current===current) { if(result.kind==='ok'){setLoadState('ready');setItems(previous=>more?[...previous,...result.data.items]:result.data.items);setCursor(result.data.nextCursor);}else {setLoadState(result.kind==='denied'?'denied':'failed');failure(result.kind);}setBusy(false); }lock.current=false;
  }
  async function detail(caseId:string, show=true) {
    if(!recoveryService || blocked || lock.current)return;
    if(show)setOpenCaseId(caseId);
    lock.current=true;setBusy(true);setError('');setSelected(previous=>previous?.case.caseId===caseId?previous:null);setVerified(false);const current=generation.current;
    const result=await recoveryService.detail(caseId);
    if(live.current&&generation.current===current){if(result.kind==='ok')setSelected(result.data);else failure(result.kind);setBusy(false);}lock.current=false;
  }
  useEffect(()=>{live.current=true;const current=++generation.current;setOpenCaseId(null);setSubject(null);setSelected(null);setEmail('');setReference('');setVerified(false);retry.current=null;setUncertain(false);setError('');
    setLoadState('loading');
    void (async()=>{if(!recoveryService){setLoadState('failed');return;}const result=await recoveryService.list();if(!live.current||current!==generation.current)return;if(result.kind==='ok'){setItems(result.data.items);setCursor(result.data.nextCursor);}else {setLoadState(result.kind==='denied'?'denied':'failed');failure(result.kind);return;}
      if(responseId){const target=await recoveryService.subject(responseId);if(!live.current||current!==generation.current)return;if(target.kind==='ok')setSubject(target.data);else failure(target.kind);}
      setLoadState('ready');})();
    return()=>{live.current=false;generation.current++;};
  },[responseId,reload]);
  useEffect(() => {
    if (!visible) { linkedCase.current=''; return; }
    const caseId=params.get('case');
    if (blocked || loadState!=='ready' || !caseId || linkedCase.current===caseId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId)) return;
    linkedCase.current=caseId;
    void detail(caseId);
  },[visible,blocked,loadState,params]);
  useAutoRefresh(() => list(false, true), !busy && !blocked && !openCaseId && !cursor && loadState === 'ready');
  async function create() {
    if(!recoveryService||!subject||blocked||lock.current||!verified)return;
    retry.current ||= {responseId:subject.responseId,email:email.trim().toLowerCase(),method,reference:reference.trim(),requestId:crypto.randomUUID()};
    const attempt=retry.current;lock.current=true;setBusy(true);setError('');setMessage('');setToast(null);const current=generation.current;
    const result=await recoveryService.create(attempt.responseId,attempt.email,attempt.method,attempt.reference,attempt.requestId);
    if(!live.current||current!==generation.current){lock.current=false;return;}
    lock.current=false;setBusy(false);
    if(result.kind==='ok'){setToast({message:'Recovery approved. Verification requested for the replacement email.',pending:false,id:Date.now()});retry.current=null;setUncertain(false);setEmail('');setVerified(false);setMessage('Recovery case saved. The youth must verify the replacement email before it becomes active.');await detail(result.data.caseId);await list();}
    else if(result.kind==='pending'&&result.caseId){setToast({message:'Recovery case saved. Verification delivery or activation is pending.',pending:true,id:Date.now()});retry.current=null;setUncertain(false);setMessage('Case saved; delivery or activation is pending. Inspect the case before taking another action.');await detail(result.caseId);await list();}
    else {setUncertain(['unavailable','pending'].includes(result.kind));if(!['unavailable','pending'].includes(result.kind))retry.current=null;failure(result.kind);}
  }
  async function command(action:'resend'|'cancel'|'reconcile'|'reapprove') {
    if(!recoveryService||!selected||blocked||lock.current)return;
    if(action==='reapprove'&&!verified)return;
    const caseId=selected.case.caseId;lock.current=true;setBusy(true);setError('');setMessage('');const current=generation.current;
    const result=action==='reapprove'?await recoveryService.reapprove(caseId,method,reference.trim()):await recoveryService.command(caseId,action);
    if(!live.current||current!==generation.current){lock.current=false;return;}lock.current=false;setBusy(false);setVerified(false);
    if(['ok','completed','pending'].includes(result.kind)){setMessage(result.kind==='pending'?'Operation pending. Check the current case status.':'Operation recorded. Check the current case status.');await detail(caseId,false);await list();}else failure(result.kind);
  }
  const evidence = (prefix:string) => <fieldset className="auth-fields" disabled={busy||blocked||uncertain||!subject}><legend>In-person ownership verification</legend><p>Match the requester and original document photo to the profile name and birthdate. Stop and refer disputed or incomplete evidence to the barangay authority.</p><div className="profile-fields"><div className="profile-field"><label htmlFor={prefix+'-method'}>Evidence presented</label><select id={prefix+'-method'} value={method} onChange={e=>{setMethod(e.target.value as RecoveryMethodV1);setVerified(false);}}><option value="government_photo_id">Original government photo ID</option><option value="school_photo_id_and_barangay_identity">School photo ID + barangay identity document</option></select></div><div className="profile-field"><label htmlFor={prefix+'-reference'}>Office case reference</label><input id={prefix+'-reference'} value={reference} onChange={e=>setReference(e.target.value.toUpperCase())} pattern="[A-Z][A-Z0-9-]{5,79}" maxLength={80} required placeholder="REC-2026-001" /><p className="field-hint">Office reference only; do not enter an ID number.</p></div></div><label className="certification"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)} />I compared the requester and documents in person and confirmed account ownership.</label><p className="field-hint">Never collect ID images, full ID numbers, passwords or verification codes.</p></fieldset>;
  return <main id="main-content" className="container demo-main recovery-workspace"><header className="demo-heading"><h1>Account recovery</h1></header>
    {toast && !openCaseId && visible && <StatusToast key={toast.id} message={toast.message} pending={toast.pending} onClose={dismissToast} />}
    {error&&loadState==='ready'&&!openCaseId&&<p role="alert" className="auth-error">{error}</p>}{message&&!openCaseId&&<p role="status">{message}</p>}
    {(loadState==='ready'||loadState==='loading') && (subject || (loadState==='loading' && responseId) ? <section className="profile-card recovery-ownership">
      <div className="review-heading"><div><h2>Verify account ownership</h2><p className="recovery-section-intro">Confirm who is requesting access before changing their sign-in email.</p></div><button className="secondary-button" disabled={busy||blocked||uncertain} onClick={()=>{setSubject(null);setSelected(null);setVerified(false);setEmail('');setReference('');}}>Find another account</button></div>
      <div className="recovery-owner-summary"><span className="recovery-owner-icon" aria-hidden="true"><YouthIcon name="profile" /></span><dl className="demo-details"><div><dt>Profile name</dt><dd>{subject ? [subject.firstName,subject.surname].filter(Boolean).join(' ')||'No recorded name' : <SkeletonText>Youth profile name</SkeletonText>}</dd></div><div><dt>Birthdate</dt><dd>{subject ? subject.birthdate||'Not recorded' : <SkeletonText>2006-01-01</SkeletonText>}</dd></div></dl></div>
      <form className="recovery-verification-form" onSubmit={e=>{e.preventDefault();void create();}}>
        {evidence('new')}
        <section className="recovery-email-panel" aria-labelledby="recovery-email-title"><h3 id="recovery-email-title"><YouthIcon name="lock" />Send verification</h3>
          <p>The current email stays active until the replacement is verified.</p>
          <div className="profile-field"><label htmlFor="replacement-email">Replacement email</label><input id="replacement-email" type="email" autoComplete="off" required maxLength={254} value={email} disabled={busy||uncertain||blocked||!subject} onChange={e=>setEmail(e.target.value)} placeholder="youth@example.invalid" /><p className="field-hint">Use a fictional @example.invalid address for local testing.</p></div>
          <LoadingAction busy={busy&&Boolean(retry.current)} disabled={busy||blocked||!verified}>{uncertain?'Retry same recovery request':'Approve and send verification'}</LoadingAction>
          <p className="recovery-next-step"><YouthIcon name="arrow" />The youth completes verification in their new inbox.</p>
        </section>
      </form>
    </section> : <RecoveryAccountSearch draft={searchDraft} setDraft={setSearchDraft} blocked={blocked||busy||loadState==='loading'} select={record=>{setSubject(record.activeCaseId?null:record.subject);setSelected(null);setEmail('');setReference('');setVerified(false);setMessage('');setError('');retry.current=null;setUncertain(false);if(record.activeCaseId)void detail(record.activeCaseId);}} />)}
    <section className="profile-card"><div className="review-heading"><h2>Recovery cases</h2><LoadingAction type="button" className="secondary-button" busy={loadState==='loading'} disabled={busy||blocked} onClick={()=>{void list();}}>Refresh cases</LoadingAction></div>{loadState==='loading'&&items.length===0?<TableSkeleton variant="cases" label="Loading recovery cases…" />:loadState==='denied'||loadState==='failed'?<div role="alert"><StaffSessionNotice /><h3>{loadState==='denied'?'Recovery access could not be confirmed':'Recovery cases could not be loaded'}</h3><p>{loadState==='denied'?'The server did not authorize this recovery request. Retry to check your current access. If this continues, sign out and sign in with your assigned staff account. Ask the system administrator to check recovery access if the error remains.':'Check your connection and retry. No account changes were made by this list request.'}</p><button className="secondary-button" disabled={busy||blocked} onClick={()=>setReload(value=>value+1)}>Retry loading cases</button></div>:items.length===0?<div className="demo-empty" role="status"><h3>No recovery cases yet</h3><p>When staff start an account recovery, its status and history will appear here.</p><p>To begin, find and select a youth account above.</p></div>:<div className="report-table-wrap recovery-cases-table"><table className="report-table recovery-case-list"><caption className="sr-only">Account recovery cases</caption><thead><tr><th scope="col">Case reference</th><th scope="col">Status</th><th scope="col">Email change</th><th scope="col">Created (PH)</th><th scope="col">Action</th></tr></thead><tbody>{items.map(item=><tr key={item.caseId}><th scope="row">{item.officeReference}</th><td><span className="status-pill staff-event-tone" data-tone={recoveryStatusTones[item.status]}>{statusLabel(item.status)}</span></td><td className="recovery-email-change"><span>{item.oldEmailMasked}</span><span aria-hidden="true"> → </span><span>{item.newEmailMasked}</span></td><td><time dateTime={item.createdAt}>{manilaTime(item.createdAt)}</time></td><td><button className="secondary-button" aria-label={'View case '+item.officeReference} disabled={busy||blocked} onClick={()=>{void detail(item.caseId);}}>View case</button></td></tr>)}</tbody></table></div>}{loadState==='ready'&&cursor&&<button className="secondary-button" disabled={busy||blocked} onClick={()=>{void list(true);}}>Load more cases</button>}</section>
    {openCaseId&&visible&&<RecoveryCaseDialog record={selected?.case.caseId===openCaseId?selected:null} reference={items.find(item=>item.caseId===openCaseId)?.officeReference} busy={busy} blocked={blocked} error={error} message={message} close={()=>setOpenCaseId(null)} refresh={()=>{void detail(openCaseId,false);}}>
      {toast && <StatusToast key={toast.id} message={toast.message} pending={toast.pending} onClose={dismissToast} />}
      {selected&&<>
      <div className="form-actions">{['approved','awaiting_mailbox'].includes(selected.case.status)&&<button className="secondary-button" disabled={busy||blocked} onClick={()=>{void command('resend');}}>Resend verification</button>}{['verified','applying'].includes(selected.case.status)&&<button className="button" disabled={busy||blocked} onClick={()=>{void command('reconcile');}}>Check and finalize email change</button>}{!['completed','cancelled','expired'].includes(selected.case.status)&&<button className="secondary-button" disabled={busy||blocked} onClick={()=>{void command('cancel');}}>Cancel recovery</button>}</div>
      {!['completed','cancelled','expired'].includes(selected.case.status)&&<details><summary>Take over this unfinished case</summary><p>A different authorized officer must repeat in-person verification before taking responsibility.</p>{!subject&&<p>Select this profile from the registry first to compare the name and birthdate.</p>}{subject?.responseId===selected.case.responseId&&<form onSubmit={e=>{e.preventDefault();void command('reapprove');}}>{evidence('takeover')}<button className="button" disabled={busy||blocked||!verified}>Record fresh verification</button></form>}</details>}
      </>}
    </RecoveryCaseDialog>}
  </main>;
}
