import type { SupabaseClient } from '@supabase/supabase-js';
import type { YouthWorkflowV1 } from '../../contracts/v1/youth-workflow';
import type { ReviewResultV2 } from '../../contracts/v1/youth-review-v2';
import fields from '../../contracts/v1/youth-fields.json';
const obj=(x: unknown): x is Record<string,unknown> => !!x && typeof x==='object' && !Array.isArray(x);
const keys=(x: Record<string,unknown>, ks:string[])=>Object.keys(x).length===ks.length && Object.keys(x).every(k=>ks.includes(k));
const id=(x:unknown)=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const time=(x:unknown)=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const date=(x:unknown)=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const text=(x:unknown,max=2000)=>typeof x==='string'&&[...x].length<=max;
const label=(x:unknown)=>text(x,80)&&(x as string).trim().length>0;
const position=(x:unknown)=>['chairperson','treasurer','secretary'].includes(String(x));
const decision=(x:unknown)=>['approved','needs_changes','rejected'].includes(String(x));
const ref=(x:unknown)=>typeof x==='string'&&/^\d{4,}$/.test(x);
const source=(x:unknown)=>['self_service','walk_in','demo_import'].includes(String(x));
const chronology=(x:Record<string,unknown>)=>date(x.reportingDate)&&['actual_submission','synthetic_illustration'].includes(String(x.reportingDateKind))&&source(x.source)&&(x.source==='demo_import')===(x.reportingDateKind==='synthetic_illustration');
const fieldKeys=new Set(fields.map(f=>f.id));
const answers=(x:unknown)=>obj(x)&&Object.entries(x).every(([k,v])=>fieldKeys.has(k)&&text(v));
function state(x:unknown):boolean {
  if(!obj(x)||!keys(x,['responseId','status','revision','history'])||!id(x.responseId)||!Array.isArray(x.history))return false;
  if(x.revision===0)return ['not_shared','pending_review'].includes(String(x.status))&&x.history.length===0;
  return x.revision===1&&decision(x.status)&&x.history.length===1&&x.history.every(e=>obj(e)&&keys(e,['eventId','revision','decision','note','recordedAt','actorLabel','position'])&&id(e.eventId)&&e.revision===1&&e.decision===x.status&&text(e.note,1000)&&(e.decision==='approved'||(e.note as string).trim().length>0&&[...(e.note as string).trim()].length>=10)&&time(e.recordedAt)&&label(e.actorLabel)&&(position(e.position)||e.position==='legacy_reviewer'));
}
const cursor=(x:unknown)=>x===null||obj(x)&&keys(x,['submittedAt','responseId'])&&time(x.submittedAt)&&id(x.responseId);
function page(x:unknown,limit:number,valid:(r:unknown)=>boolean):boolean{return obj(x)&&keys(x,['items','nextCursor'])&&Array.isArray(x.items)&&x.items.length<=limit&&x.items.every(valid)&&cursor(x.nextCursor);}
const registry=(x:unknown)=>obj(x)&&keys(x,['responseId','kkNumber','firstName','surname','ageGroup','education','submittedAt','reportingDate','reportingDateKind','source','reviewStatus','reviewRevision','isVerified'])&&id(x.responseId)&&ref(x.kkNumber)&&['firstName','surname','ageGroup','education'].every(k=>text(x[k]))&&time(x.submittedAt)&&chronology(x)&&x.isVerified===false&&((x.reviewRevision===0&&x.reviewStatus==='pending_review')||(x.reviewRevision===1&&decision(x.reviewStatus)));
const categories=['Skills/Livelihood','Sports','Education support','Health','Environment','Arts','Governance','Unclassified suggestion'];
const analytics=(x:unknown)=>obj(x)&&keys(x,['reportingDate','reportingDateKind','source','age','ageGroup','gender','civilStatus','education','workStatus','isOsy','skVoter','nationalVoter','election2023','kkAttendance','organizationPresent','programCategories'])&&chronology(x)&&['age','ageGroup','gender','civilStatus','education','workStatus','skVoter','nationalVoter','kkAttendance'].every(k=>text(x[k]))&&(x.isOsy===null||['','Yes','No'].includes(String(x.isOsy)))&&(x.election2023===null||['Yes','No'].includes(String(x.election2023)))&&typeof x.organizationPresent==='boolean'&&Array.isArray(x.programCategories)&&x.programCategories.length<=8&&new Set(x.programCategories).size===x.programCategories.length&&x.programCategories.every(c=>categories.includes(String(c)));
function detail(x:unknown):boolean {
  if(!obj(x)||!keys(x,['source','detail','encoderReceipt'])||!source(x.source)||!obj(x.detail))return false;
  const d=x.detail;if(!keys(d,['responseId','kkNumber','submittedAt','answers','isVerified','noticeVersion','acknowledgedAt','review'])||!id(d.responseId)||!ref(d.kkNumber)||!time(d.submittedAt)||!answers(d.answers)||d.isVerified!==false||!time(d.acknowledgedAt)||!state(d.review)||!obj(d.review)||d.review.responseId!==d.responseId)return false;
  if(x.source==='self_service')return d.noticeVersion==='synthetic-s1-027-review-v1'&&x.encoderReceipt===null;
  const e=x.encoderReceipt;return d.noticeVersion==='synthetic-s1-028-encoder-v1'&&obj(e)&&keys(e,['kind','actorLabel','position','recordedAt','noticeVersion'])&&e.kind==='fictional_staff_attestation'&&label(e.actorLabel)&&position(e.position)&&time(e.recordedAt)&&e.recordedAt===d.submittedAt&&e.noticeVersion===d.noticeVersion;
}
function combined(x:unknown):boolean {
  if(!obj(x)||!keys(x,['state','review'])||!obj(x.state)||!state(x.review)||!obj(x.review))return false;
  const s=x.state;return keys(s,['kind','youthId','revision','answers','updatedAt','responseId','submittedAt','kkNumber','receiptId','noticeVersion','isVerified'])&&s.kind==='submitted'&&id(s.youthId)&&Number.isInteger(s.revision)&&(s.revision as number)>0&&answers(s.answers)&&time(s.updatedAt)&&id(s.responseId)&&s.responseId===x.review.responseId&&time(s.submittedAt)&&ref(s.kkNumber)&&id(s.receiptId)&&s.noticeVersion==='synthetic-s1-023-v1'&&s.isVerified===false&&x.review.status!=='not_shared';
}
export function youthWorkflowV1(client:SupabaseClient):YouthWorkflowV1 {
  async function call<T>(name:string,args:object,valid:(x:unknown)=>boolean):Promise<ReviewResultV2<T>>{
    try{const initial=await client.auth.getSession();if(initial.error||!initial.data.session)return {kind:'denied'};
      const r=await client.rpc(name,args),latest=await client.auth.getSession();
      if(latest.error||latest.data.session?.access_token!==initial.data.session.access_token||latest.data.session?.user.id!==initial.data.session.user.id)return {kind:'unavailable'};
      if(r.error)return {kind:r.error.code==='42501'?'denied':r.error.code==='40001'||r.error.code==='55000'?'conflict':['22023','22P02','22007','22008'].includes(r.error.code)?'invalid':'unavailable'};
      return valid(r.data)?{kind:'ok',data:r.data as T}:{kind:'unavailable'};
    }catch{return {kind:'unavailable'};}
  }
  return {
    submit:(revision,requestId,privacyAccepted,certified,reviewAccepted)=>call('youth_submit_for_review_v1',{p_revision:revision,p_request_id:requestId,p_privacy_accepted:privacyAccepted,p_certified:certified,p_notice_version:'synthetic-s1-028-submit-v1',p_accepted:reviewAccepted},combined),
    registry:(limit=25,before)=>call('youth_staff_registry_v3',{p_limit:limit,p_before_time:before?.submittedAt??null,p_before_id:before?.responseId??null},x=>page(x,limit,registry)),
    analytics:(limit=25,before)=>call('youth_staff_analytics_v1',{p_limit:limit,p_before_time:before?.submittedAt??null,p_before_id:before?.responseId??null},x=>page(x,limit,analytics)),
    detail:responseId=>call('youth_staff_detail_v3',{p_response_id:responseId},x=>detail(x)&&obj(x)&&obj(x.detail)&&x.detail.responseId===responseId),
    decide:(responseId,decision,note,expectedRevision,requestId)=>call('youth_staff_decide_v3',{p_response_id:responseId,p_decision:decision,p_note:note,p_expected_revision:expectedRevision,p_request_id:requestId},x=>state(x)&&obj(x)&&x.responseId===responseId&&x.status===decision&&Array.isArray(x.history)&&obj(x.history[0])&&x.history[0].note===note),
  };
}
