import type { SupabaseClient } from '@supabase/supabase-js';
import type { YouthCorrectionsV1, CorrectionReceiptV1 } from '../../contracts/v1/youth-corrections';
import type { ReviewResultV2 } from '../../contracts/v1/youth-review-v2';
import fields from '../../contracts/v1/correction-fields.json';
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const keys=(x:Record<string,unknown>,names:string[])=>Object.keys(x).length===names.length&&Object.keys(x).every(k=>names.includes(k));
const id=(x:unknown)=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const positive=(x:unknown)=>Number.isSafeInteger(x)&&Number(x)>0;
const time=(x:unknown)=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const text=(x:unknown,max=2000)=>typeof x==='string'&&[...x].length<=max;
const position=(x:unknown)=>['chairperson','treasurer','secretary'].includes(String(x));
const decision=(x:unknown)=>['approved','needs_changes','rejected'].includes(String(x));
const status=(x:unknown)=>x==='pending_review'||decision(x);
const unique=(xs:unknown[])=>new Set(xs).size===xs.length;
const fieldSet=new Set(fields.map(f=>f.fieldId));
const answers=(x:unknown)=>obj(x)&&Object.entries(x).every(([k,v])=>fieldSet.has(k)&&text(v));
const applicable=(field:string,a:Record<string,unknown>)=>(field!=='lgbtqiaDetails'||a.gender==='LGBTQIA+')&&(!['osyFrom','osyTo'].includes(field)||a.isOsy==='Yes');
const allowed=(a:Record<string,unknown>)=>fields.filter(f=>f.editable&&applicable(f.fieldId,a)).map(f=>f.fieldId).sort();
const same=(a:unknown[],b:unknown[])=>a.length===b.length&&a.every((v,i)=>v===b[i]);
function targets(x:unknown,output:boolean){
 if(!Array.isArray(x)||x.length>32)return false;
 let total=0;const used=[];
 for(const t of x){if(!obj(t)||!keys(t,output?['sectionId','fieldId','note']:['fieldId','note'])||typeof t.fieldId!=='string'||!text(t.note,1000)||!String(t.note).trim())return false;
  const f=fields.find(f=>f.fieldId===t.fieldId&&f.editable);if(!f||(output&&t.sectionId!==f.sectionId))return false;
  total+=[...String(t.note).trim()].length;used.push(t.fieldId);
 }return total<=16000&&unique(used);
}
function review(x:unknown){return obj(x)&&keys(x,['eventId','decision','note','targets','actorLabel','position','recordedAt'])&&id(x.eventId)&&decision(x.decision)&&text(x.note,1000)&&
 (x.decision!=='rejected'||[...String(x.note).trim()].length>=10)&&targets(x.targets,true)&&Array.isArray(x.targets)&&(x.decision==='needs_changes')===(x.targets.length>0)&&text(x.actorLabel,80)&&String(x.actorLabel).trim().length>0&&position(x.position)&&time(x.recordedAt);}
function actor(x:unknown){return obj(x)&&((keys(x,['kind'])&&x.kind==='associated_youth')||(keys(x,['kind','actorLabel','position'])&&x.kind==='staff'&&text(x.actorLabel,80)&&String(x.actorLabel).trim()&&position(x.position)));}
function revision(x:Record<string,unknown>){return positive(x.answerRevision)&&answers(x.answers)&&time(x.submittedAt)&&time(x.snapshotAt)&&Date.parse(String(x.snapshotAt))>=Date.parse(String(x.submittedAt))&&
 ['enrollment_snapshot','resubmission'].includes(String(x.revisionKind))&&(x.answerRevision===1)===(x.revisionKind==='enrollment_snapshot')&&actor(x.recordedBy)&&(x.decision===null||review(x.decision));}
function detail(x:unknown){
 if(!obj(x)||!keys(x,['responseId','kkNumber','answerRevision','status','answers','submittedAt','snapshotAt','revisionKind','recordedBy','decision','allowedFieldIds','editableFieldIds','draft','source','encoderReceipt'])||!id(x.responseId)||!/^\d{4,}$/.test(String(x.kkNumber))||!revision(x)||!status(x.status)||(x.decision===null?x.status!=='pending_review':!obj(x.decision)||x.status!==x.decision.decision)||!obj(x.answers)||!Array.isArray(x.allowedFieldIds)||!same(x.allowedFieldIds,allowed(x.answers))||!Array.isArray(x.editableFieldIds)||!unique(x.editableFieldIds))return false;
 if(!['self_service','walk_in','demo_import'].includes(String(x.source)))return false;
 if(x.source==='self_service'){if(x.encoderReceipt!==null)return false;}else{const e=x.encoderReceipt;if(!obj(e)||!keys(e,['kind','actorLabel','position','recordedAt','noticeVersion'])||e.kind!=='fictional_staff_attestation'||!text(e.actorLabel,80)||!String(e.actorLabel).trim()||!position(e.position)||!time(e.recordedAt)||e.noticeVersion!=='synthetic-s1-028-encoder-v1')return false;}
 if(x.draft===null)return x.editableFieldIds.length===0;
 const d=x.draft;if(x.status!=='needs_changes'||!obj(d)||!keys(d,['version','answers'])||!positive(d.version)||!answers(d.answers)||!obj(d.answers)||!obj(x.decision)||!Array.isArray(x.decision.targets))return false;
 const requested=x.decision.targets.filter(obj).map(t=>t.fieldId);
 const editable=allowed(d.answers).filter(k=>requested.includes(k)||(requested.includes('isOsy')&&['osyFrom','osyTo'].includes(k))||(requested.includes('gender')&&k==='lgbtqiaDetails'));
 return same(x.editableFieldIds,editable);
}
const receipt=(x:unknown)=>obj(x)&&keys(x,['responseId','answerRevision','draftVersion','status','recordedAt'])&&id(x.responseId)&&positive(x.answerRevision)&&Number.isSafeInteger(x.draftVersion)&&Number(x.draftVersion)>=0&&status(x.status)&&time(x.recordedAt);
const cursor=(x:unknown)=>x===null||(obj(x)&&keys(x,['submittedAt','responseId'])&&time(x.submittedAt)&&id(x.responseId));
function registryRow(x:unknown){return obj(x)&&keys(x,['responseId','kkNumber','firstName','surname','ageGroup','education','submittedAt','reportingDate','reportingDateKind','source','reviewStatus','reviewRevision','isVerified','answerRevision'])&&id(x.responseId)&&/^\d{4,}$/.test(String(x.kkNumber))&&['firstName','surname','ageGroup','education'].every(k=>text(x[k]))&&time(x.submittedAt)&&/^\d{4}-\d{2}-\d{2}$/.test(String(x.reportingDate))&&['actual_submission','synthetic_illustration'].includes(String(x.reportingDateKind))&&['self_service','walk_in','demo_import'].includes(String(x.source))&&(x.source==='demo_import')===(x.reportingDateKind==='synthetic_illustration')&&status(x.reviewStatus)&&x.reviewRevision===(x.reviewStatus==='pending_review'?0:1)&&x.isVerified===false&&(x.answerRevision===null||positive(x.answerRevision));}
function analyticsRow(x:unknown){return obj(x)&&keys(x,['reportingDate','reportingDateKind','source','age','ageGroup','gender','civilStatus','education','workStatus','isOsy','skVoter','nationalVoter','election2023','kkAttendance','organizationPresent','programCategories'])&&/^\d{4}-\d{2}-\d{2}$/.test(String(x.reportingDate))&&['actual_submission','synthetic_illustration'].includes(String(x.reportingDateKind))&&['self_service','walk_in','demo_import'].includes(String(x.source))&&(x.source==='demo_import')===(x.reportingDateKind==='synthetic_illustration')&&['age','ageGroup','gender','civilStatus','education','workStatus','skVoter','nationalVoter','kkAttendance'].every(k=>text(x[k]))&&(x.isOsy===null||text(x.isOsy))&&[null,'Yes','No'].includes(x.election2023 as string|null)&&typeof x.organizationPresent==='boolean'&&Array.isArray(x.programCategories)&&unique(x.programCategories)&&x.programCategories.every(c=>['Skills/Livelihood','Sports','Education support','Health','Environment','Arts','Governance','Unclassified suggestion'].includes(String(c)));}
export function youthCorrectionsV1(client:SupabaseClient):YouthCorrectionsV1{
 async function call<T>(name:string,args:object,valid:(x:unknown)=>unknown,input=true):Promise<ReviewResultV2<T>>{
  if(!input)return {kind:'invalid'};
  try{const initial=await client.auth.getSession();if(initial.error||!initial.data.session)return {kind:'denied'};
   const {data,error}=await client.rpc(name,args);const latest=await client.auth.getSession();
   if(latest.error||latest.data.session?.access_token!==initial.data.session.access_token||latest.data.session?.user.id!==initial.data.session.user.id)return {kind:'unavailable'};
   if(error)return {kind:error.code==='42501'?'denied':error.code==='40001'?'conflict':['22023','22P02','22007','22008'].includes(error.code)?'invalid':'unavailable'};
   return valid(data)?{kind:'ok',data:data as T}:{kind:'unavailable'};
  }catch{return {kind:'unavailable'};}
 }
 const staffNotice='synthetic-s1-030-staff-corrections-v1';
 const save=(responseId:string|null,rev:number,version:number,patch:Record<string,string>,requestId:string)=>call<CorrectionReceiptV1>('youth_correction_'+(responseId?'staff_':'')+'save_v1',{
  ...(responseId?{p_response_id:responseId}:{}),p_answer_revision:rev,p_draft_version:version,p_patch:patch,p_request_id:requestId},x=>receipt(x)&&obj(x)&&x.answerRevision===rev&&x.draftVersion===version+1&&x.status==='needs_changes'&&(!responseId||x.responseId===responseId),id(requestId)&&positive(rev)&&positive(version)&&answers(patch)&&Object.keys(patch).length>0&&(!responseId||id(responseId)));
 const submit=(responseId:string|null,rev:number,version:number,requestId:string,accepted:boolean,certified:boolean)=>call<CorrectionReceiptV1>('youth_correction_'+(responseId?'staff_':'')+'resubmit_v1',{
  ...(responseId?{p_response_id:responseId}:{}),p_answer_revision:rev,p_draft_version:version,p_request_id:requestId,p_notice_version:staffNotice,...(responseId?{p_attested:accepted}:{p_accepted:accepted}),p_certified:certified},x=>receipt(x)&&obj(x)&&x.answerRevision===rev+1&&x.draftVersion===0&&x.status==='pending_review'&&(!responseId||x.responseId===responseId),id(requestId)&&positive(rev)&&positive(version)&&accepted===true&&certified===true&&(!responseId||id(responseId)));
 return {
  mine:()=>call('youth_correction_mine_v1',{},x=>detail(x)&&obj(x)&&x.source==='self_service'),
  detail:responseId=>call('youth_correction_detail_v1',{p_response_id:responseId},x=>detail(x)&&obj(x)&&x.responseId===responseId&&x.draft===null,id(responseId)),
  history:(responseId,beforeRevision,limit=10)=>call('youth_correction_history_v1',{p_response_id:responseId,p_before_revision:beforeRevision??null,p_limit:limit},x=>{
   if(!obj(x)||!keys(x,['responseId','items','nextBeforeRevision'])||x.responseId!==responseId||!Array.isArray(x.items)||x.items.length>limit)return false;
   let previous=beforeRevision??Number.MAX_SAFE_INTEGER;for(const r of x.items){if(!obj(r)||!keys(r,['answerRevision','answers','submittedAt','snapshotAt','revisionKind','recordedBy','decision'])||!revision(r)||Number(r.answerRevision)>=previous)return false;previous=Number(r.answerRevision);}
   return x.nextBeforeRevision===null||(x.items.length===limit&&x.nextBeforeRevision===previous);
  },id(responseId)&&Number.isSafeInteger(limit)&&limit>=1&&limit<=10&&(beforeRevision===undefined||positive(beforeRevision))),
  decide:(responseId,rev,outcome,note,targetList,requestId)=>call('youth_correction_decide_v1',{p_response_id:responseId,p_answer_revision:rev,p_decision:outcome,p_note:note,p_targets:targetList,p_request_id:requestId},x=>receipt(x)&&obj(x)&&x.responseId===responseId&&x.answerRevision===rev&&x.status===outcome,id(responseId)&&id(requestId)&&positive(rev)&&decision(outcome)&&text(note,1000)&&(outcome!=='rejected'||[...note.trim()].length>=10)&&targets(targetList,false)&&(outcome==='needs_changes')===(targetList.length>0)),
  save:(rev,version,patch,requestId)=>save(null,rev,version,patch,requestId),
  staffBegin:(responseId,requestId,attested)=>call('youth_correction_staff_begin_v1',{p_response_id:responseId,p_request_id:requestId,p_notice_version:staffNotice,p_attested:attested},x=>receipt(x)&&obj(x)&&x.responseId===responseId&&x.answerRevision===1&&x.draftVersion===0&&x.status==='pending_review',id(responseId)&&id(requestId)&&attested===true),
  staffEdit:responseId=>call('youth_correction_staff_edit_v1',{p_response_id:responseId},x=>detail(x)&&obj(x)&&x.responseId===responseId&&x.source!=='self_service',id(responseId)),
  staffSave:(responseId,rev,version,patch,requestId)=>save(responseId,rev,version,patch,requestId),
  staffResubmit:(responseId,rev,version,requestId,attested,certified)=>submit(responseId,rev,version,requestId,attested,certified),
  registry:(limit=25,before)=>call('youth_staff_registry_v4',{p_limit:limit,p_before_time:before?.submittedAt??null,p_before_id:before?.responseId??null},x=>obj(x)&&keys(x,['items','nextCursor'])&&Array.isArray(x.items)&&x.items.length<=limit&&x.items.every(registryRow)&&cursor(x.nextCursor),Number.isSafeInteger(limit)&&limit>=1&&limit<=50&&(!before||cursor(before))),
  analytics:(limit=25,before)=>call('youth_staff_analytics_v2',{p_limit:limit,p_before_time:before?.submittedAt??null,p_before_id:before?.responseId??null},x=>obj(x)&&keys(x,['items','nextCursor'])&&Array.isArray(x.items)&&x.items.length<=limit&&x.items.every(analyticsRow)&&cursor(x.nextCursor),Number.isSafeInteger(limit)&&limit>=1&&limit<=50&&(!before||cursor(before))),
 };
}
