import type { CorrectionDetailV1 } from '../../contracts/v1/youth-corrections';
import type { YouthRevisionOptionsV1 } from '../../contracts/v1/youth-family-export';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { localBrowserConfig } from './local-config';
import { youthAuthV1 } from './youth-auth';
import { youthServiceV1 } from './youth-service';
import { youthPasswordV1 } from './youth-password';
import type { SessionAccessV1, YouthAuthV1 } from '../../contracts/v1/auth';
import { sessionPresentation, type SessionPresentation } from './session-presentation';
import type { YouthStateV1 } from '../../contracts/v1/youth';
import type { DecisionAttempt } from './review-presentation';
type CorrectionAttempt = DecisionAttempt & {targets: {fieldId: string; note: string}[]};
const config = localBrowserConfig(import.meta.env);
export const client = config ? createClient(config.url, config.anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
}) : null;
const api = client ? youthAuthV1(client) : null;
export const youthService = client ? youthServiceV1(client) : null;
export function passwordService() {
  return client && config ? youthPasswordV1(client, config.url, config.anonKey) : null;
}
type Feedback = { error: boolean; message: string } | null;
const Context = createContext<{ state: SessionAccessV1; checking: boolean; api: typeof api; refresh: () => Promise<void>;
  profileVersion: number;
  notifyProfileChange: () => void;
  youthScreenView: { current: {authId:string; options:YouthRevisionOptionsV1 | null; detail:CorrectionDetailV1 | null} | null };
  youthNoticeView: { current: string | null };
  youthView: { current: { authId: string; record: YouthStateV1 } | null };
  decisionAttempt: { current: DecisionAttempt | null };
  correctionAttempt: { current: CorrectionAttempt | null };
  signOut: () => Promise<void>; signingOut: boolean; feedback: Feedback; clearFeedback: () => void } | null>(null);
export function YouthAuthProvider({ children }: { children: ReactNode }) {
  const [{ state, checking }, setSession] = useState<SessionPresentation>({ state: { kind: api ? 'loading' : 'unavailable' }, checking: Boolean(api) });
  const [profileVersion, setProfileVersion] = useState(0);
  const notifyProfileChange = useCallback(() => setProfileVersion(value => value + 1), []);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [signingOut, setSigningOut] = useState(false);
  const observer = useRef<ReturnType<YouthAuthV1['observeSessionAccess']> | null>(null);
  const youthView = useRef<{ authId: string; record: YouthStateV1 } | null>(null);
  const youthScreenView = useRef<{authId:string; options:YouthRevisionOptionsV1 | null; detail:CorrectionDetailV1 | null} | null>(null);
  const youthNoticeView = useRef<string | null>(null);
  const decisionAttempt = useRef<DecisionAttempt | null>(null);
  const correctionAttempt = useRef<CorrectionAttempt | null>(null);
  const activeYouthIdentity = state.kind === 'signedIn' && state.access.accountStatus === 'active' ? state.authUserId : null;
  useEffect(() => {
    if (!activeYouthIdentity) return;
    let live = true;
    void (async () => {
      const { acknowledgmentService, familyService, correctionService } = await import('./review-services');
      const [notice, availability] = await Promise.all([acknowledgmentService?.mine(), familyService?.options()]);
      if (!live || notice?.kind !== 'ok' || !notice.data.receipt) return;
      youthNoticeView.current = activeYouthIdentity;
      if (availability?.kind === 'ok' && availability.data.correctionsEnabled) {
        const result = await correctionService?.mine();
        if (!live) return;
        if (result?.kind === 'ok') { youthScreenView.current = {authId: activeYouthIdentity, options: availability.data, detail: result.data}; setProfileVersion(value => value + 1); return; }
        if (result?.kind !== 'denied') return;
        const original = await youthService?.read();
        if (live && original?.kind === 'ok') { youthView.current = {authId: activeYouthIdentity, record: original.state}; setProfileVersion(value => value + 1); }
      } else {
        const result = await youthService?.read();
        if (live && result?.kind === 'ok') { youthView.current = {authId: activeYouthIdentity, record: result.state}; setProfileVersion(value => value + 1); }
      }
    })();
    return () => { live = false; };
  }, [activeYouthIdentity]);
  const refresh = useCallback(async () => { await observer.current?.refresh(); }, []);
  useEffect(() => {
    if (!api) return;
    // Local session events can revoke the retained view, never grant access.
    const identity = client!.auth.onAuthStateChange((_event, session) => {
      if (!session || youthScreenView.current?.authId !== session.user.id) youthScreenView.current = null;
      if (!session || youthNoticeView.current !== session.user.id) youthNoticeView.current = null;
      if (!session || youthView.current?.authId !== session.user.id) youthView.current = null;
      if (!session || decisionAttempt.current?.authId !== session.user.id) decisionAttempt.current = null;
      if (!session || correctionAttempt.current?.authId !== session.user.id) correctionAttempt.current = null;
      setSession(previous => {
        if (!session) return { state: { kind: 'signedOut' }, checking: false };
        if (previous.state.kind === 'signedIn' && previous.state.authUserId !== session.user.id)
          return { state: { kind: 'loading' }, checking: true };
        return previous;
      });
    });
    observer.current = api.observeSessionAccess(next => {
      if (next.kind !== 'loading' && (next.kind !== 'signedIn' || next.access.accountStatus !== 'active' || youthScreenView.current?.authId !== next.authUserId)) youthScreenView.current = null;
      if (next.kind !== 'loading' && (next.kind !== 'signedIn' || next.access.accountStatus !== 'active' || youthNoticeView.current !== next.authUserId)) youthNoticeView.current = null;
      if (next.kind !== 'loading' && (next.kind !== 'signedIn' || next.access.accountStatus !== 'active' || youthView.current?.authId !== next.authUserId)) youthView.current = null;
      if (next.kind !== 'loading' && (next.kind !== 'signedIn' || next.access.accountStatus !== 'active' || !next.access.capabilities.includes('youth.registration_review') || decisionAttempt.current?.authId !== next.authUserId)) decisionAttempt.current = null;
      setSession(previous => sessionPresentation(previous, next));
      if (next.kind !== 'loading' && (next.kind !== 'signedIn' || next.access.accountStatus !== 'active' || !next.access.capabilities.includes('youth.registration_review') || correctionAttempt.current?.authId !== next.authUserId)) correctionAttempt.current = null;
    });
    const focus = () => { void refresh(); };
    const visible = () => { if (document.visibilityState === 'visible') focus(); };
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', visible);
    return () => { observer.current?.dispose(); observer.current = null; identity.data.subscription.unsubscribe();
      window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visible); };
  }, [refresh]);
  async function signOut() {
    if (!api || signingOut) return;
    youthView.current = null;
    youthScreenView.current = null; youthNoticeView.current = null;
    decisionAttempt.current = null;
    correctionAttempt.current = null;
    setSession({ state: { kind: 'loading' }, checking: true });
    setSigningOut(true); setFeedback(null);
    try {
      const result = await api.signOut();
      setFeedback(result.kind === 'ok' ? { error: false, message: 'You are signed out. Other workspaces may stay signed in.' } :
        { error: true, message: 'We could not confirm sign-out. Check your account status and try again.' });
      await refresh();
    } finally { setSigningOut(false); }
  }
  return <Context.Provider value={{ state, checking, profileVersion, notifyProfileChange, youthView, youthScreenView, youthNoticeView, decisionAttempt, correctionAttempt, api, refresh, signOut, signingOut, feedback, clearFeedback: () => setFeedback(null) }}>{children}</Context.Provider>;
}
export function useYouthAuth() {
  const value = useContext(Context);
  if (!value) throw Error('YouthAuthProvider missing');
  return value;
}
