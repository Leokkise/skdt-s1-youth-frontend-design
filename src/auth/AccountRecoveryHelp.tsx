import { Link } from 'react-router-dom';

export default function AccountRecoveryHelp() {
  return <section className="profile-card account-preview account-form recovery-help" aria-labelledby="recovery-title">
    <h1 id="recovery-title">Account recovery</h1>
    <p className="recovery-help-intro">Can’t access your registered email? Visit the barangay office to ask staff for help. This page explains the steps; it does not send a request.</p>
    <ol className="recovery-help-steps">
      <li><h2>Visit the barangay office</h2><p>Ask staff for account recovery and bring proof of ownership. A government photo ID, or school photo ID with a barangay identity document, is preferred.</p><Link to="/youth#contact">View location &amp; contact information</Link></li>
      <li><h2>Verify ownership and provide a replacement email</h2><p>After checking your proof, staff will enter the replacement email you provide. Use an email you can access—you’ll receive your recovery message there.</p></li>
      <li><h2>Check your new email</h2><p>Your replacement email will receive a message containing your case ID and verification code. Use them to confirm your new email. After the email change is complete, use Forgot password on the sign-in page with your new email if you need a new password.</p></li>
    </ol>
    <p className="recovery-help-safety">Your existing profile stays unchanged. Never share your password or recovery codes with anyone.</p>
    <div className="recovery-help-actions"><Link className="button" to="/youth/recovery">I have a recovery case and code</Link><Link className="secondary-button signin-home" to="/youth/demo/sign-in">Back to sign in</Link></div>
  </section>;
}
