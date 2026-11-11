import { Link } from 'react-router-dom';
import type { Answers } from '../profiling/fields';
import YouthIdAccess from './YouthIdAccess';
import YouthIcon from './YouthIcon';
import { useCallback, useRef, useState } from 'react';
import StatusToast from './StatusToast';

const sampleEvents = [
  { name: 'Community clean-up', date: 'October 12, 2026' },
  { name: 'Youth leadership workshop', date: 'September 21, 2026' },
  { name: 'Community sports day', date: 'August 16, 2026' },
];

function RewardPreview() {
  const dialog = useRef<HTMLDialogElement>(null);
  const count: number = Number(0);
  const [notice, setNotice] = useState(0);
  const dismissNotice = useCallback(() => setNotice(0), []);
  return <section className="profile-card dashboard-rewards">
    <div className="reward-summary"><div className="dashboard-id-heading"><span className="dashboard-card-icon"><YouthIcon name="gift" /></span><div><h2>Participation &amp; Rewards</h2><p>Earn a reward after every 3 event attendances.</p></div></div></div>
    <button className="secondary-button reward-open" type="button" onClick={() => dialog.current?.showModal()}>View rewards</button>
    <dialog ref={dialog} className="reward-dialog" aria-labelledby="reward-title">
      <div className="reward-dialog-content"><header className="reward-dialog-header"><span className="reward-header-icon"><YouthIcon name="gift" /></span><div><h2 id="reward-title">Participation &amp; Rewards</h2><p>Earn a reward for every 3 events attended.</p></div><button type="button" className="reward-close" onClick={() => dialog.current?.close()}>Close</button></header>
        <div className="reward-cycles">{Array.from({ length: count === 3 ? 2 : 1 }, (_, cycle) => {
          const progress = cycle === 0 ? count : 0;
          return <article className="reward-cycle" key={cycle}><details><summary><div><h3>Reward {cycle + 1}</h3><p>{progress} of 3 attendances</p><div className="reward-stars" aria-label={`${progress} of 3 example attendances`}>{[0, 1, 2].map(index => <svg key={index} viewBox="0 0 24 24" aria-hidden="true" className={index < progress ? 'is-active' : ''}><path d="m12 2.7 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9Z" /></svg>)}</div></div><span className="reward-expand">Attendance history <YouthIcon name="chevron" /></span></summary><div className="reward-cycle-history"><h4>Attendance history</h4>{progress ? <ul className="reward-history">{sampleEvents.slice(0, progress).map(event => <li key={event.name}><span className="reward-history-icon"><YouthIcon name="check" /></span><div><strong>{event.name}</strong><time>{event.date}</time></div><span className="reward-attended">Attended</span></li>)}</ul> : <p>Attendance history will appear here once connected.</p>}</div></details><div className="reward-cycle-footer"><span>{progress === 3 ? 'Ready to claim in this example' : `${3 - progress} more ${3 - progress === 1 ? 'attendance' : 'attendances'} needed`}</span><button type="button" className={`reward-claim${progress === 3 ? ' is-ready' : ''}`} onClick={() => setNotice(value => value + 1)}>Claim Reward</button></div></article>;
        })}</div>
        {notice > 0 && <StatusToast key={notice} pending message="Rewards are not available yet. Attendance tracking and claiming are not connected." onClose={dismissNotice} />}
      </div>
    </dialog>
  </section>;
}

export default function YouthDashboardCards({ approved = false, needsChanges = false, responseId, answers, registration, correction = false, hasProfile = true, loading = false }: {
  needsChanges?: boolean; approved?: boolean; responseId?: string | null; answers?: Answers; registration?: string | null; correction?: boolean; hasProfile?: boolean; loading?: boolean;
}) {
  return <div className="dashboard-options" inert={loading || undefined} aria-busy={loading}>
    <section className="profile-card dashboard-profile"><div className="dashboard-id-heading"><span className="dashboard-card-icon"><YouthIcon name="profile" /></span><h2>My profile</h2></div><p>{hasProfile ? needsChanges ? 'Read the staff notes, update the requested answers, and send your profile for review again.' : 'View your personal details, submitted answers, and staff review history.' : 'Fill out and submit your youth profile to see your details here.'}</p><Link className="secondary-button" to="/youth/profile">{needsChanges ? 'View changes' : 'View my profile'}</Link></section>
    <YouthIdAccess approved={approved} responseId={responseId} answers={answers} registration={registration} correction={correction} pending={loading} />
    <RewardPreview />
  </div>;
}
