import LoadingAction from './LoadingAction';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useYouthAuth } from '../auth/AuthProvider';
import Registration from '../auth/Registration';

type View = 'Sign in' | 'Create account' | 'Confirm email' | 'Forgot password' | 'Reset password';
export default function AccountPreview({ view = 'Sign in' }: { view?: View }) {
  if (view === 'Create account') return <Registration />;
  if (view === 'Confirm email') return <Navigate to="/youth/demo/create-account" replace />;
  return <SignIn />;
}
function SignIn() {
  const { state, api, refresh, clearFeedback, feedback } = useYouthAuth();
  const location = useLocation(), navigate = useNavigate();
  const [email, setEmail] = useState<string>(() => typeof location.state?.email === 'string' ? location.state.email : '');
  const [password, setPassword] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const locked = useRef(false);
  const alert = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error) alert.current?.focus(); }, [error]);
  if (state.kind === 'signedIn') return <Navigate to="/youth/account" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!api || locked.current) return;
    if (!email.trim().toLowerCase().endsWith('@example.invalid')) { setError('Use your assigned email address.'); return; }
    locked.current = true; setBusy(true); setError(''); clearFeedback();
    try {
      const result = await api.signIn(email.trim(), password);
      if (result.kind === 'ok') { await refresh(); navigate('/youth/account', { replace: true }); }
      else setError(result.kind === 'invalidCredentials' ? 'Check your email and password. To finish email verification, return to Create account.' : result.kind === 'rateLimited' ? 'Too many requests. Wait a little, then try again.' : 'The sign-in service is unavailable. Try again or ask the administrator for help.');
    } finally { setPassword(''); setBusy(false); locked.current = false; }
  }
  return <main id="main-content" className="container account-main"><section className="profile-card account-preview account-form account-signin" aria-labelledby="account-preview-title">
    <h1 id="account-preview-title">Sign in</h1>
    {!api && <p role="status">Sign-in is unavailable. Ask the administrator to check the local service, then reload.</p>}
    {state.kind === 'error' && <p role="status">Your current access could not be checked. Sign in again or retry from Account status.</p>}
    {location.state?.passwordChanged === true && <p role="status">Password updated. Sign in with your new password.</p>}
    {feedback?.error && <p role="alert">{feedback.message}</p>}
    {state.kind === 'loading' && <span className="sr-only" role="status">Checking your session…</span>}
    {error && <p className="auth-error" role="alert" tabIndex={-1} ref={alert}>{error}</p>}
    <form onSubmit={submit} aria-busy={busy}><fieldset className="auth-fields" disabled={busy || !api || state.kind === 'loading'}><div className="profile-fields">
      <div className="profile-field wide"><label htmlFor="account-email">Email address</label><input id="account-email" type="email" placeholder="name@example.invalid" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div className="profile-field wide"><label htmlFor="account-password">Password</label><input id="account-password" type="password" placeholder="••••••••" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
    </div><div className="form-actions"><LoadingAction busy={busy || state.kind === 'loading'} type="submit">Sign in</LoadingAction></div></fieldset></form>
    <Link className="secondary-button signin-home" to="/youth">Back to home</Link>
    <nav className="account-links" aria-label="Account help"><span>Don’t have an account? <Link to="/youth/demo/create-account">Create account</Link></span><Link to="/youth/demo/forgot-password">Forgot password?</Link><Link className="signin-email-help" to="/youth/account-help">Can’t access your email?</Link>{state.kind === 'error' && <Link to="/youth/account">Account status</Link>}</nav>
  </section></main>;
}
