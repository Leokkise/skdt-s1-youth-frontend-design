import type { SupabaseClient } from '@supabase/supabase-js';
import type { YouthFamilyExportV1, ApprovedExportSelectionV1, ProfileSectionV1 } from '../../contracts/v1/youth-family-export';
import type { ReviewResultV2 } from '../../contracts/v1/youth-review-v2';
import catalog from '../../contracts/v1/correction-fields.json';
const ownerNotice='synthetic-s1-031-family-export-v1',staffNotice='synthetic-s1-031-staff-family-export-v1';
const sections=['personal','household','education','participation','voice'];
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const keys=(x:Record<string,unknown>,names:string[])=>Object.keys(x).length===names.length&&Object.keys(x).every(k=>names.includes(k));
const id=(x:unknown)=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const time=(x:unknown)=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const date=(x:unknown)=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const positive=(x:unknown)=>Number.isSafeInteger(x)&&Number(x)>0;
const text=(x:unknown,max=2000)=>typeof x==='string'&&[...x].length<=max;
const same=(a:unknown[],b:unknown[])=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const unique=(xs:unknown[])=>new Set(xs).size===xs.length;
function answers(x:unknown,section?:string){return obj(x)&&Object.entries(x).every(([k,v])=>catalog.some(f=>f.fieldId===k&&(!section||f.sectionId===section))&&text(v));}
function exported(x:unknown,selection:ApprovedExportSelectionV1[],chosen:ProfileSectionV1[],requestId:string){
 if(!obj(x)||!keys(x,['requestId','recordedAt','sections','items'])||x.requestId!==requestId||!time(x.recordedAt)||!Array.isArray(x.sections)||!same(x.sections,chosen)||!Array.isArray(x.items)||x.items.length!==selection.length)return false;
 return x.items.every((item,index)=>{
  if(!obj(item)||!keys(item,['responseId','kkNumber','firstName','surname','reportingDate','reportingDateKind','answerRevision','source','sections'])||item.responseId!==selection[index].responseId||item.answerRevision!==selection[index].answerRevision||typeof item.kkNumber!=='string'||!/^\d{4,}$/.test(item.kkNumber)||!text(item.firstName)||!text(item.surname)||!date(item.reportingDate)||!['actual_submission','synthetic_illustration'].includes(String(item.reportingDateKind))||!['self_service','walk_in','demo_import'].includes(String(item.source))||(item.source==='demo_import')!==(item.reportingDateKind==='synthetic_illustration')||!Array.isArray(item.sections)||item.sections.length!==chosen.length)return false;
  return item.sections.every((s,n)=>obj(s)&&keys(s,['sectionId','answers'])&&s.sectionId===chosen[n]&&answers(s.answers,chosen[n]));
 });
}
export function youthFamilyExportV1(client:SupabaseClient):YouthFamilyExportV1{
 async function call<T>(name:string,args:object,valid:(x:unknown)=>unknown,input=true):Promise<ReviewResultV2<T>>{
  if(!input)return {kind:'invalid'};
  try{const first=await client.auth.getSession();if(first.error||!first.data.session)return {kind:'denied'};
   const {data,error}=await client.rpc(name,args);const last=await client.auth.getSession();
   if(last.error||last.data.session?.access_token!==first.data.session.access_token||last.data.session?.user.id!==first.data.session.user.id)return {kind:'unavailable'};
   if(error)return {kind:error.code==='42501'?'denied':['40001','55000'].includes(error.code)?'conflict':['22023','22P02','22007','22008'].includes(error.code)?'invalid':'unavailable'};
   return valid(data)?{kind:'ok',data:data as T}:{kind:'unavailable'};
  }catch{return {kind:'unavailable'};}
 }
 return {
  options:()=>call('youth_revision_options_v1',{},x=>obj(x)&&keys(x,['serverDate','correctionsEnabled','siblingBirthdatesEnabled','fullSectionExportEnabled','ownerCorrectionNoticeVersion','staffCorrectionNoticeVersion','ownerFamilyNoticeVersion','staffFamilyNoticeVersion'])&&date(x.serverDate)&&['correctionsEnabled','siblingBirthdatesEnabled','fullSectionExportEnabled'].every(k=>typeof x[k]==='boolean')&&x.ownerCorrectionNoticeVersion==='synthetic-s1-030-corrections-v1'&&x.staffCorrectionNoticeVersion==='synthetic-s1-030-staff-corrections-v1'&&x.ownerFamilyNoticeVersion===ownerNotice&&x.staffFamilyNoticeVersion===staffNotice),
  exportProfiles:(selection,chosen,requestId)=>call('youth_staff_profile_export_v1',{p_response_ids:selection.map(s=>s.responseId),p_expected_revisions:Object.fromEntries(selection.map(s=>[s.responseId,s.answerRevision])),p_sections:chosen,p_request_id:requestId},x=>exported(x,selection,chosen,requestId),id(requestId)&&selection.length>=1&&selection.length<=25&&unique(selection.map(s=>s.responseId))&&selection.every(s=>id(s.responseId)&&(s.answerRevision===null||positive(s.answerRevision)))&&chosen.length>=1&&chosen.length<=5&&unique(chosen)&&chosen.every(s=>sections.includes(s))),
 };
}
