import type { ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import StaffSessionNotice from './StaffSessionNotice';
import { useYouthAuth } from './AuthProvider';
import { canPresentReview } from './staff-access';
import DatabaseStaffScreens from './DatabaseStaffScreens';
import StaffActivity from './StaffActivity';
import { useCallback, useState } from 'react';
import YouthIcon from '../demo/YouthIcon';

function StaffGate({ children }: { children: ReactNode }) {
  const { state, checking, signingOut, refresh, feedback } = useYouthAuth();
  if (state.kind === 'signedOut') return <Navigate to="/admin/youth/login" replace />;
  // Retain the same-account form during revalidation, with controls blocked.
  if (!signingOut && canPresentReview(state, false)) return <div aria-busy={checking} inert={checking || undefined}>{children}</div>;
  const pending = checking || state.kind === 'loading' || signingOut;
  return <main id="main-content" className="container demo-main staff-access-page">
    <section className="staff-access-panel" aria-labelledby="staff-access-heading" aria-busy={pending}>
      <div className="staff-access-header">
        <div className="staff-access-symbol" aria-hidden="true"><YouthIcon name="lock" /></div>
        <h1 id="staff-access-heading">{pending ? 'Checking staff access' : state.kind === 'signedIn' ? 'Staff access required' : 'Staff access unavailable'}</h1>
      </div>
      <p className="staff-access-description" role="status">{signingOut ? 'Signing out…' : checking || state.kind === 'loading' ? 'Checking your account access…' : state.kind === 'signedIn' ?
        'This account does not currently have active Youth Registry review access.' : 'Staff access is unavailable. Check the local service and try again.'}</p>
      {state.kind === 'signedIn' && <div className="staff-access-account"><StaffSessionNotice /></div>}
      {feedback && <p role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
      {!pending && <>
        <div className="staff-access-actions">
          {state.kind === 'signedIn' && <Link className="button" to="/admin/youth/login">Sign in with a staff account</Link>}
          <button className="secondary-button" onClick={() => { void refresh(); }}>Check access again</button>
        </div>
        {state.kind === 'signedIn' && <p className="staff-access-help">Already using your staff account? Contact your system administrator to confirm your access, then check again.</p>}
      </>}
    </section>
  </main>;
}

export default function StaffWorkspace({ view = 'registry' }: { view?: 'registry' | 'dashboard' | 'reports' | 'activity' }) {
  const { state } = useYouthAuth();
  const [activityDenied, setActivityDenied] = useState(false);
  const denyActivity = useCallback(() => setActivityDenied(true), []);
  const key = (state.kind === 'signedIn' ? state.authUserId : 'closed') + view;
  return <StaffGate>{view === 'activity' ? activityDenied ? <main id="main-content" className="container demo-main"><h1>Activity Logs</h1><p role="status">Activity access changed. Reload to check access again.</p></main> : <StaffActivity key={key} denied={denyActivity} /> : <DatabaseStaffScreens key={key} view={view} />}</StaffGate>;
}
