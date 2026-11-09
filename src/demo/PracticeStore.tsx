import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { useYouthAuth } from '../auth/AuthProvider';
import useProfilePicture from './useProfilePicture';
import { type Answers } from '../profiling/fields';
import { registryFixtures } from './registryData';
import { validate } from '../profiling/validation';
import { consentReceipt, formatKkNumber, correctResponse, recordDecision, type FixtureReview, type PracticeResponse } from './presentationWorkflow';
export type { PracticeResponse } from './presentationWorkflow';
type PracticeStore = { profilePicture: string | null; setProfilePicture: (picture: string | null) => void; adminSignedIn: boolean; adminSignIn: () => void; adminSignOut: () => void; fixtureReviews: Record<string, FixtureReview>; decideFixture: (key: string, status: PracticeResponse['status'], note: string, correctionFields?: string[]) => void; signedIn: boolean; accountCreated: boolean; createAccount: () => void; signIn: () => void; signOut: () => void; profileKey: string | null; responses: PracticeResponse[]; submit: (answers: Answers, date: string, assignToYouth?: boolean) => void; resubmit: (key: string, answers: Answers) => void; decide: (key: string, status: PracticeResponse['status'], note: string, correctionFields?: string[]) => void; reset: () => void };
const Context = createContext<PracticeStore | null>(null);
export function PracticeProvider({ children }: { children: ReactNode }) {
  const nextKk = useRef(registryFixtures.length + 1);
  const { state } = useYouthAuth();
  const owner = state.kind === 'signedIn' && state.access.accountStatus === 'active' ? state.authUserId : null;
  const [profilePicture, setProfilePicture] = useProfilePicture(owner);
  const [fixtureReviews, setFixtureReviews] = useState<PracticeStore['fixtureReviews']>({});
  const [adminSignedIn, setAdminSignedIn] = useState(true);
  const [responses, setResponses] = useState<PracticeResponse[]>([]);
  const [signedIn, setSignedIn] = useState(true);
  const [accountCreated, setAccountCreated] = useState(false);
  const [profileKey, setProfileKey] = useState<string | null>(null);
  return <Context.Provider value={{ profilePicture, setProfilePicture, adminSignedIn, adminSignIn: () => setAdminSignedIn(true), adminSignOut: () => setAdminSignedIn(false), fixtureReviews, decideFixture: (key, status, note, correctionFields = []) => {
    const at = new Date().toISOString();
    setFixtureReviews(previous => ({ ...previous, [key]: recordDecision(previous[key] || { history: registryFixtures.find(record => record.key === key)?.history || [] }, status, note, at, correctionFields) }));
  }, signedIn, accountCreated, profileKey, createAccount: () => setAccountCreated(true), signIn: () => setSignedIn(true), signOut: () => setSignedIn(false), responses, submit: (answers, referenceDate, assignToYouth = true) => {
    if (Object.keys(validate(answers, referenceDate)).length) throw new Error('Please check the practice answers.');
    const consent = consentReceipt(answers);
    const response: PracticeResponse = { kkNumber: formatKkNumber(nextKk.current++), consent, key: 'practice-' + crypto.randomUUID(), answers: { ...answers }, referenceDate, status: 'For review', note: '', history: [{ action: assignToYouth ? 'Profile submitted' : 'Walk-in profile submitted', actor: assignToYouth ? 'Synthetic youth' : 'Synthetic staff', at: new Date().toISOString(), note: '', consent }] };
    setResponses(previous => [...previous, response]);
    if (signedIn && assignToYouth) setProfileKey(response.key);
  }, resubmit: (key, answers) => {
    const at = new Date().toISOString();
    setResponses(previous => previous.map(response => response.key === key ? correctResponse(response, answers, at) : response));
  }, decide: (key, status, note, correctionFields = []) => {
    const at = new Date().toISOString();
    setResponses(previous => previous.map(response => response.key === key ? { ...response, ...recordDecision(response, status, note, at, correctionFields) } : response));
  }, reset: () => { nextKk.current = registryFixtures.length + 1; setProfilePicture(null); setFixtureReviews({}); setResponses([]); setProfileKey(null); } }}>{children}</Context.Provider>;
}
export function usePractice() { const store = useContext(Context); if (!store) throw new Error('PracticeProvider missing'); return store; }
