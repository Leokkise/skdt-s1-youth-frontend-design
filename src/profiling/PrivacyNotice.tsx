import LoadingAction from '../demo/LoadingAction';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Answers } from './fields';
import profilingNotice from '../../contracts/v1/s1-profiling-notice.json';

export const NOTICE_VERSION = 'talipapa-preview-2026-10-13';
export function PrivacyNoticeText() {
  return <>
    <p id="privacy-intro" className="privacy-greeting"><strong>Mabuhay, Kabataang Talipapa!</strong></p>
    <p>We encourage the Youth residing at Barangay Talipapa to filled out the Online KK Youth Profiling with honesty according to the best of their knowledge.</p>
    <section className="privacy-section"><h3>Who can fill out this KK Youth Profiling?</h3><ul className="privacy-eligibility"><li>must be a bonafide resident of Barangay Talipapa</li><li>must be ages 15 to 30 Years old</li></ul></section>
    <div className="privacy-section">
      <p>As mandated by the SK Reform Act of 2015 or RA 10742, Sangguniang Kabataan Officials are required to conduct a Katipunan ng Kabataan Youth Profiling to gather data for their barangay particularly for the youth ages 15 and not more than 30 years old.</p>
      <p>This Katipunan ng Kabataan (KK) Online Youth Profiling serves as gathering information's of the KK Members that is needed for the Data's of the Sangguniang Kabataan Council that is necessarily to get ideas, suggestions, recommendations for future plans and projects of their fellow KK members in their respective Barangay.</p>
      <p>Rest assured that all information's answered in this Online Youth Profiling is secured and private and must not shared or leaked to anyone.</p>
      <p><strong>Thank you, Kabataang Talipapa!</strong></p>
    </div>
  </>;
}
export default function PrivacyGate({ onAccept, persistAcceptance, encoder = false, saved = false, databaseEncoder = false }: { onAccept: (receipt: Answers) => void; persistAcceptance?: () => Promise<boolean>; encoder?: boolean; saved?: boolean; databaseEncoder?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const terms = useRef<HTMLElement>(null), privacy = useRef<HTMLDetailsElement>(null);
  function openPolicy(event: MouseEvent<HTMLAnchorElement>, policy: 'terms' | 'privacy') {
    event.preventDefault();
    const section = policy === 'terms' ? terms.current : privacy.current;
    if (section) { section.querySelector('h3')?.focus(); section.scrollIntoView({block: 'nearest'}); }
  }
  const [checked, setChecked] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  async function accept() {
    if (!checked || busy) return;
    setBusy(true); setError('');
    let confirmed = !persistAcceptance;
    try { if (persistAcceptance) confirmed = await persistAcceptance(); } catch { confirmed = false; }
    if (!live.current) return;
    setBusy(false);
    if (!confirmed) { setError('Your consent could not be confirmed. Retry or leave profiling.'); return; }
    onAccept({ privacyConsent: 'true', privacyAcceptedAt: new Date().toISOString(), noticeVersion: saved ? profilingNotice.version : NOTICE_VERSION });
  }
  useEffect(() => { dialog.current?.showModal(); title.current?.focus(); return () => dialog.current?.close(); }, []);
  return <dialog ref={dialog} className="privacy-dialog" aria-labelledby="privacy-title" onCancel={event => event.preventDefault()}>
    <header className="privacy-dialog-header"><h2 ref={title} tabIndex={-1} id="privacy-title">{saved ? profilingNotice.title : 'KABATAANG TALIPAPA ONLINE PROFILING'}</h2></header>
    <div className="privacy-dialog-content" tabIndex={0} role="region" aria-label="Profiling and privacy notice">{saved ? <>
      <p className="privacy-greeting"><strong>Mabuhay, Kabataang Talipapa!</strong></p>
      <p>We encourage young residents of Barangay Talipapa to complete this Online KK Youth Profiling honestly and to the best of their knowledge.</p>
      <section className="privacy-section"><h3>Who can fill out this KK Youth Profiling?</h3><ul className="privacy-eligibility"><li>Residents of Barangay Talipapa</li><li>Youth aged 15 to 30 years old</li></ul></section>
      <p>Under the Sangguniang Kabataan Reform Act of 2015 (RA 10742), youth profiling supports the SK’s youth database and program planning.</p>
      <p>This profiling gathers information, ideas, suggestions and recommendations to help the SK Council plan programs, activities and projects for the youth of Barangay Talipapa.</p>
      <section ref={terms} className="privacy-section" id="profiling-terms" aria-labelledby="profiling-terms-title"><h3 id="profiling-terms-title" tabIndex={-1}>Terms of Use</h3>
        <p>Provide truthful and accurate information to the best of your knowledge. Review your answers before submitting them.</p>
        <p>Submitting a profile does not verify your identity or residency. Use fictional information only in this local development system.</p>
      </section>
      <section ref={privacy} className="privacy-section" id="profiling-data-privacy" aria-labelledby="profiling-privacy-title"><h3 id="profiling-privacy-title" tabIndex={-1}>Data Privacy Policy</h3>
        <p>Your profile, including supplied household and family information, is used for staff review, requested corrections, private registry reports and aggregate statistics.</p>
        <p>The authorized chairperson, treasurer and secretary may review your answers and correction history and download approved profiles. Your information is not for public release.</p>
        <p>Your draft, submitted profile and consent record remain saved after sign-out. Consent is recorded with your account and acceptance time. Retention, withdrawal and deletion procedures are still being finalized; no deletion date is promised.</p>
      </section>
    </> : databaseEncoder ? <><PrivacyNoticeText /><p>Walk-in profile entry. The staff encoder records their own attestation at submission; this is not a youth or guardian consent receipt. The complete encoder notice appears before submission.</p></> : <><PrivacyNoticeText /><aside className="privacy-section privacy-preview" aria-label="Profile information"><h3>About your information</h3><p>Answers in this session remain in the current tab and clear on reload. Staff screens in this tab can view submitted answers. This path does not save to the database.</p>{encoder && <p>Staff encoding records the encoder’s acknowledgment; it does not establish personal consent from the youth or guardian.</p>}</aside></>}</div>
    <footer className="privacy-dialog-footer"><label className="certification"><input type="checkbox" disabled={busy} checked={checked} onChange={event => setChecked(event.target.checked)} /><span>{saved ? <>By checking this box, I confirm that I have read and agree to the <a href="#profiling-data-privacy" onClick={event => openPolicy(event, 'privacy')}>Data Privacy Policy</a> and <a href="#profiling-terms" onClick={event => openPolicy(event, 'terms')}>Terms of Use</a>. I consent to the collection and use of my information for youth profiling as described.</> : 'I understand and consent.'}</span></label>
    {error && <p role="alert" className="auth-error">{error}</p>}<div className="form-actions"><Link className="secondary-button" to={encoder ? '/admin/youth/dashboard' : '/youth'}>Leave profiling</Link><LoadingAction busy={busy} disabled={!checked} onClick={() => { void accept(); }}>Continue to profiling</LoadingAction></div></footer>
  </dialog>;
}
