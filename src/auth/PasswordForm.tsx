import LoadingAction from '../demo/LoadingAction';
import StatusToast from '../demo/StatusToast';
import { LoadingSpinner } from '../demo/StaffLoading';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { passwordService, useYouthAuth } from './AuthProvider';

export default function PasswordForm({ recovery = false, embedded = false }: { recovery?: boolean; embedded?: boolean }) {
  const api = useMemo(passwordService, []);
  const { state, checking } = useYouthAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<'request' | 'code' | 'password'>(recovery ? 'request' : 'password');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [cleanup, setCleanup] = useState(false);
  const [restarting,setRestarting] = useState(false);
  const [message, setMessage] = useState('');
  const dismissMessage = useCallback(() => setMessage(''), []);
  const [error, setError] = useState('');
  const alert = useRef<HTMLParagraphElement>(null);
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; if (recovery) void api?.cancelRecovery(); }; }, [api, recovery]);
  useEffect(() => { if (error) alert.current?.focus(); }, [error]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!api || busy || restarting || cleanup || (!recovery && checking)) return;
    setError(''); setMessage('');
    if (recovery && !email.trim().toLowerCase().endsWith('@example.invalid')) { setError('Use a @example.invalid address.'); return; }
    if (stage === 'password' && password !== confirmation) { setError('The passwords do not match. Enter them again.'); return; }
    if (!recovery && stage === 'password' && current === password) { setError('You cannot use your current password as your new password. Choose a different password.'); return; }
    setBusy(true);
    const result = stage === 'request' ? await api.requestRecovery(email.trim()) : stage === 'code' ? await api.confirmRecovery(email.trim(), code.trim()) :
      recovery ? await api.finishRecovery(password, confirmation) : await api.change(current, password, confirmation);
    if (!live.current) return;
    setCurrent(''); setPassword(''); setConfirmation(''); setCode(''); setBusy(false);
    if (result.kind === 'checkEmail') { setStage('code'); setMessage(''); }
    else if (result.kind === 'ok' && stage === 'code') setStage('password');
    else if (result.kind === 'ok') {
      if (recovery) navigate('/youth/demo/sign-in', { replace: true, state: { passwordChanged: true } });
      else setMessage('Your password has been updated.');
    } else if (result.kind === 'signOutRequired') {
      setCleanup(true); setError('Your password changed, but sign-out cleanup is incomplete. Reload before signing in with your new password.');
    } else setError(result.kind === 'invalidPassword' ? 'Use matching new passwords of 8–72 characters, different from your old password.' :
      result.kind === 'rateLimited' ? 'Too many requests. Wait before trying again.' :
      result.kind === 'rejected' ? stage === 'code' ? 'Recovery code is invalid or expired. Request a code again.' : 'Password check failed. Check your current password or request recovery again.' :
      'Password service unavailable. Try again. If a password update had an unknown outcome, try signing in or use recovery.');
  }
  async function resend() {
    if (!api || busy || restarting || cleanup) return;
    setRestarting(true); setError(''); setMessage('');
    try {
      const cancelled = await api.cancelRecovery();
      if (!live.current) return;
      if (cancelled.kind !== 'ok') { setError('Recovery could not be restarted. Try again.'); return; }
      setCode(''); setPassword(''); setConfirmation(''); setStage('code');
      const sent = await api.requestRecovery(email.trim());
      if (!live.current) return;
      if (sent.kind === 'checkEmail') setMessage('If recovery is available, check your email for a new code.');
      else setError(sent.kind === 'rateLimited' ? 'Please wait before requesting another code.' : 'A new code could not be requested. Try again.');
    } catch { if (live.current) setError('A new code could not be requested. Try again.'); }
    finally { if (live.current) setRestarting(false); }
  }
  if (!recovery && !embedded && !busy && !cleanup && state.kind === 'loading') return <p role="status"><LoadingSpinner />Checking your account…</p>;
  if (!recovery && !busy && !cleanup && state.kind === 'signedOut') return <Navigate to="/youth/demo/sign-in" replace />;
  if (!recovery && !busy && !cleanup && state.kind !== 'signedIn' && !(embedded && state.kind === 'loading')) return <Navigate to="/youth/account" replace />;
  const Heading = embedded ? 'h3' : 'h1';
  return <section className={embedded ? 'settings-password-form' : 'profile-card account-preview account-form'} aria-labelledby="password-title">
    {!embedded && <Heading id="password-title">{recovery ? 'Forgot password' : 'Change password'}</Heading>}
    <p>{recovery ? stage === 'request' ? 'Enter your email to receive a recovery code.' : stage === 'code' ? 'Enter the six-digit code from your email.' : 'Choose your new password.' : 'Enter your current password to confirm this change. You’ll stay signed in after updating it.'}</p>
    {message && (recovery ? <p role="status">{message}</p> : <StatusToast message={message} onClose={dismissMessage} />)}
    {error && <p ref={alert} tabIndex={-1} role="alert" className="auth-error">{error}</p>}
    {cleanup ? <button className="button" onClick={() => window.location.assign('/youth/demo/sign-in')}>Reload and check sign-in</button> : <form onSubmit={submit}>
      <fieldset className="auth-fields" disabled={busy || restarting || !api || (!recovery && (checking || state.kind !== 'signedIn'))}><div className="profile-fields">
        {recovery && stage !== 'password' && <div className="profile-field wide"><label htmlFor="recovery-email">Email address</label><input id="recovery-email" type="email" placeholder="name@example.invalid" autoComplete="username" required readOnly={stage === 'code'} value={email} onChange={e => setEmail(e.target.value)} /></div>}
        {stage === 'code' && <div className="profile-field wide"><label htmlFor="recovery-code">Recovery code</label><input id="recovery-code" required pattern="[0-9]{6}" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} /></div>}
        {stage === 'password' && <>
          {!recovery && <div className="profile-field wide"><label htmlFor="current-password">Current password</label><input id="current-password" type="password" placeholder="••••••••" autoComplete="current-password" required value={current} onChange={e => setCurrent(e.target.value)} /></div>}
          <div className="profile-field wide"><label htmlFor="new-password">New password</label><input id="new-password" type="password" placeholder="••••••••" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></div>
          <div className="profile-field wide"><label htmlFor="confirm-new-password">Confirm new password</label><input id="confirm-new-password" type="password" placeholder="••••••••" autoComplete="new-password" required minLength={8} maxLength={72} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div>
        </>}
      </div><div className={`form-actions${recovery && stage === 'code' ? ' confirmation-actions confirmation-code-actions' : ''}`}><LoadingAction busy={busy}>{stage === 'request' ? 'Send recovery code' : stage === 'code' ? 'Verify code' : 'Update password'}</LoadingAction>
      </div>
      {recovery && stage === 'code' && <section className="password-code-help" aria-labelledby="password-code-help-title"><h2 id="password-code-help-title">Didn’t receive a code?</h2><p>Check spam or request a new code.</p><LoadingAction className="secondary-button" type="button" busy={restarting} onClick={() => { void resend(); }}>Send a new code</LoadingAction></section>}
      </fieldset>
    </form>}
    {recovery && <Link className="secondary-button signin-home" to="/youth/demo/sign-in">Back to sign in</Link>}
    <nav className="account-links" aria-label="Account help">{!recovery && <Link to="/youth/account">Back to my account</Link>}{recovery && <Link to="/youth/account-help">Can’t access your email?</Link>}</nav>
  </section>;
}
