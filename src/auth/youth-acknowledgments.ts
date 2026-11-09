import type { SupabaseClient } from '@supabase/supabase-js';
import type { YouthAcknowledgmentsV1 } from '../../contracts/v1/youth-acknowledgments';
import type { ReviewResultV2 } from '../../contracts/v1/youth-review-v2';
import fields from '../../contracts/v1/correction-fields.json';
const version='synthetic-s1-032-v1';
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const keys=(x:Record<string,unknown>,names:string[])=>Object.keys(x).length===names.length&&Object.keys(x).every(k=>names.includes(k));
const id=(x:unknown)=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const positive=(x:unknown)=>Number.isSafeInteger(x)&&Number(x)>0;
const time=(x:unknown)=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const receipt=(x:unknown)=>obj(x)&&keys(x,['responseId','answerRevision','draftVersion','status','recordedAt'])&&id(x.responseId)&&positive(x.answerRevision)&&x.draftVersion===0&&x.status==='pending_review'&&time(x.recordedAt);
export function youthAcknowledgmentsV1(client:SupabaseClient):YouthAcknowledgmentsV1{
 async function call<T>(name:string,args:object,valid:(x:unknown,userId:string)=>unknown,input=true):Promise<ReviewResultV2<T>>{
  if(!input)return {kind:'invalid'};
  try{const first=await client.auth.getSession();if(first.error||!first.data.session)return {kind:'denied'};
   const {data,error}=await client.rpc(name,args);const last=await client.auth.getSession();
   if(last.error||last.data.session?.access_token!==first.data.session.access_token||last.data.session?.user.id!==first.data.session.user.id)return {kind:'unavailable'};
   if(error)return {kind:error.code==='42501'?'denied':['40001','55000'].includes(error.code)?'conflict':['22023','22P02','22007','22008'].includes(error.code)?'invalid':'unavailable'};
   return valid(data,first.data.session.user.id)?{kind:'ok',data:data as T}:{kind:'unavailable'};
  }catch{return {kind:'unavailable'};}
 }
 const notice=(x:unknown,userId:string)=>obj(x)&&keys(x,['noticeVersion','receipt'])&&x.noticeVersion===version&&(x.receipt===null||(obj(x.receipt)&&keys(x.receipt,['userId','noticeVersion','recordedAt'])&&x.receipt.userId===userId&&x.receipt.noticeVersion===version&&time(x.receipt.recordedAt)));
 return {
  mine:()=>call('youth_notice_mine_v1',{},notice),
  accept:(requestId,accepted)=>call('youth_notice_accept_v1',{p_request_id:requestId,p_notice_version:version,p_accepted:accepted},(x,u)=>notice(x,u)&&obj(x)&&x.receipt!==null,id(requestId)&&accepted===true),
  save:(revision,answers,requestId)=>call('youth_save_mine_v3',{p_revision:revision,p_answers:answers,p_request_id:requestId},x=>obj(x)&&keys(x,['youthId','revision','updatedAt'])&&id(x.youthId)&&x.revision===revision+1&&time(x.updatedAt),Number.isSafeInteger(revision)&&revision>=0&&id(requestId)&&obj(answers)&&Object.entries(answers).every(([k,v])=>fields.some(f=>f.fieldId===k)&&typeof v==='string'&&[...v].length<=2000)),
  submit:(revision,requestId,certified)=>call('youth_submit_for_review_v3',{p_revision:revision,p_request_id:requestId,p_certified:certified},x=>receipt(x)&&obj(x)&&x.answerRevision===1,positive(revision)&&id(requestId)&&certified===true),
  begin:requestId=>call('youth_correction_begin_v2',{p_request_id:requestId},x=>receipt(x)&&obj(x)&&x.answerRevision===1,id(requestId)),
  resubmit:(revision,draftVersion,requestId,certified)=>call('youth_correction_resubmit_v2',{p_answer_revision:revision,p_draft_version:draftVersion,p_request_id:requestId,p_certified:certified},x=>receipt(x)&&obj(x)&&x.answerRevision===revision+1,positive(revision)&&positive(draftVersion)&&id(requestId)&&certified===true),
 };
}
