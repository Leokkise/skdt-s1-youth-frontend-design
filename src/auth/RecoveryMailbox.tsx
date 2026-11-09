import LoadingAction from '../demo/LoadingAction';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { mailboxService, recoveryMessage } from './recovery-services';

export default function RecoveryMailbox() {
  const [mode,setMode]=useState<'verify'|'password'>('verify');
  const [caseId,setCaseId]=useState(''),[code,setCode]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[finished,setFinished]=useState(false);
  const live = useRef(true), lock = useRef(false);
  const passwordRetry = useRef<{caseId:string;code:string;password:string;confirmation:string}|null>(null);
  const [uncertain,setUncertain]=useState(false);
  useEffect(()=>{live.current=true;return()=>{live.current=false;passwordRetry.current=null;};},[]);
  async function submit(event:{preventDefault:()=>void}) {
    event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');
    if(mode==='password')passwordRetry.current ||= {caseId:caseId.trim(),code:code.trim(),password,confirmation};
    const attempt=passwordRetry.current;
    const result=mode==='verify'?await mailboxService.verify(caseId.trim(),code.trim()):await mailboxService.password(attempt!.caseId,attempt!.code,attempt!.password,attempt!.confirmation);
    lock.current=false;if(!live.current)return;
    setBusy(false);
    const unresolved=mode==='password'&&['pending','unavailable'].includes(result.kind);setUncertain(unresolved);
    if(!unresolved){passwordRetry.current=null;setPassword('');setConfirmation('');}
    if(unresolved){setMessage('Your password update is unconfirmed. Retry the same password setup request; do not choose a different password yet.');return;}
    if(result.kind==='completed'){setCode('');setFinished(true);setMessage('Your replacement email is verified and your registered email has been updated. If you need a new password, use Forgot password on the sign-in page with your new email.');}
    else if(result.kind==='ok'){setCode('');setFinished(true);setMessage('Your password has been set. Sign in with your new email and password.');}
    else if(result.kind==='pending')setMessage('Your request is pending confirmation. Contact the staff member handling your case before starting another recovery.');
    else setError(result.kind==='invalid'?'Check the case ID, code and matching password requirements. Codes may be expired or incorrect.':result.kind==='denied'?'This recovery is unavailable, expired or no longer authorized. Contact barangay staff.':recoveryMessage(result.kind));
  }
  function changeMode(next:'verify'|'password'){setMode(next);setCode('');setPassword('');setConfirmation('');setError('');setMessage('');setFinished(false);passwordRetry.current=null;setUncertain(false);}
  return <main id="main-content" className="container account-main"><section className="profile-card account-preview account-form recovery-mailbox"><h1>Complete account recovery</h1><p>Check your recovery email, then choose the action that matches your code.</p>
    <div className="recovery-mode-switch" role="group" aria-label="Recovery action"><button type="button" aria-pressed={mode==='verify'} disabled={busy||uncertain} onClick={()=>{if(mode!=='verify')changeMode('verify');}}>Verify new email</button><button type="button" aria-pressed={mode==='password'} disabled={busy||uncertain} onClick={()=>{if(mode!=='password')changeMode('password');}}>Set password</button></div>
    <div className="recovery-mode-intro"><h2>{mode==='verify'?'Confirm your replacement email':'Choose a new password'}</h2><p>{mode==='verify'?'Copy the case ID and email verification code from the message sent to your replacement email.':'After your email change is complete, use the separate password setup code sent to your new email. The email verification code won’t work here.'}</p></div>
    {error&&<p role="alert" className="auth-error">{error}</p>}{message&&<p role="status">{message}</p>}
    {!finished&&<form onSubmit={submit}><fieldset className="auth-fields" disabled={busy||uncertain}><div className="profile-fields"><div className="profile-field wide"><label htmlFor="mailbox-case">Case ID</label><input id="mailbox-case" placeholder="Paste the case ID from your email" aria-describedby="mailbox-case-hint" required autoComplete="off" maxLength={36} pattern="[0-9a-fA-F-]{36}" value={caseId} onChange={e=>setCaseId(e.target.value)}/><p id="mailbox-case-hint" className="field-hint">Use the case ID in your email, not the office case reference.</p></div><div className="profile-field wide"><label htmlFor="mailbox-code">{mode==='verify'?'Email verification code':'Password setup code'}</label><input id="mailbox-code" placeholder="Paste your 64-character code" aria-describedby="mailbox-code-hint" required autoComplete="one-time-code" maxLength={64} pattern="[0-9a-f]{64}" value={code} onChange={e=>setCode(e.target.value)} /><p id="mailbox-code-hint" className="field-hint">Codes expire after 15 minutes. Use the code for the action selected above.</p></div>{mode==='password'&&<><div className="profile-field wide"><label htmlFor="mailbox-password">New password</label><input id="mailbox-password" placeholder="8–72 characters" required type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)}/></div><div className="profile-field wide"><label htmlFor="mailbox-confirm">Confirm new password</label><input id="mailbox-confirm" placeholder="Re-enter your new password" required type="password" autoComplete="new-password" minLength={8} maxLength={72} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></div></>}</div><div className="form-actions"><LoadingAction busy={busy}>{mode==='verify'?'Verify and update email':'Set new password'}</LoadingAction></div></fieldset></form>}
    {uncertain&&<LoadingAction busy={busy} onClick={e=>{void submit(e);}}>Retry same password setup</LoadingAction>}
    <Link className="secondary-button signin-home" to="/youth/demo/sign-in">Back to sign in</Link>
    <p className="recovery-mailbox-privacy">Keep your password and recovery codes private. Never share them with anyone.</p>
    <nav className="account-links" aria-label="Recovery help"><Link to="/youth/account-help">Need help with your recovery?</Link></nav>
  </section></main>;
}
