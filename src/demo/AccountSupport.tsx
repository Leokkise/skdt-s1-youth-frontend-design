import { SkeletonText } from './StaffLoading';
import { Link, Navigate } from 'react-router-dom';
import { usePractice } from './PracticeStore';
import YouthIcon from './YouthIcon';
import { useEffect, useState, type ReactNode } from 'react';
import { client, useYouthAuth } from '../auth/AuthProvider';
import PasswordForm from '../auth/PasswordForm';

const questions: [string, ReactNode][] = [
  ['Who can complete youth profiling?', 'Youth profiling is for Barangay Talipapa residents ages 15–30. If you are unsure whether you qualify, contact barangay staff before starting.'],
  ['How do I start youth profiling?', 'Create an account, confirm your email and sign in. Read and acknowledge the Terms of Use and Data Privacy notice before profiling. Complete the five sections, review your answers and accept the accuracy certification before submitting.'],
  ['Can I save my progress and finish later?', 'Yes. Select Save draft and wait for the save confirmation before leaving. Sign in with the same account to continue. Unsaved changes may be lost.'],
  ['Where can I check my profile and review status?', 'After submitting, open My profile to see your saved answers. Your dashboard shows the review status and any staff feedback. For review means staff have not recorded a decision yet; no review completion date is guaranteed.'],
  ['How do I correct a submitted profile?', 'You can edit a draft before submitting it. If staff request changes, open the correction task from your dashboard, update the requested fields, review your answers and resubmit. If a submitted answer needs changing and no correction task is available, contact barangay staff.'],
  ['When can I view my Digital Youth ID?', 'After staff approve your profile, open Digital Youth ID on your dashboard to preview or download the card. It is a profile preview, not proof of identity, residency or eligibility. Its QR code contains basic profile details, so share the card only with people you intend to see them.'],
  ['Why is my information collected, and who can access it?', 'Your answers support youth profiling and SK program planning. Authorized staff can review submitted profiles and export approved records for their work. Public demographics show aggregate counts, not individual answers. Read the full Terms of Use and Data Privacy notice before completing your profile.'],
  ['How do I change my email or password, or recover my account?', <><strong>Change your password:</strong> use Account settings while signed in.<br /><strong>Forgot your password?</strong> Choose Forgot password on the sign-in page and follow the email-code steps.<br /><strong>Change your email or lost email access?</strong> Visit the barangay office for staff-assisted recovery. Bring proof of account ownership and an email you can access. Staff must check ownership, and you must verify the replacement email before the change is complete. Your current email stays active until then.</>],
];
export function FAQ() {
  return <div className="faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>;
}

export default function AccountSupport({ settings = false, saved = false }: { settings?: boolean; saved?: boolean }) {
  const practice = usePractice();
  const { state } = useYouthAuth();
  const id = state.kind === 'signedIn' ? state.authUserId : null;
  const [email, setEmail] = useState<{id:string;value:string}|null>(null);
  const [emailStatus,setEmailStatus] = useState<'loading'|'ready'|'failed'|'idle'>('loading');
  const [emailAttempt,setEmailAttempt] = useState(0);
  useEffect(() => {
    let live = true; setEmail(null); setEmailStatus(saved && (id || state.kind === 'loading') ? 'loading' : 'idle');
    if (saved && id) {
      if (!client) setEmailStatus('failed');
      else void client.auth.getUser().then(result => { if (!live) return; if (!result.error && result.data.user?.id === id) { setEmail({id,value:result.data.user.email || ''}); setEmailStatus('ready'); } else setEmailStatus('failed'); }).catch(() => { if (live) setEmailStatus('failed'); });
    }
    return () => { live = false; };
  }, [saved, id, state.kind, emailAttempt]);
  if (settings && !saved && !practice.signedIn) return <Navigate to="/youth/demo/sign-in" replace />;
  return <main id="main-content" className={`container demo-main account-support${settings ? ' account-settings' : ''}`}>
    <Link className={`back-link${saved || practice.signedIn ? ' dashboard-back-link' : ''}`} to={saved || practice.signedIn ? '/youth/dashboard' : '/youth'}>← {saved || practice.signedIn ? 'Back to dashboard' : 'Back to home'}</Link>
    <header className="demo-heading"><h1>{settings ? 'Account settings' : 'Help / FAQ'}</h1><p>{settings ? 'Your account details and sign-in options.' : 'A little help with your youth account.'}</p></header>
    {settings ? <>
      <section className="profile-card settings-details"><h2><YouthIcon name="account" />Account details</h2><dl className="demo-details"><div><dt>Email address</dt><dd>{saved ? emailStatus === 'loading' ? <span role="status" aria-label="Loading email address"><SkeletonText>name@example.invalid</SkeletonText></span> : (email?.id === id ? email?.value : '') || (id ? <>Email unavailable. <button className="text-button" onClick={() => setEmailAttempt(value => value + 1)}>Retry account details</button></> : 'Sign in to view account details') : 'juan@example.invalid'}</dd></div><div><dt>Account experience</dt><dd>{saved ? state.kind === 'loading' ? <span role="status" aria-label="Loading account details"><SkeletonText>Youth account · unverified</SkeletonText></span> : 'Youth account · unverified' : 'Youth account'}</dd></div></dl></section>

      <section className="profile-card settings-security"><h2 id="password-title"><YouthIcon name="lock" />Change password</h2>{saved && <PasswordForm embedded />}</section>
    </> : <FAQ />}
  </main>;
}
