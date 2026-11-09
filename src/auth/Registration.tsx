import YouthIcon from '../demo/YouthIcon';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import LoadingAction from '../demo/LoadingAction';
import { useYouthAuth } from './AuthProvider';
import { registrationV2 } from './registration-v2';
import type { RegistrationFailureV2 } from '../../contracts/v1/registration-v2';

const messages: Record<RegistrationFailureV2['kind'], string> = {
  invalidEmail: 'Use your assigned email ending in @example.invalid.',
  invalidCode: 'That code is invalid, expired or superseded. Check it or request a new code.',
  invalidPassword: 'Passwords must match, with at least 8 characters and at most 72 UTF-8 bytes.',
  setupRejected: 'This registration proof is no longer accepted. Start again to verify your email.',
  conflict: 'Another registration operation is in progress. Sign in or start a new email verification.',
  rateLimited: 'Too many requests. Wait before trying again; code requests have a 60-second cooldown.',
  needsSupport: 'This account needs staff assistance. Contact the SK office before continuing.',
  unavailable: 'Registration is unavailable. Try again later. Existing accounts can still sign in.',
};
type Secrets = { attemptId: string; attemptToken: string; setupToken: string; expiresAt: string; password: string; confirmation: string; requestId: string };
const empty = (): Secrets => ({ attemptId: '', attemptToken: '', setupToken: '', expiresAt: '', password: '', confirmation: '', requestId: '' });
export default function Registration() {
  const { state } = useYouthAuth();
  const [provider] = useState(() => registrationV2());
  const [stage, setStage] = useState<'entry' | 'code' | 'password' | 'retry' | 'complete' | 'existing'>('entry');
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState(''), [code, setCode] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const secrets = useRef(empty()), epoch = useRef(0), locked = useRef(false);
  const alert = useRef<HTMLParagraphElement>(null);
  const identity = state.kind === 'signedIn' ? state.authUserId : null;
  function clear() { ++epoch.current; secrets.current = empty(); locked.current = false; setPassword(''); setConfirmation(''); setCode(''); setBusy(false); }
  function restart() { clear(); setError(''); setStage('entry'); }
  useEffect(() => { return () => { ++epoch.current; secrets.current = empty(); }; }, []);
  useEffect(() => { clear(); setStage('entry'); }, [identity]);
  useEffect(() => { if (error) alert.current?.focus(); }, [error]);
  if (identity) return <Navigate to="/youth/account" replace />;
  function failure(kind: RegistrationFailureV2['kind']) {
    setError(messages[kind]);
    if (['setupRejected', 'conflict', 'needsSupport'].includes(kind)) { clear(); setStage('entry'); }
  }
  async function complete(current: number) {
    const s = secrets.current;
    if (Date.parse(s.expiresAt) <= Date.now()) { failure('setupRejected'); return; }
    s.requestId ||= crypto.randomUUID();
    const result = await provider.complete(s.attemptId, s.setupToken, s.password, s.confirmation, s.requestId);
    if (current !== epoch.current) return;
    if (result.kind === 'complete' || result.kind === 'existingAccount') { clear(); setStage(result.kind === 'complete' ? 'complete' : 'existing'); }
    else if (result.kind === 'unavailable') { setStage('retry'); setError('The completion result is uncertain. Retry the same password setup, or restart verification. You can also try ordinary sign-in.'); }
    else if (result.kind === 'invalidPassword') { s.password = ''; s.confirmation = ''; s.requestId = ''; setStage('password'); failure(result.kind); }
    else failure(result.kind);
  }
  async function act(resend = false) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    const current = epoch.current;
    try {
      if (stage === 'entry' || resend) {
        if (!resend && (password !== confirmation || [...password].length < 8 || new TextEncoder().encode(password).length > 72)) { failure('invalidPassword'); return; }
        const retained = resend ? { password: '', confirmation: '' } : { password, confirmation };
        secrets.current = empty(); setPassword(''); setConfirmation(''); setCode('');
        const result = await provider.request(email);
        if (current !== epoch.current) return;
        if (result.kind === 'checkEmail') { secrets.current = { ...empty(), ...retained, attemptId: result.attemptId, attemptToken: result.attemptToken }; setStage('code'); }
        else { setStage('entry'); failure(result.kind); }
      } else if (stage === 'code') {
        const s = secrets.current;
        const result = await provider.verify(s.attemptId, s.attemptToken, code);
        if (current !== epoch.current) return;
        setCode('');
        if (result.kind === 'existingAccount') { clear(); setStage('existing'); }
        else if (result.kind === 'passwordRequired') {
          s.attemptToken = ''; s.setupToken = result.setupToken; s.expiresAt = result.expiresAt;
          if (s.password) await complete(current); else setStage('password');
        } else failure(result.kind);
      } else if (stage === 'password' || stage === 'retry') {
        if (stage === 'password') {
          if (password !== confirmation || [...password].length < 8 || new TextEncoder().encode(password).length > 72) { failure('invalidPassword'); return; }
          secrets.current.password = password; secrets.current.confirmation = confirmation;
          setPassword(''); setConfirmation('');
        }
        await complete(current);
      }
    } finally { if (current === epoch.current) { locked.current = false; setBusy(false); } }
  }
  function submit(event: FormEvent) { event.preventDefault(); void act(); }
  const finished = stage === 'complete' || stage === 'existing';
  return <main id="main-content" className="container account-main"><Link className="back-link" to="/youth" onClick={clear}>← Back to home</Link>
    <section className={`profile-card account-preview account-form account-registration${stage === 'complete' ? ' registration-complete' : ''}`} aria-labelledby="registration-title">
      <h1 id="registration-title">{stage === 'code' ? 'Confirm email' : stage === 'password' ? 'Set password' : stage === 'complete' ? 'Registration complete' : stage === 'existing' ? 'Account already registered' : 'Create account'}{stage === 'complete' && <span className="registration-success-icon" aria-hidden="true"><YouthIcon name="check" /></span>}</h1>
      {stage === 'code' && <p>Enter the six-digit code sent to <strong>{email.trim()}</strong>. It expires in 10 minutes.</p>}
      {stage === 'password' && <p>Email ownership verified. Re-enter your desired password to finish registration.</p>}
      {stage === 'complete' && <p role="status">Your account is ready. Sign in to start your youth profiling.</p>}
      {stage === 'existing' && <p role="status">Your email belongs to an existing account. Sign in or ask staff for recovery assistance.</p>}
      {error && <p className="auth-error" role="alert" tabIndex={-1} ref={alert}>{error}</p>}
      {!finished && <form onSubmit={submit} aria-busy={busy}><fieldset className="auth-fields" disabled={busy || state.kind === 'loading'}><div className="profile-fields">
        {stage === 'entry' && <div className="profile-field wide"><label htmlFor="registration-email">Email address</label><input id="registration-email" type="email" autoComplete="username" placeholder="name@example.invalid" required value={email} onChange={e => { clear(); setEmail(e.target.value); }} /></div>}
        {(stage === 'entry' || stage === 'password') && <><div className="profile-field wide"><label htmlFor="registration-password">Password</label><input id="registration-password" placeholder="Enter at least 8 characters" type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} /></div><div className="profile-field wide"><label htmlFor="registration-confirm">Confirm password</label><input id="registration-confirm" placeholder="Re-enter your password" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div></>}
        {stage === 'code' && <div className="profile-field wide"><label htmlFor="registration-code">Confirmation code</label><input id="registration-code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" required value={code} onChange={e => setCode(e.target.value)} /></div>}
      </div><div className={`form-actions confirmation-actions${stage === 'code' ? ' confirmation-code-actions' : ''}`}><LoadingAction busy={busy} type="submit">{stage === 'entry' ? 'Create account' : stage === 'code' ? 'Verify' : stage === 'retry' ? 'Retry same password setup' : 'Set password'}</LoadingAction>{stage === 'code' && <button type="button" className="secondary-button" onClick={() => { void act(true); }}>Resend code</button>}</div></fieldset></form>}
      {!finished && stage !== 'entry' && stage !== 'code' && <button className="text-button" type="button" onClick={restart}>Cancel and start again</button>}
      <Link className={`${stage === 'complete' ? 'button' : 'secondary-button'} signin-home`} to="/youth/demo/sign-in" onClick={clear}>Sign in</Link>
      {stage !== 'code' && stage !== 'complete' && <nav className="account-links" aria-label="Account help"><Link to="/youth/demo/forgot-password" onClick={clear}>Forgot password?</Link><Link to="/youth/account-help" onClick={clear}>Contact staff for help</Link></nav>}
    </section></main>;
}
