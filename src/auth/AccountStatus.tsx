import LoadingAction from '../demo/LoadingAction';
import YouthWorkspacePending from './YouthWorkspacePending';
import { useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useYouthAuth } from './AuthProvider';
import SavedYouth from './SavedYouth';
export default function AccountStatus() {
  const { state, checking, api, refresh, signOut, signingOut, feedback } = useYouthAuth();
  const alert = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (feedback?.error) alert.current?.focus(); }, [feedback]);
  if (state.kind === 'signedOut') return <Navigate to="/youth/demo/sign-in" replace />;
  if (state.kind === 'loading') return <YouthWorkspacePending />;
  if (state.kind === 'signedIn' && state.access.accountStatus === 'active') return <div className="auth-workspace" aria-busy={checking} inert={checking || undefined}><SavedYouth key={state.authUserId} /></div>;
  const status = state.kind === 'signedIn' ? state.access.accountStatus : null;
  const title = state.kind === 'unavailable' ? 'Sign-in unavailable' :
    state.kind === 'error' ? 'Unable to check your account' : status === 'suspended' ? 'Account suspended' :
    status === null ? 'Account setup pending' : 'Youth association pending';
  const description = state.kind === 'unavailable' ? 'Ask the administrator to check the local sign-in service, then try again.' :
    state.kind === 'error' ? 'We could not check your current access. Try again before continuing.' :
    status === 'suspended' ? 'Your account cannot continue. Contact the administrator for help.' :
    status === null ? 'Your email is confirmed. A administrator still needs to provision your account.' :
    'Your account is active. Connecting accounts to youth records is not available yet.';
  return <main id="main-content" className="container account-main">
    <Link className="back-link" to="/youth">← Back to home</Link>
    <section className="profile-card account-preview" aria-labelledby="account-title">
      <h1 id="account-title">{title}</h1><p role="status">{description}</p>
      <p>Private profiling, youth records and verification remain unavailable through this account.</p>
      <p className="account-preview-note">Account access is managed by your administrator.</p>
      {feedback && <p className={feedback.error ? 'auth-error' : 'demo-feedback'} role={feedback.error ? 'alert' : 'status'} tabIndex={-1} ref={alert}>{feedback.message}</p>}
      <div className="form-actions" aria-busy={signingOut}>
        {api && <LoadingAction busy={checking} disabled={signingOut} onClick={() => { void refresh(); }}>Check setup again</LoadingAction>}
        {api && <LoadingAction className="secondary-button" busy={signingOut} onClick={() => { void signOut(); }}>Sign out</LoadingAction>}
        {state.kind === 'unavailable' && <Link to="/youth/demo/sign-in">Back to sign in</Link>}
      </div><p className="field-hint">Other workspaces may stay signed in.</p>
    </section>
  </main>;
}
