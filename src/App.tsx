import PresentationYouth from './demo/PresentationYouth';
import ProfilingForm from './profiling/ProfilingForm';
import DemoQr from './demo/DemoQr';
import StaffDashboard from './demo/StaffDashboard';
import { RegistryDemo } from './demo/DemoPages';
import RecoveryRoute from './auth/RecoveryRoute';
import RecoveryMailbox from './auth/RecoveryMailbox';
import { YouthAuthProvider } from './auth/AuthProvider';

import AccountRecoveryHelp from './auth/AccountRecoveryHelp';
import PasswordForm from './auth/PasswordForm';
import AccountSupport from './demo/AccountSupport';

import './auth/auth.css';
import { PracticeProvider } from './demo/PracticeStore';
import AccountPreview from './demo/AccountPreview';

import { BrowserRouter, Navigate, Outlet, Route, Routes, Link, useLocation } from "react-router-dom";
import CivicLanding, { CivicHeader, CivicFooter, CivicScroll } from './landing/CivicLanding';
import CivicPaperCorners from './landing/CivicPaperCorners';
import AdminLogin from './demo/AdminLogin';
import StaffShell from './demo/StaffShell';

function AdminPage() {
  return (
    <main id="main-content" className="container admin-main">
      <section className="admin-heading" aria-labelledby="page-title">
        <span className="eyebrow">Staff Workspace</span>
        <h1 id="page-title">Youth Registry</h1>
        <p>The Sangguniang Kabataan of Barangay Talipapa&apos;s workspace for youth profiling.</p>
      </section>
      <section className="notice" aria-labelledby="access-title">
        <div className="notice-icon" aria-hidden="true">i</div>
        <div>
          <h2 id="access-title">Registry access is being prepared</h2>
          <p>
            Youth records are not available on this page. Access to individual profiles
            and verification information will require authorized sign-in.
          </p>
          <Link to="/admin/youth/login">Open staff sign-in →</Link>
        </div>
      </section>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main id="main-content" className="container admin-main">
      <section className="admin-heading">
        <h1>Page not found</h1>
        <p>This address is outside the Youth &amp; Community section.</p>
        <Link className="button" to="/youth">Go to Youth &amp; Community</Link>
      </section>
    </main>
  );
}

function PreviewUnavailable({ title }: { title: string }) {
  return <main id="main-content" className="container demo-main"><h1>{title}</h1><p>This screen requires backend data. Use the retained source components to design additional states.</p></main>;
}
function AppContent() {
  const { pathname } = useLocation();
  const isStaff = pathname.startsWith('/admin/youth') && pathname !== '/admin/youth/login';
  const pages = <><Routes>
          <Route caseSensitive path="/" element={<Navigate to="/youth" replace />} />
          <Route caseSensitive path="/youth/demo/confirm-email" element={<AccountPreview view="Confirm email" />} />
          <Route caseSensitive path="/youth/demo/reset-password" element={<Navigate to="/youth/demo/forgot-password" replace />} />
          <Route caseSensitive path="/admin/youth/recovery" element={<PreviewUnavailable title="Account recovery" />} />
          <Route caseSensitive path="/admin/youth/activity" element={<PreviewUnavailable title="Activity logs" />} />
          <Route caseSensitive path="/admin/youth/dashboard" element={<StaffDashboard />} />
          <Route caseSensitive path="/admin/youth/login" element={<AdminLogin />} />
          <Route caseSensitive path="/admin/youth/encode" element={<Navigate to="/admin/youth/dashboard" replace />} />
          <Route caseSensitive path="/admin/youth/reports" element={<StaffDashboard reports />} />
          <Route caseSensitive path="/admin/youth" element={<Navigate to="/admin/youth/dashboard" replace />} />
          <Route element={
            <div className="civic-paper civic-paper-framed youth-paper">
              <CivicPaperCorners />
              <div className="youth-paper-content"><Outlet /></div>
            </div>
          }>
            <Route caseSensitive path="/youth/demo/sign-in" element={<AccountPreview view="Sign in" />} />
            <Route caseSensitive path="/youth/access-preview" element={<AccountPreview />} />
            <Route caseSensitive path="/youth/demo/create-account" element={<AccountPreview view="Create account" />} />
            <Route caseSensitive path="/youth/demo/forgot-password" element={<main id="main-content" className="container account-main"><Link className="back-link" to="/youth">← Back to home</Link><PasswordForm recovery /></main>} />
            <Route caseSensitive path="/youth/account-help" element={<main id="main-content" className="container account-main"><Link className="back-link" to="/youth">← Back to home</Link><AccountRecoveryHelp /></main>} />
            <Route caseSensitive path="/youth/recovery" element={<RecoveryMailbox />} />
            <Route caseSensitive path="/youth/account" element={<PresentationYouth />} />
            <Route caseSensitive path="/youth/profiling" element={<ProfilingForm siblingDates />} />
            <Route caseSensitive path="/youth/dashboard" element={<PresentationYouth />} />
            <Route caseSensitive path="/youth/profile" element={<PresentationYouth profile />} />
            <Route caseSensitive path="/youth/settings" element={<AccountSupport settings />} />
            <Route caseSensitive path="/youth/qr" element={<DemoQr />} />
          </Route>
          <Route caseSensitive path="/youth/help" element={<Navigate to="/youth#faq" replace />} />
          <Route caseSensitive path="/admin/youth/demo" element={<RegistryDemo />} />
          <Route caseSensitive path="/youth/*" element={<CivicLanding />} />
          <Route caseSensitive path="/admin/youth/*" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes><RecoveryRoute /></>;
  return <div className={`site-shell ${isStaff ? 'staff-shell' : ''}`}><nav aria-label="Design previews" style={{padding: 12, background: "#fff3cc", display: "flex", gap: 16, flexWrap: "wrap"}}><strong>Fictional design preview</strong><Link to="/youth">Home</Link><Link to="/youth/dashboard">Dashboard</Link><Link to="/youth/profiling">Profiling</Link><Link to="/youth/profile">Profile</Link><Link to="/youth/settings">Settings</Link><Link to="/youth/qr">ID</Link><Link to="/admin/youth/dashboard">Staff</Link><Link to="/admin/youth/demo">Registry</Link><Link to="/admin/youth/reports">Analytics</Link><Link to="/youth/demo/sign-in">Sign in</Link><Link to="/youth/demo/create-account">Sign up</Link></nav><a className="skip-link" href="#main-content">Skip to content</a><CivicScroll />{isStaff ? <StaffShell>{pages}</StaffShell> : <><CivicHeader />{pages}<CivicFooter /></>}</div>;
}

export default function App() {
  return <BrowserRouter><YouthAuthProvider><PracticeProvider><AppContent /></PracticeProvider></YouthAuthProvider></BrowserRouter>;
}
