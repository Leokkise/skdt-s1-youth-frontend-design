import useYouthProfileSummary from '../auth/useYouthProfileSummary';
import { displayLabel } from '../presentation-copy';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePractice } from './PracticeStore';
import { client, useYouthAuth } from '../auth/AuthProvider';

export default function UserMenu() {
  const practice = usePractice();
  const profileSummary = useYouthProfileSummary();
  const { state, checking, signOut, signingOut } = useYouthAuth();
  const authId = state.kind === 'signedIn' ? state.authUserId : null;
  const response = practice.responses.find(item => item.key === practice.profileKey);
  const submitted = authId ? Boolean(profileSummary?.submitted) : Boolean(response);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [account, setAccount] = useState<{ authId: string; email: string } | null>(null);
  useEffect(() => {
    let live = true;
    setAccount(previous => previous?.authId === authId ? previous : null);
    if (authId && client) void client.auth.getSession().then(user => {
      if (!live || user.error || user.data.session?.user.id !== authId) return;
      setAccount({ authId, email: user.data.session?.user.email || '' });
    }).catch(() => { /* Bounded fallback: keep the account label without private details. */ });
    return () => { live = false; };
  }, [authId]);
  const currentAccount = account?.authId === authId ? account : null;
  const profileName = [profileSummary?.answers.firstName, profileSummary?.answers.surname].filter(Boolean).join(' ');
  const firstName = profileSummary?.answers.firstName;
  const name = authId ? profileName || 'My account' : response ? `${response.answers.firstName} ${response.answers.surname}` : 'Synthetic Youth';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('');
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div className="user-menu"  ref={root} inert={checking || undefined} aria-busy={checking} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <button className="user-menu-trigger" ref={trigger} type="button" disabled={checking || Boolean(authId && !profileSummary)} aria-label="My account menu" aria-expanded={open} aria-controls="user-account-panel" onClick={() => setOpen(value => !value)}><span className="user-avatar" aria-hidden="true">{practice.profilePicture ? <img src={practice.profilePicture} alt="" /> : authId && !profileSummary ? <span className="account-name-placeholder avatar" /> : initials}</span><span>{authId && !profileSummary ? <span className="account-name-placeholder" /> : displayLabel(authId ? firstName || 'My account' : response?.answers.firstName || 'My account') || 'My account'}</span><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="2" /></svg></button>
    {open && <div className="user-account-panel" id="user-account-panel"><div className="user-account-summary"><span className="user-avatar" aria-hidden="true">{practice.profilePicture ? <img src={practice.profilePicture} alt="" /> : initials}</span><div><strong>{displayLabel(name)}</strong><small>{authId ? currentAccount?.email : 'juan@example.invalid'}</small><span className="user-account-badge">{authId ? 'Youth account · unverified' : 'account'}</span></div></div><nav aria-label="My account"><Link to={submitted ? "/youth/dashboard" : "/youth/profiling"} onClick={() => setOpen(false)}>{submitted ? 'Dashboard' : 'Continue youth profiling'}</Link>{submitted && <Link to="/youth/profile" onClick={() => setOpen(false)}>My profile</Link>}<Link to="/youth/settings" onClick={() => setOpen(false)}>Account settings</Link><Link to="/youth" aria-disabled={signingOut} onClick={event => { if (authId) { event.preventDefault(); if (!signingOut) void signOut(); } else practice.signOut(); setOpen(false); }}>Sign out</Link></nav></div>}
  </div>;
}
