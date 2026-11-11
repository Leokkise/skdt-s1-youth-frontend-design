import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useYouthAuth } from '../auth/AuthProvider';
import { canPresentReview } from '../auth/staff-access';
import StaffSessionNotice from '../auth/StaffSessionNotice';

export default function AdminLogin() {
  const { state, checking, api, refresh, feedback, clearFeedback } = useYouthAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (canPresentReview(state, checking)) return <Navigate to="/admin/youth/dashboard" replace />;
  if (!checking && state.kind === 'signedIn' && state.access.accountStatus === 'active' && state.access.capabilities.includes('account.recovery_manage')) return <Navigate to="/admin/youth/recovery" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!api || busy || checking) return;
    setError(''); clearFeedback();
    const address = email.trim();
    if (!address.toLowerCase().endsWith('@example.invalid')) {
      setError('Use your assigned staff email address.'); return;
    }
    setBusy(true);
    try {
      const result = await api.signIn(address, password);
      if (result.kind === 'ok') await refresh();
      else setError(result.kind === 'invalidCredentials' ? 'The email or password is incorrect. Try again.' :
        result.kind === 'rateLimited' ? 'Too many attempts. Wait a little, then try again.' : 'Sign-in is unavailable. Check the local service and try again.');
    } finally { setPassword(''); setBusy(false); }
  }
  return <main id="main-content" className="container account-main">
    <section className="profile-card account-preview staff-login-card" aria-labelledby="staff-login-title"><h1 id="staff-login-title">Staff login</h1>
      <p>Sign in with your assigned Youth Registry account.</p>
      {state.kind === 'signedIn' && <><StaffSessionNotice /><p>This session does not currently have Youth Registry access. Sign in below with your assigned staff account.</p></>}
      {!api && <p role="status">Sign-in is unavailable. Ask the administrator to check the local service, then reload.</p>}
      {checking && <span className="sr-only" role="status">Checking your account access…</span>}
      {state.kind === 'error' && <p role="alert">Account access could not be checked. Try signing in again.</p>}
      {feedback && <p role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <form className="staff-login-form" onSubmit={submit} aria-busy={busy || checking}><fieldset className="auth-fields" disabled={!api || busy || checking}>
        <div className="profile-fields"><div className="profile-field wide"><label htmlFor="staff-email">Staff email</label><input id="staff-email" type="email" placeholder="name@example.invalid" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} /></div>
          <div className="profile-field wide"><label htmlFor="staff-password">Password</label><input id="staff-password" type="password" placeholder="••••••••" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></div></div>
        <div className="form-actions"><button className="button" type="submit">{busy ? 'Signing in…' : 'Sign in'}</button></div>
      </fieldset></form><p className="field-hint">Staff accounts are assigned separately from youth signup. Enter your password privately.</p>
    </section></main>;
}
