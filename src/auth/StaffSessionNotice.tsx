import { useEffect, useState } from 'react';
import { client, useYouthAuth } from './AuthProvider';

// Display only: this identifies the current session, never authorizes staff access.
export default function StaffSessionNotice() {
  const {state} = useYouthAuth();
  const identity = state.kind === 'signedIn' ? state.authUserId : null;
  const [account,setAccount] = useState<{identity:string;email:string}|null>(null);
  useEffect(()=>{
    let live=true;
    if(identity) void client?.auth.getSession().then(result=>{
      const user=result.data.session?.user;
      if(live&&!result.error&&user?.id===identity&&user.email)setAccount({identity,email:user.email});
    }).catch(()=>{});
    return()=>{live=false;};
  },[identity]);
  return identity&&account?.identity===identity ? <p className="field-hint">Signed in as <strong>{account.email}</strong></p> : null;
}
