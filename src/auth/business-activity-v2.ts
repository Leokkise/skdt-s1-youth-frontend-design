import type {SupabaseClient} from '@supabase/supabase-js';
import type {BusinessActivityV2,BusinessActivityPageV2,BusinessActivityEventV2,RecoveryActivityOutcomeV2} from '../../contracts/v1/business-activity-v2';
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const keys=(x:Record<string,unknown>,names:string[])=>Object.keys(x).length===names.length&&Object.keys(x).every(k=>names.includes(k));
const id=(x:unknown)=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
function timeValue(x:unknown):bigint|null{if(typeof x!=='string')return null;const m=x.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.(\d{1,6}))?(?:Z|[+-]\d{2}:\d{2})$/);const milliseconds=Date.parse(x);return m&&Number.isFinite(milliseconds)?BigInt(milliseconds)*1000n+BigInt((m[1]??'').padEnd(6,'0').slice(3)):null;}
const time=(x:unknown)=>timeValue(x)!==null;
function tupleBefore(a:{recordedAt:string;source:string;eventId:string},b:{recordedAt:string;source:string;eventId:string}){const at=timeValue(a.recordedAt)!,bt=timeValue(b.recordedAt)!;return at<bt||(at===bt&&(a.source<b.source||(a.source===b.source&&a.eventId.toLowerCase()<b.eventId.toLowerCase())));}
const scopes=['auth','s1','recovery'] as const;
export const recoveryActivityLabelsV2:Record<RecoveryActivityOutcomeV2,string>={approved:'Recovery approved',reapproved:'Recovery reapproved',cancelled:'Recovery cancelled',challenge_prepared:'Mailbox verification code prepared',mailbox_verified:'Mailbox verified through recovery flow',verification_failed:'Mailbox verification attempt failed',applying:'Email replacement started by system',completed:'Email replacement completed by system',expired:'Recovery expired',credential_ready:'Password setup code prepared',credential_completed:'Password setup completed through recovery flow'};
function performer(outcome:unknown){return ['approved','reapproved','cancelled'].includes(String(outcome))?'officer':['mailbox_verified','verification_failed','credential_completed'].includes(String(outcome))?'mailbox_flow':'system';}
export function businessActivityLabelV2(row:BusinessActivityEventV2):string{return row.action==='account_recovery'?recoveryActivityLabelsV2[row.outcome as RecoveryActivityOutcomeV2]:row.action==='password_sign_in'?'Password sign-in recorded':row.action==='auth_logout_committed'?'Provider logout recorded':`Registration ${row.outcome.replaceAll('_',' ')}`;}
function event(x:unknown):x is BusinessActivityEventV2{
 if(!object(x)||!keys(x,['eventId','source','actorLabel','position','scope','action','outcome','performedBy','referenceKind','recordRef','caseId','recordedAt'])||!id(x.eventId)||!time(x.recordedAt)||typeof x.actorLabel!=='string'||!x.actorLabel.trim()||[...x.actorLabel].length>80||x.actorLabel.includes('@')||!['chairperson','secretary','treasurer'].includes(String(x.position)))return false;
 if(x.scope==='recovery')return x.source==='recovery'&&x.action==='account_recovery'&&typeof x.outcome==='string'&&Object.hasOwn(recoveryActivityLabelsV2,x.outcome)&&x.performedBy===performer(x.outcome)&&x.referenceKind==='recovery_case'&&typeof x.recordRef==='string'&&/^[A-Z][A-Z0-9-]{5,79}$/.test(x.recordRef)&&id(x.caseId);
 if(x.source!=='business'||x.performedBy!=='officer'||x.caseId!==null)return false;
 return (x.scope==='auth'&&['password_sign_in','auth_logout_committed'].includes(String(x.action))&&x.outcome==='provider_committed'&&x.referenceKind==='none'&&x.recordRef===null)||(x.scope==='s1'&&x.action==='registration_decision'&&['approved','needs_changes','rejected'].includes(String(x.outcome))&&x.referenceKind==='registration'&&typeof x.recordRef==='string'&&/^[0-9]{4,}$/.test(x.recordRef));
}
export function businessActivityV2(client:SupabaseClient):BusinessActivityV2{
 let revision=0;
 return{read:async(scope='all',limit=25,before)=>{
 const current=++revision;
 if(!['all',...scopes].includes(scope)||!Number.isInteger(limit)||limit<1||limit>50||(before&&(before.scope!==scope||!time(before.recordedAt)||!['business','recovery'].includes(before.source)||!id(before.eventId))))return{kind:'invalid'};
 try{
 const first=await client.auth.getSession();if(first.error||!first.data.session)return{kind:'denied'};
 const r=await client.rpc('platform_business_activity_v2',{p_scope:scope,p_limit:limit,p_before_time:before?.recordedAt??null,p_before_source:before?.source??null,p_before_id:before?.eventId??null}),last=await client.auth.getSession();
 if(current!==revision||last.error||last.data.session?.access_token!==first.data.session.access_token||last.data.session?.user.id!==first.data.session.user.id)return{kind:'unavailable'};
 if(r.error)return{kind:r.error.code==='42501'?'denied':['22023','22P02','22007','22008'].includes(r.error.code)?'invalid':'unavailable'};
 const data=r.data;
 if(!object(data)||!keys(data,['items','nextCursor','scopes','displayTimezone'])||data.displayTimezone!=='Asia/Manila'||!object(data.scopes)||!keys(data.scopes,[...scopes])||!scopes.every(s=>scope==='all'||scope===s?['available','denied'].includes(String((data.scopes as Record<string,unknown>)[s])):(data.scopes as Record<string,unknown>)[s]==='not_requested')||!Object.values(data.scopes).includes('available')||!Array.isArray(data.items)||data.items.length>limit||!data.items.every(event)||!data.items.every(e=>(data.scopes as Record<string,unknown>)[e.scope]==='available')||new Set(data.items.map(e=>e.source+':'+e.eventId)).size!==data.items.length)return{kind:'unavailable'};
 if(!data.items.every((e,i,rows)=>(i===0||tupleBefore(e,rows[i-1]))&&(!before||tupleBefore(e,before))))return{kind:'unavailable'};
 const next=data.nextCursor,tail=data.items.at(-1);
 if(next!==null&&(!object(next)||!keys(next,['recordedAt','source','eventId'])||data.items.length!==limit||!tail||next.recordedAt!==tail.recordedAt||next.source!==tail.source||next.eventId!==tail.eventId))return{kind:'unavailable'};
 return{kind:'ok',data:{...data,nextCursor:next===null?null:{...(next as object),scope}} as BusinessActivityPageV2};
 }catch{return{kind:'unavailable'};}
 }};
}
