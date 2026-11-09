import type {SupabaseClient} from '@supabase/supabase-js';
import type {RecoveryResultV1} from '../../contracts/v1/account-recovery';
import type {RecoverySearchV1,RecoverySearchItemV1,RecoverySelectedV1} from '../../contracts/v1/recovery-search';
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const keys=(x:Record<string,unknown>,names:string[])=>Object.keys(x).length===names.length&&Object.keys(x).every(k=>names.includes(k));
const id=(x:unknown):x is string=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
const text=(x:unknown,max:number)=>x===null||(typeof x==='string'&&[...x].length<=max);
const reference=(x:unknown)=>x===null||(typeof x==='string'&&/^[0-9]{1,20}$/.test(x));
const status=(x:unknown)=>['pending_review','needs_changes','approved','rejected'].includes(String(x));
const caseId=(x:unknown)=>x===null||id(x);
function item(x:unknown){return obj(x)&&keys(x,['responseId','displayName','registrationReference','reviewStatus','activeCaseId'])&&id(x.responseId)&&text(x.displayName,241)&&reference(x.registrationReference)&&status(x.reviewStatus)&&caseId(x.activeCaseId);}
function selected(x:unknown,responseId:string){if(!obj(x)||!keys(x,['subject','registrationReference','reviewStatus','activeCaseId'])||!obj(x.subject))return false;const s=x.subject;return keys(s,['accountId','responseId','youthId','firstName','surname','birthdate'])&&id(s.accountId)&&s.responseId===responseId&&id(s.youthId)&&text(s.firstName,120)&&text(s.surname,120)&&(s.birthdate===null||(typeof s.birthdate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s.birthdate)))&&reference(x.registrationReference)&&status(x.reviewStatus)&&caseId(x.activeCaseId);}
const errorKind=(code:unknown)=>code==='42501'?'denied':code==='40001'?'conflict':['22023','22P02'].includes(String(code))?'invalid':'unavailable';
export function recoverySearchV1(client:SupabaseClient):RecoverySearchV1{
 let searchRevision=0,selectedRevision=0;
 async function call<T>(name:string,args:object,validate:(data:unknown)=>boolean):Promise<RecoveryResultV1<T>>{try{const first=await client.auth.getSession();if(first.error||!first.data.session)return{kind:'denied'};const r=await client.rpc(name,args),last=await client.auth.getSession();if(last.error||last.data.session?.access_token!==first.data.session.access_token||last.data.session?.user.id!==first.data.session.user.id)return{kind:'unavailable'};if(r.error)return{kind:errorKind(r.error.code)};return validate(r.data)?{kind:'ok',data:r.data as T}:{kind:'unavailable'};}catch{return{kind:'unavailable'};}}
 return {
  async search(mode,raw,cursor){const revision=++searchRevision;++selectedRevision;if(typeof raw!=='string')return{kind:'invalid'};const query=raw.trim().toLowerCase();if(!['name','registration'].includes(mode)||[...query].length>254||/[\x00-\x1f\x7f]/.test(query)||(mode==='name'&&([...query].length<3||[...query].length>80))||(mode==='registration'&&!/^[0-9]{1,20}$/.test(query))||(cursor&&(cursor.mode!==mode||cursor.query!==query||!id(cursor.afterResponseId))))return{kind:'invalid'};
   const r=await call<{items:RecoverySearchItemV1[];nextAfterResponseId:string|null}>('platform_recovery_search_v1',{p_mode:mode,p_query:query,p_after_response_id:cursor?.afterResponseId??null},x=>obj(x)&&keys(x,['items','nextAfterResponseId'])&&Array.isArray(x.items)&&x.items.length<=5&&x.items.every(item)&&new Set(x.items.map(i=>(i as RecoverySearchItemV1).responseId)).size===x.items.length&&(x.nextAfterResponseId===null||(id(x.nextAfterResponseId)&&x.items.length===5&&(x.items[4] as RecoverySearchItemV1).responseId===x.nextAfterResponseId)));
   if(revision!==searchRevision)return{kind:'unavailable'};if(r.kind!=='ok')return r;return{kind:'ok',data:{items:r.data.items,nextCursor:r.data.nextAfterResponseId?{mode,query,afterResponseId:r.data.nextAfterResponseId}:null}};
  },
  async selected(responseId){const revision=++selectedRevision;if(!id(responseId))return{kind:'invalid'};const r=await call<RecoverySelectedV1>('platform_recovery_selected_v1',{p_response_id:responseId},x=>selected(x,responseId));return revision===selectedRevision?r:{kind:'unavailable'};},
 };
}
