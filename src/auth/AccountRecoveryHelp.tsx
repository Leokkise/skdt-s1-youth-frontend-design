import { Link } from 'react-router-dom';

export default function AccountRecoveryHelp() {
  return <section className="profile-card account-preview account-form recovery-help" aria-labelledby="recovery-title">
    <h1 id="recovery-title">Account recovery</h1>
    <p className="recovery-help-intro">Lost access to your email? Visit the barangay office for help.</p>
    <ol className="recovery-help-steps">
      <li><h2>Bring proof of ownership</h2><p>Bring a government photo ID, or a school photo ID with a barangay identity document, for staff to check.</p><Link to="/youth#contact">View location &amp; contact information</Link></li>
      <li><h2>Provide a new email</h2><p>After verifying ownership, staff will help you change your email. Provide an email you can access.</p></li>
      <li><h2>Check your new email</h2><p>Use the case ID and code in your recovery email to verify your new address. Then use Forgot password if you need to reset your password.</p></li>
    </ol>
    <p className="recovery-help-safety">Your profile is kept. Never share your password or recovery codes.</p>
    <div className="recovery-help-actions"><Link className="button" to="/youth/recovery">I have a recovery case and code</Link></div>
  </section>;
}
