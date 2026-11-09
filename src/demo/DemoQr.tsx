import { LoadingSpinner } from './StaffLoading';
import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import YouthIcon from './YouthIcon';
import { demoQrProfile, demoQrText } from './demoQrPayload';
import { youthQrText, type YouthQrProfile } from './youthQrPayload';
import { renderYouthIdCard, type YouthIdCardDetails } from './youthIdCard';

const Lanyard = lazy(() => import('./Lanyard').then(module => ({ default: module.default as ComponentType<Record<string, unknown>> })));

function LanyardLoading() {
  return <div className="id-lanyard-loading" role="status"><LoadingSpinner />Loading lanyard preview…</div>;
}

export default function DemoQr({ profile, picture, cardDetails, onClose, checking }: { profile?: YouthQrProfile; picture?: string | null; cardDetails?: Pick<YouthIdCardDetails, 'registration' | 'birthdate' | 'address' | 'gender' | 'contact' | 'ageGroup' | 'civilStatus'>; onClose?: () => void; checking?: boolean }) {
  const qrProfile = profile || demoQrProfile;
  const payload = profile ? youthQrText(profile) : demoQrText;
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const registration = cardDetails?.registration, birthdate = cardDetails?.birthdate, address = cardDetails?.address;
  const gender = cardDetails?.gender, contact = cardDetails?.contact, ageGroup = cardDetails?.ageGroup;
  const civilStatus = cardDetails?.civilStatus;
  const { name, age, barangay } = qrProfile;
  useEffect(() => {
    let live = true;
    setImage(''); setError('');
    void (async () => {
      try {
        const { default: QRCode } = await import('qrcode');
        const qr = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 4, width: 370, color: { dark: '#000000', light: '#ffffff' } });
        const result = await renderYouthIdCard({ name, age, barangay, registration, birthdate, address, gender, contact, ageGroup, civilStatus }, qr, picture);
        if (live) setImage(result);
      } catch { if (live) setError('Your ID preview could not be created. Please try again.'); }
    })();
    return () => { live = false; };
  }, [payload, picture, name, age, barangay, registration, birthdate, address, gender, contact, ageGroup, civilStatus, attempt]);
  return <section className="profile-card demo-qr-card youth-id-preview">
    <header className="qr-card-heading">
      <span className="dashboard-card-icon"><YouthIcon name="qr" /></span><h2>Digital Youth ID preview</h2>
      {onClose && <button type="button" className="secondary-button youth-id-close" onClick={onClose}>Close</button>}
    </header>
    <div className="youth-id-preview-body" inert={checking || undefined} aria-busy={checking}>
      <div className="id-lanyard-scene">
        {error ? <div className="id-lanyard-loading" role="alert"><p className="field-error">{error}</p><button className="secondary-button" onClick={() => setAttempt(value => value + 1)}>Retry preview</button></div> :
          image ? <Suspense fallback={<LanyardLoading />}>
            <div className="id-lanyard-view" role="img" aria-label={'Interactive landscape ID preview for ' + name}>
              <Lanyard frontImage={image} backImage={image} orientation="landscape" imageFit="contain" size={0.62} strapLength={0.3} strapColor="#062654" breeze={0.15} damping={0.65} intro={true} />
            </div>
            <p className="id-lanyard-hint">Drag to swing · Tap or click to turn</p>
          </Suspense> : <LanyardLoading />}
      </div>
      {image ? <a className="secondary-button" href={image} download="talipapa-digital-youth-id.png">Download Digital Youth ID</a> : <button className="secondary-button" disabled>Download Digital Youth ID</button>}
    </div>
  </section>;
}
