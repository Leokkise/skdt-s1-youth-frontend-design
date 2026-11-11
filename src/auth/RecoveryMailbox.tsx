import LoadingAction from '../demo/LoadingAction';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { mailboxService, recoveryMessage } from './recovery-services';

export default function RecoveryMailbox() {
  const [caseId,setCaseId]=useState(''),[code,setCode]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[finished,setFinished]=useState(false);
  const live = useRef(true), lock = useRef(false);
  useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
  async function submit(event:{preventDefault:()=>void}) {
    event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');
    const result=await mailboxService.verify(caseId.trim(),code.trim());
    lock.current=false;if(!live.current)return;
    setBusy(false);
    if(result.kind==='completed'){setCode('');setFinished(true);setMessage('Your replacement email is verified and your registered email has been updated. If you need a new password, use Forgot password on the sign-in page with your new email.');}
    else if(result.kind==='pending')setMessage('Your request is pending confirmation. Contact the staff member handling your case before starting another recovery.');
    else setError(result.kind==='invalid'?'Check the case ID and email verification code. The code may be expired or incorrect.':result.kind==='denied'?'This recovery is unavailable, expired or no longer authorized. Contact barangay staff.':recoveryMessage(result.kind));
  }
  return <main id="main-content" className="container account-main"><section className="profile-card account-preview account-form recovery-mailbox"><h1>Verify your new email</h1><p>Enter the case ID and verification code sent to your new email.</p>
    {error&&<p role="alert" className="auth-error">{error}</p>}{message&&<p role="status">{message}</p>}
    {!finished&&<form onSubmit={submit}><fieldset className="auth-fields" disabled={busy}><div className="profile-fields"><div className="profile-field wide"><label htmlFor="mailbox-case">Case ID</label><input id="mailbox-case" placeholder="Paste the case ID from your email" aria-describedby="mailbox-case-hint" required autoComplete="off" maxLength={36} pattern="[0-9a-fA-F-]{36}" value={caseId} onChange={e=>setCaseId(e.target.value)}/><p id="mailbox-case-hint" className="field-hint">Copy the case ID from your recovery email.</p></div><div className="profile-field wide"><label htmlFor="mailbox-code">Verification code</label><input id="mailbox-code" placeholder="Paste your 64-character code" aria-describedby="mailbox-code-hint" required autoComplete="one-time-code" maxLength={64} pattern="[0-9a-f]{64}" value={code} onChange={e=>setCode(e.target.value)} /><p id="mailbox-code-hint" className="field-hint">Verification codes expire after 15 minutes.</p></div></div><div className="form-actions"><LoadingAction busy={busy}>Verify and update email</LoadingAction></div></fieldset></form>}
    
    <p className="recovery-mailbox-privacy">Never share your password or recovery codes.</p>
    <nav className="account-links" aria-label="Recovery help"><Link to="/youth/account-help">Need help?</Link></nav>
  </section></main>;
}
