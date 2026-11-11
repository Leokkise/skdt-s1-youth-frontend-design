import YouthJourney from './YouthJourney';
import YouthDashboardCards from './YouthDashboardCards';
import { displayLabel } from '../presentation-copy';
import { Link, Navigate } from 'react-router-dom';
import { sections, visibleFields, displayAnswer, allFields } from '../profiling/fields';
import { usePractice } from './PracticeStore';
import ReviewHistory from './ReviewHistory';
import YouthIcon from './YouthIcon';
import ProfilePicture from './ProfilePicture';
import { type PracticeResponse, type ReviewStatus } from './presentationWorkflow';
import type { YouthStateV1 } from '../../contracts/v1/youth';
import { profilingDate } from '../profiling/validation';
import { useYouthAuth } from '../auth/AuthProvider';
import YouthReview from '../auth/YouthReview';

function ReviewUpdate({ response, saved = false }: { response: PracticeResponse; saved?: boolean }) {
  const changes = response.status === 'Needs changes';
  const rejected = response.status === 'Rejected (demo)';
  const approved = response.status === 'Approved (demo)';
  return <section className={`youth-review-update ${rejected ? 'is-rejected' : changes ? 'is-changes' : approved ? 'is-approved' : ''}`} aria-labelledby="review-update-title">
    <span className="review-update-icon"><YouthIcon name={rejected ? 'close' : changes ? 'edit' : approved ? 'check' : 'clock'} /></span>
    <div><h2 id="review-update-title">{saved ? 'Your youth profile is submitted' : rejected ? 'Your profile was rejected in the application' : changes ? 'A few answers need your attention' : approved ? 'Your profile is approved in the application' : 'Your youth profile is waiting for staff review'}</h2>
      <p>{saved ? 'Your answers are saved. Your saved review result appears below. New submissions are sent to staff review through Submit profile. Submitted editing is unavailable. Residency remains unverified; your registration number is not proof of eligibility.' : rejected ? 'Read the review note. Your registration number is retained; it does not prove approval or eligibility.' : changes ? 'Read the staff note below, update the requested answers and submit your profile again.' : approved ? 'The staff review is complete. This decision does not verify residency or issue a Digital Youth ID.' : 'You’ve submitted your answers. Staff have not made a decision yet. You can view your profile while you wait; if changes are needed, the note will appear here.'}</p>
      {response.note && <p className="youth-review-note"><strong>Staff note:</strong> {response.note}</p>}
      {changes && response.correctionFields?.map(id => <p key={id}><Link className="correction-link" to={`/youth/profiling?field=${encodeURIComponent(id)}`}>Update {allFields.find(field => field.id === id)?.label || 'requested answer'} <YouthIcon name="arrow" /></Link></p>)}
      {changes && <Link className="button" to="/youth/profiling">Update my answers</Link>}
    </div>
  </section>;
}

export default function PresentationYouth({ profile = false, saved, reviewStatus = 'unavailable' }: { profile?: boolean; reviewStatus?: ReviewStatus | 'unavailable'; saved?: Extract<YouthStateV1, { kind: 'draft' | 'submitted' }> }) {
  const practice = usePractice();
  const { feedback } = useYouthAuth();
  if (!saved && !practice.signedIn) return <Navigate to="/youth/demo/sign-in" replace />;
  // Reuse presentation markup only. Never put saved records into PracticeStore or its staff registry.
  const response: PracticeResponse | undefined = saved ? saved.kind === 'submitted' ? {
    key: saved.youthId, kkNumber: saved.kkNumber || undefined, answers: saved.answers,
    referenceDate: profilingDate(new Date(saved.submittedAt!)), status: 'For review', note: '',
    history: [{ action: 'Profile submitted', actor: 'Synthetic youth', at: saved.submittedAt!, note: '' }],
  } : undefined : practice.responses.find(item => item.key === practice.profileKey);
  const name = response ? `${response.answers.firstName} ${response.answers.surname}` : 'Synthetic Youth';
  return <main id="main-content" className="container demo-main youth-workspace">
    {profile && <p className="presentation-notice">{saved ? 'Your profile is saved. Residency remains unverified; optional profile pictures stay in this tab.' : 'Your session, picture and answers reset on reload.'}</p>}
    {saved && feedback && <p role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
    <header className="demo-heading"><h1>{profile ? 'My profile' : 'Youth dashboard'}</h1><p>{response ? `Mabuhay, ${displayLabel(response.answers.firstName)}. ${profile ? 'Here are the details you submitted.' : 'Here’s where you are in your profiling journey.'}` : 'Welcome! Complete your youth profile to get started.'}</p></header>
    {profile && <ProfilePicture name={displayLabel(name)} />}
    {profile && (!response ? <section className="profile-card youth-start"><YouthIcon name="profile" /><div><h2>Tell us about yourself</h2><p>There are five short sections, followed by a review of your answers. {saved ? 'Continue your saved draft or use the example.' : 'Use the example to try the application.'}</p><Link className="button" to="/youth/profiling">{saved ? 'Continue youth profiling' : 'Start youth profiling'}</Link></div></section> : <>
      <ReviewUpdate response={response} saved={Boolean(saved)} /><p className="kk-reference">Registration No. <strong>{response.kkNumber || "Unassigned"}</strong> · {saved ? 'Saved internal reference; not proof of residency or approval.' : ', retained across review decisions in this tab.'}</p>
      {saved?.kind === 'submitted' && saved.responseId && <YouthReview responseId={saved.responseId} />}
        <section className="profile-card youth-profile-summary"><h2>{displayLabel(name)}</h2><dl className="demo-details"><div><dt>Age group</dt><dd>{response.answers.ageGroup}</dd></div><div><dt>Education</dt><dd>{response.answers.education}</dd></div><div><dt>Work status</dt><dd>{response.answers.workStatus}</dd></div><div><dt>Profiling date</dt><dd>{response.referenceDate}</dd></div></dl></section>
        <div className="review-sections presentation-profile">{sections.map(section => <section key={section.title}><h2>{section.title}</h2><dl>{visibleFields(section.fields, response.answers).map(field => <div key={field.id}><dt>{field.label}</dt><dd>{field.type === 'checkbox' ? 'Accepted' : displayAnswer(field.id, response.answers)}</dd></div>)}</dl></section>)}</div>
        <ReviewHistory entries={response.history} />
    </>)}
    {!profile && <>
      <YouthJourney status={saved ? reviewStatus : response?.status} />
      <YouthDashboardCards needsChanges={response?.status === 'Needs changes'} approved={reviewStatus === 'Approved (demo)'} responseId={saved?.responseId} answers={saved?.answers} registration={saved?.kkNumber} hasProfile={Boolean(response)} />
    </>}
  </main>;
}
