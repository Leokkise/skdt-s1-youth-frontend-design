import useAutoRefresh from './useAutoRefresh';
import LoadingAction from '../demo/LoadingAction';
import YouthWorkspacePending from './YouthWorkspacePending';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { youthService, useYouthAuth } from './AuthProvider';
import type { YouthResultV1, YouthStateV1 } from '../../contracts/v1/youth';
import type { Answers } from '../profiling/fields';
import ProfilingForm from '../profiling/ProfilingForm';
import ProfilingNoticeAccess from './ProfilingNoticeAccess';
import { savedAnswers } from './saved-answers';
import { profilingDate, validate } from '../profiling/validation';
import PresentationYouth from '../demo/PresentationYouth';
import { correctionService, familyService, acknowledgmentService, reviewService } from './review-services';
import type { CorrectionDetailV1 } from '../../contracts/v1/youth-corrections';
import type { YouthRevisionOptionsV1 } from '../../contracts/v1/youth-family-export';
import CorrectionYouth from './CorrectionYouth';

// Backend controller only: the existing youth components own their layout.
export default function SavedYouth() {
  const {state} = useYouthAuth();
  const identity = state.kind === 'signedIn' ? state.authUserId : 'signed-out';
  return <ProfilingNoticeAccess key={identity}><SavedYouthScreens /></ProfilingNoticeAccess>;
}
function SavedYouthScreens() {
  const {state, youthScreenView, notifyProfileChange} = useYouthAuth();
  const identity = state.kind === 'signedIn' ? state.authUserId : null;
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const cached = youthScreenView.current?.authId === identity ? youthScreenView.current : null;
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<{options: YouthRevisionOptionsV1 | null; detail: CorrectionDetailV1 | null} | null>(() => cached ? {options:cached.options, detail:cached.detail} : null);
  const [error, setError] = useState(''), [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    setChecking(true); setError('');
    void (async () => {
      const availability = await familyService?.options();
      if (!live) return;
      const options = availability?.kind === 'ok' ? availability.data : null;
      if (options?.correctionsEnabled && correctionService) {
        const result = await correctionService.mine();
        if (!live) return;
        if (result.kind === 'ok') { youthScreenView.current = identity ? {authId:identity, options, detail:result.data} : null; setMode({options, detail: result.data}); setChecking(false); notifyProfileChange(); return; }
        if (result.kind !== 'denied') { youthScreenView.current = null; setMode(null); setChecking(false); setError('Your correction profile could not be checked. Retry your saved review.'); return; }
      }
      youthScreenView.current = identity ? {authId:identity, options, detail:null} : null;
      setMode({options, detail: null}); setChecking(false); notifyProfileChange();
    })();
    return () => { live = false; };
  }, [version]);
  const reload = () => setVersion(value => value + 1);
  useAutoRefresh(async () => {
    if (!correctionService || !mode?.detail || mode.detail.draft) return;
    const result = await correctionService.mine();
    if (!mounted.current) return;
    if (result.kind === 'ok') {
      setError('');
      if (JSON.stringify(result.data) === JSON.stringify(mode.detail)) return;
      youthScreenView.current = identity ? {authId:identity, options:mode.options, detail:result.data} : null;
      setMode(previous => previous ? {...previous, detail:result.data} : previous); notifyProfileChange();
    } else if (result.kind === 'denied') { youthScreenView.current = null; setMode(null); reload(); }
    else setError('Your review status could not be updated. Refresh to retry.');
  }, !checking && !!identity && !!mode?.detail && !mode.detail.draft);
  if (!mode && !error) return <YouthWorkspacePending />;
  if (!mode) return <main id="main-content" className="container demo-main" aria-busy={!error}>{error ? <><p role="alert">{error}</p><button className="button" onClick={reload}>Retry saved review</button></> : <span className="sr-only" role="status">Loading your profile…</span>}</main>;
  if (mode.detail && mode.options) return <div inert={checking || undefined} aria-busy={checking}>{error && <p role="status">{error}</p>}<CorrectionYouth refreshing={checking} key={mode.detail.responseId} detail={mode.detail} options={mode.options} reload={reload} /></div>;
  return <LegacySavedYouth options={mode.options} reloadRevision={reload} />;
}

function LegacySavedYouth({options, reloadRevision}: {options: YouthRevisionOptionsV1 | null; reloadRevision: () => void}) {
  const { state: account, youthView, refresh, feedback, notifyProfileChange } = useYouthAuth();
  const authId = account.kind === 'signedIn' ? account.authUserId : null;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [record, setRecord] = useState<YouthStateV1 | null>(() => youthView.current?.authId === authId ? youthView.current?.record || null : null);
  const [uncertain, setUncertain] = useState(false);
  const operation = useRef<{ revision: number; answers: Answers; requestId: string; submit: boolean; certified: boolean; savedRevision?: number; submitRequestId?: string } | null>(null);
  const beginRetry = useRef<string | null>(null);
  const creatingProfile = useRef<Promise<YouthResultV1> | null>(null);
  const [pendingReview, setPendingReview] = useState(false);
  const [savedReviewStatus, setSavedReviewStatus] = useState<import('../demo/presentationWorkflow').ReviewStatus | 'unavailable'>('unavailable');
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const live = useRef(true);
  useEffect(() => {
    let current = true;
    if (record?.kind === 'submitted') void reviewService?.mine().then(value => { if (current) { setPendingReview(value.kind === 'ok' && value.data.status === 'pending_review'); setSavedReviewStatus(value.kind === 'ok' ? ({pending_review:'For review', needs_changes:'Needs changes', approved:'Approved (demo)', rejected:'Rejected (demo)'} as const)[value.data.status as 'pending_review' | 'needs_changes' | 'approved' | 'rejected'] || 'unavailable' : 'unavailable'); } });
    return () => { current = false; };
  }, [record?.kind]);
  useAutoRefresh(async () => {
    const value = await reviewService?.mine();
    if (!live.current) return;
    if (value?.kind === 'ok') {
      setPendingReview(value.data.status === 'pending_review');
      setSavedReviewStatus(({pending_review:'For review', needs_changes:'Needs changes', approved:'Approved (demo)', rejected:'Rejected (demo)'} as const)[value.data.status as 'pending_review' | 'needs_changes' | 'approved' | 'rejected'] || 'unavailable');
    } else if (value?.kind === 'denied') { youthView.current = null; setRecord(null); await refresh(); }
    else setSavedReviewStatus('unavailable');
  }, !busy && record?.kind === 'submitted');
  async function result(value: YouthResultV1) {
    if (!live.current) return false;
    if (value.kind === 'ok') {
      if (authId) { youthView.current = { authId, record: value.state }; notifyProfileChange(); }
      setRecord(value.state);

      return true;
    }
    if (value.kind === 'denied') { youthView.current = null; setRecord(null); setError('Access denied. Check your current account status.'); await refresh(); }
    else if (value.kind === 'conflict') setError('This draft changed elsewhere. Reload saved record and review before saving again.');
    else if (value.kind === 'closed') setError('This record changed or is already submitted. Reload saved record.');
    else if (value.kind === 'invalid') setError('Some answers exceed the saved-form limits or are invalid. Check your answers.');
    else setError('Unable to confirm the result. Reload saved record before continuing, or retry an uncertain submission.');
    return false;
  }
  async function readProfile(): Promise<YouthResultV1> {
    if (!youthService) return {kind: 'unavailable'};
    const value = await youthService.read();
    if (!live.current || value.kind !== 'ok' || value.state.kind !== 'unlinked') return value;
    // Mounted only behind the profiling acknowledgment gate; create a blank draft, never submit.
    creatingProfile.current ||= youthService.create();
    const created = await creatingProfile.current;
    if (created.kind !== 'ok') creatingProfile.current = null;
    if (created.kind === 'conflict') return youthService.read();
    return created.kind === 'ok' && created.state.kind === 'unlinked' ? {kind:'unavailable'} : created;
  }
  useEffect(() => {
    live.current = true;
    void readProfile().then(async value => {
      if (!live.current) return;
      if (value.kind !== 'ok') { youthView.current = null; setRecord(null); }
      await result(value); if (live.current) setBusy(false);
    });
    return () => { live.current = false; };
  }, []);
  async function load() {
    if (!youthService || busy) return;
    operation.current = null; setUncertain(false); setBusy(true); setError(''); setMessage('');
    const value = await readProfile();
    if (!live.current) return;
    if (await result(value)) setMessage('Saved record loaded. Review the current answers.');
    setBusy(false);
  }
  async function save(answers: Answers, submit = false) {
    if (!acknowledgmentService || !youthService || record?.kind !== 'draft' || busy) return;
    if (!operation.current) {
      const prepared = savedAnswers(answers, options?.serverDate || profilingDate());
      if (submit && Object.keys(validate(prepared, options?.serverDate || profilingDate())).length) { setError('Check your answers and confirm accuracy before submitting.'); return; }
      if (new TextEncoder().encode(JSON.stringify(prepared)).length > 24000) { setError('Draft is too large. Shorten your answers before saving.'); return; }
      operation.current = {revision: record.revision, answers: prepared, requestId: crypto.randomUUID(), submit, certified: prepared.certification === 'true'};
    }
    const attempt = operation.current;
    setBusy(true); setError(''); setMessage('');
    if (attempt.savedRevision === undefined) {
      const stored = await acknowledgmentService.save(attempt.revision, attempt.answers, attempt.requestId);
      if (!live.current) return;
      if (stored.kind !== 'ok') {
        setBusy(false); setUncertain(stored.kind === 'unavailable');
        if (stored.kind !== 'unavailable') operation.current = null;
        setError(stored.kind === 'unavailable' ? 'Draft save is unconfirmed. Retry the same operation.' : 'Draft was not saved. Reload your record and check access.'); return;
      }
      if (stored.data.youthId !== record.youthId) { setBusy(false); setUncertain(true); setError('The saved profile could not be confirmed. Reload before continuing.'); return; }
      attempt.savedRevision = stored.data.revision;
    }
    if (attempt.submit) {
      attempt.submitRequestId ||= crypto.randomUUID();
      const submitted = await acknowledgmentService.submit(attempt.savedRevision, attempt.submitRequestId, attempt.certified);
      if (!live.current) return;
      setBusy(false); setUncertain(submitted.kind === 'unavailable');
      if (submitted.kind === 'ok') { operation.current = null; youthView.current = null; setRecord(null); setBusy(true); navigate('/youth/dashboard'); reloadRevision(); return; }
      if (submitted.kind !== 'unavailable') operation.current = null;
      setError(submitted.kind === 'unavailable' ? 'Submission is unconfirmed. Retry the same submission.' : 'Submission was not accepted. Reload your saved profile.'); return;
    }
    operation.current = null; setUncertain(false);
    const value = await youthService.read();
    if (!live.current) return;
    if (await result(value)) setMessage('Draft saved.');
    setBusy(false);
  }
  async function begin() {
    if (!acknowledgmentService || busy) return;
    beginRetry.current ||= crypto.randomUUID(); setBusy(true); setError('');
    const value = await acknowledgmentService.begin(beginRetry.current);
    if (!live.current) return;
    setBusy(false);
    if (value.kind !== 'unavailable') beginRetry.current = null;
    if (value.kind === 'ok' || value.kind === 'conflict') reloadRevision();
    else setError('Correction review could not be prepared. Retry or reload your profile.');
  }
  if (record?.kind === 'draft' || record?.kind === 'submitted') {
    if (record.kind === 'draft' && pathname !== '/youth/profiling') return <Navigate to="/youth/profiling" replace />;
    if (pathname === '/youth/qr') return <Navigate to="/youth/dashboard" replace />;
    if (pathname === '/youth/profiling') return record.kind === 'submitted' ? <Navigate to="/youth/dashboard" replace /> :
      <ProfilingForm siblingDates={options?.siblingBirthdatesEnabled} serverDate={options?.serverDate} saved={{ record, busy, uncertain, error, message, save, reload: load, privacyAccepted: true }} />;
    return <>{pendingReview && pathname === '/youth/profile' && options?.correctionsEnabled && <section className="container"><LoadingAction className="secondary-button" busy={busy} onClick={() => { void begin(); }}>Prepare correction review</LoadingAction>{error && <p role="alert">{error}</p>}</section>}<PresentationYouth profile={pathname === '/youth/profile'} saved={record} reviewStatus={savedReviewStatus} /></>;
  }
  if ((!record || record.kind === 'unlinked') && busy) return <YouthWorkspacePending />;
  if ((record?.kind === 'unlinked' || record?.kind === 'linkPending') && ['/youth/dashboard','/youth/profile','/youth/qr'].includes(pathname)) return <Navigate to="/youth/account" replace />;
  return <main id="main-content" className="container account-main">
    <Link className="back-link" to="/youth">← Back to home</Link>
    <section className="profile-card account-preview"><h1>{record?.kind === 'linkPending' ? 'Link request pending' : 'Your youth profile could not be opened'}</h1>
      {error && <p role="alert" className="auth-error">{error}</p>}{feedback && <p role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
      {busy && <p role="status">Checking your saved record…</p>}
      {!record && !busy && <button className="button" onClick={() => { void load(); }}>Retry account check</button>}
      {record?.kind === 'linkPending' && <><p>Your request was recorded. Review completion is unavailable until staff proof and permission rules are agreed.</p><p>Request receipt: {record.requestId}</p><p>No access to an existing youth record has been granted.</p></>}
    </section>
  </main>;
}
