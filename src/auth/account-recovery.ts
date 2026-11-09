import type {SupabaseClient} from '@supabase/supabase-js';
import type {AccountRecoveryV1,RecoveryMailboxV1,RecoveryResultV1,RecoveryCaseV1} from '../../contracts/v1/account-recovery';
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const keys=(x:Record<string,unknown>,names:string[])=>Object.keys(x).length===names.length&&Object.keys(x).every(k=>names.includes(k));
const id=(x:unknown)=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const time=(x:unknown)=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const text=(x:unknown,max=120)=>typeof x==='string'&&[...x].length<=max;
const method=(x:unknown)=>['government_photo_id','school_photo_id_and_barangay_identity'].includes(String(x));
const position=(x:unknown)=>['chairperson','secretary','treasurer'].includes(String(x));
const email=(x:unknown)=>typeof x==='string'&&x.length<=254&&/^[a-z0-9.!#$%&*+/=?^_`{|}~-]+@example[.]invalid$/.test(x);
const reference=(x:unknown)=>typeof x==='string'&&/^[A-Z][A-Z0-9-]{5,79}$/.test(x);
function caseView(x:unknown){return obj(x)&&keys(x,['caseId','responseId','status','method','officeReference','policyVersion','oldEmailMasked','newEmailMasked','actorLabel','position','createdAt','expiresAt','completedAt','credentialCompleted'])&&id(x.caseId)&&id(x.responseId)&&['approved','awaiting_mailbox','verified','applying','completed','cancelled','expired'].includes(String(x.status))&&method(x.method)&&reference(x.officeReference)&&x.policyVersion==='local-s1-033-in-person-v1'&&typeof x.oldEmailMasked==='string'&&/^.[*]{3}@example[.]invalid$/.test(x.oldEmailMasked)&&typeof x.newEmailMasked==='string'&&/^.[*]{3}@example[.]invalid$/.test(x.newEmailMasked)&&text(x.actorLabel,80)&&position(x.position)&&time(x.createdAt)&&time(x.expiresAt)&&(x.completedAt===null||time(x.completedAt))&&typeof x.credentialCompleted==='boolean';}
function event(x:unknown){return obj(x)&&keys(x,['eventId','actorLabel','position','outcome','oldEmail','newEmail','recordedAt'])&&id(x.eventId)&&text(x.actorLabel,80)&&position(x.position)&&['approved','challenge_prepared','mailbox_verified','verification_failed','applying','completed','cancelled','expired','reapproved','credential_ready','credential_completed'].includes(String(x.outcome))&&email(x.oldEmail)&&email(x.newEmail)&&time(x.recordedAt);}
const kind=(code:unknown)=>code==='42501'?'denied':['40001','55000','23505'].includes(String(code))?'conflict':code==='54000'?'rateLimited':['22023','22P02'].includes(String(code))?'invalid':'unavailable';
const safeWorker=(url:string)=>{try{const u=new URL(url);return u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)&&u.port==='5189'&&u.pathname==='/'&&!u.username&&!u.password&&!u.search&&!u.hash;}catch{return false;}};
async function http<T>(url:string,body:object,valid:(x:unknown)=>unknown,token?:string):Promise<RecoveryResultV1<T>>{
 if(!safeWorker(url))return {kind:'unavailable'};
 try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)}),x:unknown=await r.json();
  if(!obj(x)||typeof x.kind!=='string')return {kind:'unavailable'};
  if(x.kind==='ok'&&keys(x,['kind','data'])&&valid(x.data))return {kind:'ok',data:x.data as T};
  if(x.kind==='ok'&&keys(x,['kind'])&&valid(null))return {kind:'ok',data:null as T};
  if(x.kind==='completed'&&keys(x,['kind','caseId'])&&id(x.caseId)&&'caseId' in body&&x.caseId===body.caseId)return {kind:'completed',caseId:x.caseId as string};
  if(x.kind==='pending'&&(keys(x,['kind'])||(keys(x,['kind','caseId'])&&id(x.caseId)&&(!('caseId' in body)||x.caseId===body.caseId))))return {kind:'pending',...(x.caseId?{caseId:x.caseId as string}:{})};
  if(keys(x,['kind'])&&['denied','invalid','conflict','rateLimited','unavailable'].includes(x.kind))return {kind:x.kind as 'denied'|'invalid'|'conflict'|'rateLimited'|'unavailable'};
  return {kind:'unavailable'};
 }catch{return {kind:'unavailable'};}
}
export function accountRecoveryV1(client:SupabaseClient,workerUrl='http://127.0.0.1:5189/'):AccountRecoveryV1{
 async function signed<T>(work:(token:string)=>Promise<RecoveryResultV1<T>>):Promise<RecoveryResultV1<T>>{
  try{const first=await client.auth.getSession();if(first.error||!first.data.session)return {kind:'denied'};const result=await work(first.data.session.access_token),last=await client.auth.getSession();
   if(last.error||last.data.session?.access_token!==first.data.session.access_token||last.data.session?.user.id!==first.data.session.user.id)return {kind:'unavailable'};return result;
  }catch{return {kind:'unavailable'};}
 }
 function rpc<T>(name:string,args:object,valid:(x:unknown)=>unknown,input=true):Promise<RecoveryResultV1<T>>{if(!input)return Promise.resolve({kind:'invalid'});return signed<T>(async()=>{const r=await client.rpc(name,args);return r.error?{kind:kind(r.error.code)}:valid(r.data)?{kind:'ok',data:r.data as T}:{kind:'unavailable'};});}
 const worker=(body:Record<string,unknown>)=>signed<RecoveryCaseV1>(token=>http<RecoveryCaseV1>(workerUrl,body,x=>caseView(x)&&obj(x)&&(body.caseId?x.caseId===body.caseId:x.responseId===body.responseId),token));
 return {
  subject:responseId=>rpc('youth_recovery_subject_v1',{p_response_id:responseId},x=>obj(x)&&keys(x,['accountId','responseId','youthId','firstName','surname','birthdate'])&&id(x.accountId)&&x.responseId===responseId&&id(x.youthId)&&text(x.firstName)&&text(x.surname)&&typeof x.birthdate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.birthdate),id(responseId)),
  list:(limit=25,before)=>rpc('platform_recovery_cases_v1',{p_case_id:null,p_limit:limit,p_before_time:before?.createdAt??null,p_before_id:before?.caseId??null},x=>obj(x)&&keys(x,['items','nextCursor'])&&Array.isArray(x.items)&&x.items.length<=limit&&x.items.every(caseView)&&(x.nextCursor===null||(obj(x.nextCursor)&&keys(x.nextCursor,['createdAt','caseId'])&&time(x.nextCursor.createdAt)&&id(x.nextCursor.caseId))),Number.isSafeInteger(limit)&&limit>=1&&limit<=25&&(!before||(id(before.caseId)&&time(before.createdAt)))),
  detail:caseId=>rpc('platform_recovery_cases_v1',{p_case_id:caseId},x=>obj(x)&&keys(x,['case','events'])&&caseView(x.case)&&obj(x.case)&&x.case.caseId===caseId&&Array.isArray(x.events)&&x.events.every(event),id(caseId)),
  create:(responseId,newEmail,verifiedMethod,officeReference,requestId)=>id(responseId)&&id(requestId)&&email(newEmail)&&method(verifiedMethod)&&reference(officeReference)?worker({action:'create',responseId,newEmail,method:verifiedMethod,officeReference,requestId}):Promise.resolve({kind:'invalid'}),
  command:(caseId,action)=>id(caseId)&&['resend','cancel','reconcile','credential'].includes(action)?worker({action,caseId}):Promise.resolve({kind:'invalid'}),
  reapprove:(caseId,verifiedMethod,officeReference)=>id(caseId)&&method(verifiedMethod)&&reference(officeReference)?worker({action:'reapprove',caseId,method:verifiedMethod,officeReference}):Promise.resolve({kind:'invalid'}),
 };
}
export function recoveryMailboxV1(workerUrl='http://127.0.0.1:5189/'):RecoveryMailboxV1{return {
 verify:(caseId,token)=>id(caseId)&&/^[0-9a-f]{64}$/.test(token)?http(workerUrl,{action:'verify',caseId,token},()=>false):Promise.resolve({kind:'invalid'}),
 password:(caseId,token,password,confirmation)=>id(caseId)&&/^[0-9a-f]{64}$/.test(token)&&password===confirmation&&password.length>=8&&password.length<=72?http(workerUrl,{action:'password',caseId,token,password,confirmation},x=>x===null):Promise.resolve({kind:'invalid'}),
};}
