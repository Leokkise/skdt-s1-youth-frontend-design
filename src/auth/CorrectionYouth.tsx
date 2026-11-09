import LoadingAction from '../demo/LoadingAction';
import YouthDashboardCards from '../demo/YouthDashboardCards';
import YouthJourney from '../demo/YouthJourney';
import type { CorrectionDetailV1 } from '../../contracts/v1/youth-corrections';
import type { YouthRevisionOptionsV1 } from '../../contracts/v1/youth-family-export';
import CorrectionReview from './CorrectionReview';
import CorrectionEditor from './CorrectionEditor';
import { reviewLabel } from './review-presentation';
import { displayLabel } from '../presentation-copy';
import { Link, Navigate, useLocation } from 'react-router-dom';
import ProfilePicture from '../demo/ProfilePicture';

export default function CorrectionYouth({ detail, options, reload, refreshing = false }: {refreshing?: boolean;detail: CorrectionDetailV1; options: YouthRevisionOptionsV1; reload: () => void}) {
  const {pathname} = useLocation();
  if (pathname === '/youth/qr') return <Navigate to="/youth/dashboard" replace />;
  const profile = pathname === '/youth/profile';
  const editing = pathname === '/youth/profiling';
  const name = `${displayLabel(detail.answers.firstName)} ${displayLabel(detail.answers.surname)}`;
  return <main id="main-content" className="container demo-main youth-workspace">{profile && <Link className="back-link dashboard-back-link" to="/youth/dashboard">← Back to dashboard</Link>}<header className={`demo-heading ${profile ? 'youth-profile-page-heading' : ''}`}><div className="youth-profile-heading"><h1>{profile ? 'My profile' : pathname === '/youth/profiling' ? 'Update requested answers' : 'Youth dashboard'}</h1>{profile && <LoadingAction className="secondary-button" busy={refreshing} type="button" onClick={reload} aria-label="Refresh profile and review status">Refresh</LoadingAction>}</div><div className="youth-profile-status"><p>{name} · Registration No. <strong>{detail.kkNumber}</strong></p><span className="status-pill" data-review-status={detail.status}>{reviewLabel(detail.status)}</span></div></header>
    {profile && <ProfilePicture name={name} />}
    {(profile || editing) && <section className="profile-card">
      {detail.draft && <CorrectionEditor key={`${detail.answerRevision}-${detail.draft.version}`} detail={detail} serverDate={options.serverDate} siblingDates={options.siblingBirthdatesEnabled} reload={reload} denied={reload} />}
      
      <CorrectionReview detail={detail} reload={reload} denied={reload} />
      
    </section>}
    {!profile && !editing && <YouthJourney correctionPath={detail.draft ? '/youth/profiling' : '/youth/profile'} status={({pending_review:'For review', needs_changes:'Needs changes', approved:'Approved (demo)', rejected:'Rejected (demo)'} as const)[detail.status]} />}
    {!profile && !editing && <YouthDashboardCards needsChanges={detail.status === 'needs_changes'} approved={detail.status === 'approved'} responseId={detail.responseId} correction />}
  </main>;
}
