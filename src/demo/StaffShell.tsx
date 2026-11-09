import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useYouthAuth } from '../auth/AuthProvider';
import YouthIcon from './YouthIcon';
import { CivicIcon } from '../landing/CivicLanding';

const links = [
  ['Dashboard', '/admin/youth/dashboard', 'dashboard'],
  ['KK Youth Registry', '/admin/youth/demo', 'profile'],
  ['Account recovery', '/admin/youth/recovery', 'lock'],
  ['Activity Logs', '/admin/youth/activity', 'clock'],
  ['Analytics', '/admin/youth/reports', 'report'],
] as const;

export default function StaffShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { state, signOut, signingOut, feedback } = useYouthAuth();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const toggle = useRef<HTMLButtonElement>(null);
  const account = useRef<HTMLDetailsElement>(null);
  useEffect(() => { setOpen(false); if (account.current) account.current.open = false; }, [pathname]);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);
  return <div className="staff-layout">
    <div className="staff-shell-chrome">
      <aside className="staff-sidebar" aria-label="Staff workspace">
        <div className="staff-brand-row"><div className="staff-brand"><Link className="civic-brand" to="/admin/youth/dashboard"><img src="/images/sk-talipapa-logo.png" width="44" height="44" alt="" /><span><strong>SK-DigiTalipapa</strong><small>Barangay Talipapa</small></span></Link><span className="staff-workspace-label">Staff workspace</span></div><button ref={toggle} type="button" className="staff-menu-toggle" aria-label={open ? 'Close staff navigation' : 'Open staff navigation'} aria-expanded={open} aria-controls="staff-navigation" onClick={() => setOpen(value => !value)}><CivicIcon name={open ? 'close' : 'menu'} /></button></div>
        <nav id="staff-navigation" className={open ? 'is-open' : ''} aria-label="Staff workspace">{links.filter(([,path]) => path !== '/admin/youth/recovery' || (state.kind === 'signedIn' && state.access.accountStatus === 'active' && state.access.capabilities.includes('account.recovery_manage'))).map(([label, path, icon]) => <Link key={path} to={path} aria-current={pathname === path ? 'page' : undefined}><YouthIcon name={icon} />{label}</Link>)}<div className="staff-sidebar-bottom"><button className="staff-signout" type="button" disabled={signingOut} onClick={() => { void signOut(); }}><YouthIcon name="logout" />{signingOut ? 'Signing out…' : 'Sign out'}</button>{feedback?.error && <p role="alert">{feedback.message}</p>}</div></nav>
      </aside>
      <header className="staff-topbar">
        <div className="staff-clock"><time dateTime={now.toISOString()}>{new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).format(now)}</time><span>Manila time</span></div>
        <div className="staff-workspace-switcher" role="group" aria-label="Business workspaces">
          <span className="is-current" aria-current="true">Youth Profiling</span>
          <button type="button" disabled>Transparency &amp; Reports</button>
          <button type="button" disabled>Events &amp; Programs</button>
        </div>
        <details ref={account} className="staff-header-account" onKeyDown={event => {
          if (event.key !== 'Escape' || !event.currentTarget.open) return;
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.open = false;
          event.currentTarget.querySelector('summary')?.focus();
        }}>
          <summary><span aria-hidden="true">SK</span>SK Staff<YouthIcon name="chevron" /></summary>
          <div className="staff-header-account-panel">
            <button className="secondary-button" type="button" disabled={signingOut} onClick={() => { void signOut(); }}><YouthIcon name="logout" />{signingOut ? 'Signing out…' : 'Sign out'}</button>
            {feedback?.error && <p role="alert">{feedback.message}</p>}
          </div>
        </details>
      </header>
    </div>
    <div className="staff-body">
      {children}
    </div>
  </div>;
}
