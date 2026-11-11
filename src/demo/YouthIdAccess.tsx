import LoadingAction from './LoadingAction';
import { useEffect, useRef, useState } from 'react';
import type { Answers } from '../profiling/fields';
import { useYouthAuth } from '../auth/AuthProvider';
import { correctionService, reviewService } from '../auth/review-services';
import { youthQrProfile } from './youthQrPayload';
import { usePractice } from './PracticeStore';
import DemoQr from './DemoQr';
import YouthIcon from './YouthIcon';

export default function YouthIdAccess({ approved, responseId, answers, registration, correction = false, pending = false }: { pending?: boolean; approved: boolean; responseId?: string | null; answers?: Answers; registration?: string | null; correction?: boolean }) {
  const { state, checking, signingOut } = useYouthAuth();
  const practice = usePractice();
  const [card, setCard] = useState<{answers: Answers; registration?: string | null} | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null), live = useRef(true), request = useRef(0);
  const identity = state.kind === 'signedIn' ? state.authUserId : null;
  const active = state.kind === 'signedIn' && state.access.accountStatus === 'active' && !signingOut;
  useEffect(() => { live.current = true; return () => { live.current = false; request.current++; }; }, []);
  useEffect(() => { request.current++; setCard(null); setBusy(false); dialog.current?.close(); }, [identity, active, approved, responseId]);
  useEffect(() => { if (card) dialog.current?.showModal(); }, [card]);
  async function open() {
    if (!active || checking || !approved || !responseId || busy) return;
    const attempt = ++request.current; setBusy(true); setError('');
    const result = correction ? await correctionService?.mine() : await reviewService?.mine();
    if (!live.current || request.current !== attempt) return;
    setBusy(false);
    if (result?.kind !== 'ok' || result.data.responseId !== responseId || result.data.status !== 'approved') { setError('Your approved profile could not be confirmed. Refresh your dashboard and try again.'); return; }
    const fresh = 'answers' in result.data ? result.data : null;
    if (!fresh && !answers) { setError('Your profile details could not be loaded.'); return; }
    setCard({answers: fresh?.answers || answers!, registration: fresh?.kkNumber || registration});
  }
  return <section className="profile-card dashboard-qr">
    <div className="dashboard-id-heading"><span className="dashboard-card-icon"><YouthIcon name="qr" /></span><h2>Digital Youth ID</h2></div>
    <p>View and download your Digital Youth ID after your profile is approved.</p>
    {approved ? <LoadingAction className="secondary-button" busy={busy} disabled={pending || !active || checking || !responseId} onClick={() => { void open(); }}>View Digital Youth ID</LoadingAction> : <div className="dashboard-id-pending"><YouthIcon name="clock" /><span>Available after staff approves your profile.</span></div>}
    {error && <p role="alert">{error}</p>}
    <dialog ref={dialog} className="youth-id-dialog" aria-label="Digital Youth ID" onClose={() => setCard(null)}>
      {card && active && approved && <DemoQr onClose={() => dialog.current?.close()} checking={checking} profile={youthQrProfile(card.answers)} picture={practice.profilePicture} cardDetails={{registration: card.registration || undefined, birthdate: card.answers.birthdate, gender: card.answers.gender, contact: card.answers.contactNumber}} />}
    </dialog>
  </section>;
}
