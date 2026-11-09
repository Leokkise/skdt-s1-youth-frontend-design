import useAutoRefresh from './useAutoRefresh';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { RecoveryCaseV1 } from '../../contracts/v1/account-recovery';
import { useYouthAuth } from './AuthProvider';
import { recoveryService } from './recovery-services';
import { recoveryStatusLabel } from './RecoveryCaseDialog';
import { recoveryStatusTones } from './recovery-presentation';
import { manilaTime } from './review-presentation';
import YouthIcon from '../demo/YouthIcon';

export default function DashboardRecovery({pending=false}:{pending?:boolean}) {
  const {state,checking,signingOut}=useYouthAuth();
  const allowed=state.kind==='signedIn' && state.access.accountStatus==='active' && state.access.capabilities.includes('account.recovery_manage') && !signingOut;
  const identity=state.kind==='signedIn'?state.authUserId:'';
  const [cases,setCases]=useState<RecoveryCaseV1[]|null>(null);
  const [caseIdentity,setCaseIdentity]=useState('');
  const [status,setStatus]=useState<'loading'|'ready'|'denied'|'error'>('loading');
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    if(!allowed){setCases(null);setStatus('denied');return;}
    if(pending||checking)return;
    let current=true;setStatus('loading');
    void recoveryService?.list(5).then(result=>{
      if(!current)return;
      if(result.kind==='ok'){setCaseIdentity(identity);setCases(result.data.items);setStatus('ready');}
      else {setCases(null);setStatus(result.kind==='denied'?'denied':'error');}
    });
    if(!recoveryService)setStatus('error');
    return()=>{current=false;};
  },[allowed,identity,pending,checking,attempt]);
  useAutoRefresh(() => setAttempt(value => value + 1), allowed && !pending && !checking && status==='ready');
  const currentCases=caseIdentity===identity?cases:null;
  const loading=allowed && (pending || (status==='loading'&&!currentCases));
  return <section className="profile-card dashboard-preview" aria-labelledby="dashboard-recovery-title" aria-busy={loading || status==='loading'}>
    <div className="dashboard-panel-heading"><div><YouthIcon name="lock"/><h2 id="dashboard-recovery-title">Account recovery</h2></div>{allowed&&<Link to="/admin/youth/recovery">View cases<YouthIcon name="chevron"/></Link>}</div>
    {!allowed || status==='denied' ? <p className="dashboard-empty" role="status">Recovery cases require separate staff permission.</p> : status==='error' ? <div className="dashboard-empty" role="status"><p>Recovery cases could not be loaded.</p><button className="secondary-button" disabled={checking||pending} onClick={()=>setAttempt(value=>value+1)}>Retry cases</button></div> : loading && !currentCases ? <p className="dashboard-empty" role="status">Loading recovery cases…</p> : currentCases?.length ? <ol className="dashboard-preview-list">{currentCases.map(item=><li key={item.caseId}><div><strong><Link to={'/admin/youth/recovery?case='+encodeURIComponent(item.caseId)}>{item.officeReference}</Link></strong><span><time dateTime={item.createdAt}>{manilaTime(item.createdAt)} (PH)</time></span></div><span className="dashboard-status status-pill staff-event-tone" data-tone={recoveryStatusTones[item.status]}>{recoveryStatusLabel(item.status)}</span></li>)}</ol> : <div className="demo-empty dashboard-empty" role="status"><h3>No recovery cases yet</h3><p>Account recovery requests will appear here once a case is started.</p></div>}
  </section>;
}
