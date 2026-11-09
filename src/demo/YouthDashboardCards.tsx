import { Link } from 'react-router-dom';
import type { Answers } from '../profiling/fields';
import YouthIdAccess from './YouthIdAccess';
import YouthIcon from './YouthIcon';

export default function YouthDashboardCards({ approved = false, needsChanges = false, responseId, answers, registration, correction = false, hasProfile = true, loading = false }: {
  needsChanges?: boolean; approved?: boolean; responseId?: string | null; answers?: Answers; registration?: string | null; correction?: boolean; hasProfile?: boolean; loading?: boolean;
}) {
  return <div className="dashboard-options" inert={loading || undefined} aria-busy={loading}>
    <section className="profile-card dashboard-profile"><div className="dashboard-id-heading"><span className="dashboard-card-icon"><YouthIcon name="profile" /></span><h2>My profile</h2></div><p>{hasProfile ? needsChanges ? 'Staff requested corrections. Read their notes and check which answers need updating.' : 'View your submitted answers and check your review status. Read staff notes to see if anything needs updating.' : 'Complete youth profiling to view your profile here.'}</p><Link className="secondary-button" to="/youth/profile">{needsChanges ? 'View changes and staff notes' : 'View my profile'} <span aria-hidden="true">→</span></Link></section>
    <YouthIdAccess approved={approved} responseId={responseId} answers={answers} registration={registration} correction={correction} pending={loading} />
    <section className="profile-card dashboard-rewards">
      <div className="dashboard-id-heading">
        <span className="dashboard-card-icon"><YouthIcon name="gift" /></span>
        <div><h2>Participation &amp; Rewards</h2><p>Attendance tracking and rewards are not available yet.</p></div>
      </div>
      <span className="dashboard-availability"><YouthIcon name="lock" />Not connected yet</span>
    </section>
  </div>;
}
