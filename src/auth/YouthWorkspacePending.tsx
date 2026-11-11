import useYouthProfileSummary from './useYouthProfileSummary';
import { Link, useLocation } from 'react-router-dom';
import YouthIcon from '../demo/YouthIcon';
import ProfilePicture from '../demo/ProfilePicture';
import ProfileAnswersPending from '../demo/ProfileAnswersPending';
import YouthJourney from '../demo/YouthJourney';
import YouthDashboardCards from '../demo/YouthDashboardCards';
import { LoadingSpinner, SkeletonText } from '../demo/StaffLoading';
import ProfilingForm from '../profiling/ProfilingForm';

// Public geometry only. Placeholders never carry a saved identity or review outcome.
export default function YouthWorkspacePending() {
  const { pathname } = useLocation();
  const summary = useYouthProfileSummary();
  if (pathname === '/youth/profiling') return <ProfilingForm loading />;
  const profile = pathname === '/youth/profile';
  if (!profile && pathname !== '/youth/dashboard') return <main id="main-content" className="container account-main" aria-busy="true"><section className="profile-card account-preview"><h1>Your account</h1><p role="status"><LoadingSpinner />Loading your account…</p></section></main>;
  return <main id="main-content" className="container demo-main youth-workspace" aria-busy="true">
    {profile && <Link className="back-link dashboard-back-link" to="/youth/dashboard">← Back</Link>}
    <header className={'demo-heading ' + (profile ? 'youth-profile-page-heading' : '')}>
      <div className="youth-profile-heading"><h1>{profile ? 'My profile' : 'Youth dashboard'}</h1>{profile && <button className="secondary-button" disabled>Refresh</button>}</div>
      <div className="youth-profile-status" aria-hidden="true"><p><SkeletonText>Youth name · Registration No. 0000</SkeletonText></p></div>
    </header>
    {profile ? <>
      <ProfilePicture name="" pending />
      <section className="profile-card">
        <div className="registry-evidence-grid correction-evidence youth-review-timeline" aria-hidden="true" inert>
          <details open className="review-history registry-history"><summary><span className="registry-history-label"><YouthIcon name="chevron" />Review history</span></summary>
            <article className="correction-history-round"><h4><SkeletonText>Round 1 · Pending review</SkeletonText></h4><p className="registry-review-meta"><SkeletonText>Awaiting a decision</SkeletonText></p></article>
          </details>
        </div>
        <ProfileAnswersPending label="Loading your profile answers…" answers={summary?.answers} />
      </section>
    </> : <>
      <YouthJourney loading />
      <YouthDashboardCards loading />
    </>}
    <span className="sr-only" role="status">Loading your profile and review status…</span>
  </main>;
}
