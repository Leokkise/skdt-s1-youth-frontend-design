import LoadingAction from './LoadingAction';
import { SkeletonText } from './StaffLoading';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { usePractice } from './PracticeStore';
import YouthIcon from './YouthIcon';
import { useYouthAuth } from '../auth/AuthProvider';

export default function ProfilePicture({ name, pending = false }: { name: string; pending?: boolean }) {
  const practice = usePractice();
  const { state } = useYouthAuth();
  const identity = state.kind === 'signedIn' ? state.authUserId : null;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const request = useRef(0);
  const picker = useRef<HTMLInputElement>(null);
  useEffect(() => { request.current++; return () => { request.current++; }; }, [identity]);
  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const current = ++request.current;
    setError(''); setLoading(false);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Choose a JPG, PNG or WebP image.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('That image is too large. Choose one under 2 MB.'); return; }
    setLoading(true);
    try {
      const bitmap = await createImageBitmap(file);
      bitmap.close();
      const reader = new FileReader();
      const picture = await new Promise<string>((resolve, reject) => {
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject();
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      if (request.current === current) {
        try { practice.setProfilePicture(picture); }
        catch { setError('Your browser could not save this photo. Free some browser storage or try a smaller image.'); }
      }
    } catch { if (request.current === current) setError('We couldn’t read that image. Try another JPG, PNG or WebP file.'); }
    finally { if (request.current === current) setLoading(false); }
  }
  return <section className="profile-picture-section" aria-labelledby="picture-title" aria-busy={pending || loading} inert={pending || undefined}>
    <div className="profile-avatar-upload">
      <div className={`profile-picture-preview${pending ? ' profile-skeleton' : ''}`}>{pending ? null : practice.profilePicture ? <img src={practice.profilePicture} alt={name + "'s profile picture"} /> : <YouthIcon name="profile" />}</div>
      <button className="avatar-camera-button" type="button" aria-label={practice.profilePicture ? 'Change profile picture' : 'Add profile picture'} disabled={loading} onClick={() => picker.current?.click()}><YouthIcon name="camera" /></button>
    </div>
    <div className="profile-picture-controls"><h2 id="picture-title">Profile picture</h2>
      <div className="picture-actions"><LoadingAction className="secondary-button" type="button" busy={loading} disabled={pending} onClick={() => picker.current?.click()}>{pending ? <SkeletonText>Upload photo</SkeletonText> : practice.profilePicture ? 'Change photo' : 'Upload photo'}</LoadingAction>{!pending && practice.profilePicture && <button className="text-button" type="button" onClick={() => { request.current++; try { practice.setProfilePicture(null); setError(''); } catch { setError('Your browser could not remove the saved photo. Try again.'); } setLoading(false); }}>Remove</button>}</div>
      <input ref={picker} hidden type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose profile picture" aria-describedby="picture-hint" disabled={loading} onChange={choose} />
      <p className="field-hint" id="picture-hint">JPG, PNG or WebP, up to 2 MB. Saved only in this browser; it won’t sync to other devices and may be lost if you clear browser data.</p>
      {error && <p className="picture-feedback" role="alert">{error}</p>}
      <span className="sr-only" role="status">{loading ? 'Reading image' : practice.profilePicture ? 'Profile picture selected' : ''}</span>
    </div>
  </section>;
}
