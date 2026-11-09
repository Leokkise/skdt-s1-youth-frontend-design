import { useEffect, useState } from 'react';

const key = (owner: string) => `s1-profile-picture-v1:${owner}`;
export default function useProfilePicture(owner: string | null) {
  const [selected, setSelected] = useState<{ owner: string | null; picture: string | null } | null>(null);
  useEffect(() => {
    let picture: string | null = null;
    try { if (owner) picture = localStorage.getItem(key(owner)); } catch { /* Upload reports unavailable storage when saving. */ }
    if (picture && !/^data:image\/(jpeg|png|webp);base64,/.test(picture)) picture = null;
    setSelected({ owner, picture });
  }, [owner]);
  function setPicture(picture: string | null) {
    if (owner) {
      if (picture) localStorage.setItem(key(owner), picture);
      else localStorage.removeItem(key(owner));
    }
    setSelected({ owner, picture });
  }
  return [selected?.owner === owner ? selected.picture : null, setPicture] as const;
}
