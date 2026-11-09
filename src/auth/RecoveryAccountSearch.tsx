import { useEffect, useRef, useState } from 'react';
import { recoverySearchService, recoveryMessage } from './recovery-services';
import { useYouthAuth } from './AuthProvider';
import { reviewLabel } from './review-presentation';
import RecoveryProfileDialog from './RecoveryProfileDialog';
import { LoadingSpinner, SkeletonText, TableSkeleton } from '../demo/StaffLoading';
import type { RecoverySearchModeV1, RecoverySearchItemV1, RecoverySearchCursorV1, RecoverySelectedV1 } from '../../contracts/v1/recovery-search';

export default function RecoveryAccountSearch({ blocked, select, draft, setDraft }: { blocked: boolean; select: (record: RecoverySelectedV1) => void; draft: {mode: RecoverySearchModeV1;query: string}; setDraft: (draft: {mode: RecoverySearchModeV1;query: string}) => void }) {
  const { state, checking, signingOut } = useYouthAuth();
  const allowed = state.kind === 'signedIn' && state.access.accountStatus === 'active' && state.access.capabilities.includes('account.recovery_manage');
  const identity = state.kind === 'signedIn' ? state.authUserId : null;
  const {mode, query} = draft;
  const [rows, setRows] = useState<RecoverySearchItemV1[] | null>(null), [next, setNext] = useState<RecoverySearchCursorV1 | null>(null);
  const [history, setHistory] = useState<(RecoverySearchCursorV1 | undefined)[]>([undefined]);
  const [page, setPage] = useState(0), [error, setError] = useState('');
  const [pending, setPending] = useState<{kind: 'search' | 'preview' | 'select'; responseId?: string} | null>(null);
  const busy = pending !== null;
  const [preview, setPreview] = useState<RecoverySelectedV1 | null>(null);
  const previewTrigger = useRef<HTMLButtonElement | null>(null);
  function closePreview() {
    ++revision.current; setPending(null); setPreview(null);
    requestAnimationFrame(() => previewTrigger.current?.focus());
  }
  const revision = useRef(0), live = useRef(true), stopped = useRef(false);
  stopped.current = blocked || checking || signingOut || !allowed;
  function clear() { ++revision.current; setPreview(null); setRows(null); setNext(null); setHistory([undefined]); setPage(0); setPending(null); setError(''); }
  useEffect(() => { clear(); }, [identity, signingOut, allowed]);
  useEffect(() => {
    if (blocked || checking) { ++revision.current; setPending(null); }
  }, [blocked, checking]);
  useEffect(() => { live.current = true; return () => { live.current = false; ++revision.current; }; }, []);
  async function search(target = 0, cursor?: RecoverySearchCursorV1) {
    if (stopped.current || busy || !query.trim()) return;
    const current = ++revision.current; setPending({kind: 'search'}); setError('');
    let result = await recoverySearchService?.search(mode, query, cursor);
    if (!live.current || current !== revision.current || stopped.current) return;
    if (result?.kind === 'ok' && result.data.nextCursor) {
      const second = await recoverySearchService?.search(mode, query, result.data.nextCursor);
      if (!live.current || current !== revision.current || stopped.current) return;
      result = second?.kind === 'ok' ? {kind:'ok', data:{items:[...result.data.items,...second.data.items],nextCursor:second.data.nextCursor}} : second;
    }
    if (!live.current || current !== revision.current || stopped.current) return;
    setPending(null);
    if (result?.kind !== 'ok') { setNext(null); setError(result?.kind === 'invalid' ? 'Enter at least 3 characters from the name or the exact registration number.' : recoveryMessage(result?.kind || 'unavailable')); return; }
    setRows(result.data.items); setNext(result.data.nextCursor); setPage(target);
    setHistory(previous => target === 0 ? [undefined] : [...previous.slice(0, target), cursor]);
  }
  async function choose(id: string, confirm = false) {
    if (stopped.current || busy) return;
    const current = ++revision.current; setPending({kind: confirm ? 'select' : 'preview', responseId: id}); setError('');
    const result = await recoverySearchService?.selected(id);
    if (!live.current || current !== revision.current || stopped.current) return;
    setPending(null);
    if (result?.kind === 'ok') {
      if (confirm) { setPreview(null); select(result.data); }
      else setPreview(result.data);
    }
    else { setPreview(null); setRows(null); setNext(null); setError(recoveryMessage(result?.kind || 'unavailable')); }
  }
  return <section className="profile-card recovery-account-search" aria-labelledby="recovery-account-search-title" aria-busy={busy}>
    {preview && <RecoveryProfileDialog record={preview} blocked={stopped.current || busy} selecting={pending?.kind === 'select'} error={error} close={closePreview} select={() => { void choose(preview.subject.responseId, true); }} />}
    <h2 id="recovery-account-search-title">Find a youth account</h2>
    <p>Search submitted profiles of any review status. Draft-only and unsubmitted accounts are not included.</p>
    <form className="recovery-account-search-fields" onSubmit={event => { event.preventDefault(); void search(); }}>
      <div className="profile-field"><label htmlFor="recovery-search-mode">Search by</label><select id="recovery-search-mode" disabled={stopped.current} value={mode} onChange={event => { clear(); setDraft({mode:event.target.value as RecoverySearchModeV1,query:''}); }}><option value="name">Name</option><option value="registration">Registration number</option></select></div>
      <div className="profile-field"><label htmlFor="recovery-search-query">Search details</label><input id="recovery-search-query" type="search" required maxLength={mode === 'name' ? 80 : 20} disabled={stopped.current} placeholder={mode === 'name' ? 'Enter at least 3 characters' : 'Enter the exact registration number'} value={query} onChange={event => { clear(); setDraft({mode,query:event.target.value}); }} /></div>
      <button className="button" disabled={stopped.current || busy}>{pending?.kind === 'search' && <LoadingSpinner />}Search account</button>
    </form>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {!busy && !error && rows === null && <p className="recovery-search-hint">Enter the details above to find an account. No accounts are listed until you search.</p>}
    {pending?.kind === 'search' && (rows === null ? <><p aria-hidden="true"><SkeletonText>Showing 1–10 matching profiles</SkeletonText></p><TableSkeleton variant="search" label="Searching accounts…" /></> : <span className="sr-only" role="status">Updating search results…</span>)}
    {rows && <><p role="status">{rows.length ? `Showing ${page * 10 + 1}–${page * 10 + rows.length} matching ${rows.length === 1 ? 'profile' : 'profiles'}` : 'No matching submitted profiles. Check the details and try again.'}</p>{rows.length > 0 && <>
      <div className="report-table-wrap"><table className="report-table recovery-search-table"><caption className="sr-only">Submitted youth accounts matching your search</caption><thead><tr><th scope="col">Youth account</th><th scope="col">Registration No.</th><th scope="col">Profile status</th><th scope="col">Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.responseId}><th scope="row">{row.displayName || 'No recorded name'}</th><td><strong className="staff-registration-number">{row.registrationReference || 'Not assigned'}</strong></td><td>{reviewLabel(row.reviewStatus)}</td><td><button className="secondary-button" disabled={busy || stopped.current} onClick={event => { previewTrigger.current = event.currentTarget; void choose(row.responseId); }}>{pending?.kind === 'preview' && pending.responseId === row.responseId && <LoadingSpinner />}View profile</button></td></tr>)}</tbody></table></div>
      {(page > 0 || next) && <nav className="recovery-search-pages" aria-label="Recovery search pages"><span>10 per page</span><div><button className="secondary-button" disabled={busy || stopped.current || page === 0} onClick={() => { void search(page - 1, history[page - 1]); }}>Previous</button><span>Page {page + 1}</span><button className="secondary-button" disabled={busy || stopped.current || !next} onClick={() => { if (next) void search(page + 1, next); }}>Next</button></div></nav>}
    </>}</>}
  </section>;
}
