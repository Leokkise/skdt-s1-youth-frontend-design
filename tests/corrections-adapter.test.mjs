import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {runInNewContext} from 'node:vm';
const bundle=await build({entryPoints:['src/auth/youth-corrections.ts'],bundle:true,write:false,format:'cjs',platform:'node',external:['@supabase/supabase-js']});
const module={exports:{}};runInNewContext(bundle.outputFiles[0].text,{module,exports:module.exports});
const id='00000000-0000-4000-8000-000000000030',other='00000000-0000-4000-8000-000000000031',at='2026-10-25T00:00:00Z';
const catalog=JSON.parse(fs.readFileSync('contracts/v1/correction-fields.json'));
const allowed=catalog.filter(f=>f.editable&&!['osyFrom','osyTo','lgbtqiaDetails'].includes(f.fieldId)).map(f=>f.fieldId).sort();
const choice={eventId:id,decision:'needs_changes',note:'',targets:[{fieldId:'street',sectionId:'household',note:'<b>Fictional correction note</b>'}],actorLabel:'Synthetic chairperson',position:'chairperson',recordedAt:at};
const detail={responseId:id,kkNumber:'0001',answerRevision:1,status:'needs_changes',answers:{street:'Fictional',gender:'Male'},submittedAt:at,snapshotAt:at,revisionKind:'enrollment_snapshot',recordedBy:{kind:'associated_youth'},decision:choice,allowedFieldIds:allowed,editableFieldIds:['street'],draft:{version:1,answers:{street:'Fictional',gender:'Male'}},source:'self_service',encoderReceipt:null};
function fixture(){let session={access_token:'synthetic-test-token',user:{id}};const calls=[];const client={auth:{getSession:async()=>({data:{session}})},rpc:async(n,a)=>{calls.push({n,a});return {data:structuredClone(detail)};}};return {client,calls,api:module.exports.youthCorrectionsV1(client),signOut:()=>session=null};}
test('correction adapter accepts only server field catalog and matching selected resource without staff draft leakage',async()=>{
 const f=fixture();assert.equal((await f.api.mine()).kind,'ok');assert.equal((await f.api.detail(id)).kind,'unavailable');
 for(const bad of [{...detail,authId:id},{...detail,allowedFieldIds:[...allowed,'age']},{...detail,editableFieldIds:['street','rbiNumber']},{...detail,decision:{...choice,targets:[{...choice.targets[0],sectionId:'personal'}]}},{...detail,status:'approved'}]){
  f.client.rpc=async()=>({data:bad});assert.equal((await f.api.mine()).kind,'unavailable');
 }
 f.client.rpc=async()=>({data:{...detail,draft:null,editableFieldIds:[]}});assert.equal((await f.api.detail(id)).kind,'ok');assert.equal((await f.api.detail(other)).kind,'unavailable');assert.equal((await f.api.staffEdit(id)).kind,'unavailable');
});
test('target adapter rejects empty, hidden catalog-independent, duplicate, derived and excessive notes before RPC',async()=>{
 const f=fixture();for(const list of [[],[{fieldId:'age',note:'Fix'}],[{fieldId:'unknown',note:'Fix'}],[{fieldId:'street',note:'\t\n\u00a0'}],[{fieldId:'street',note:'Fix'},{fieldId:'street',note:'Again'}],allowed.slice(0,17).map(fieldId=>({fieldId,note:'x'.repeat(1000)}))])assert.equal((await f.api.decide(id,1,'needs_changes','',list,id)).kind,'invalid');
 assert.equal(f.calls.length,0);
});
test('correction receipts bind response/revision/outcome and preserve exact target payload outside free-text note',async()=>{
 const f=fixture(),r={responseId:id,answerRevision:1,draftVersion:1,status:'needs_changes',recordedAt:at};f.client.rpc=async(n,a)=>{f.calls.push({n,a});return {data:r};};
 const targets=[{fieldId:'street',note:'Fictional correction only'}];assert.equal((await f.api.decide(id,1,'needs_changes','',targets,id)).kind,'ok');assert.equal(f.calls[0].a.p_note,'');assert.equal(f.calls[0].a.p_targets[0].fieldId,'street');assert.ok(!('p_actor_id' in f.calls[0].a));
 for(const bad of [{...r,responseId:other},{...r,answerRevision:2},{...r,status:'approved'},{...r,token:'not-allowed'}]){f.client.rpc=async()=>({data:bad});assert.equal((await f.api.decide(id,1,'needs_changes','',targets,id)).kind,'unavailable');}
});
test('staff resubmission retains its explicit fixed attestation and owner resubmit is retired',async()=>{
 const f=fixture();f.client.rpc=async(n,a)=>{f.calls.push({n,a});return {data:{responseId:id,answerRevision:2,draftVersion:0,status:'pending_review',recordedAt:at}};};
 assert.equal(f.api.resubmit,undefined);assert.equal((await f.api.staffResubmit(id,1,2,id,true,true)).kind,'ok');assert.equal(f.calls[0].a.p_notice_version,'synthetic-s1-030-staff-corrections-v1');assert.equal(f.calls[0].a.p_response_id,id);assert.equal((await f.api.staffResubmit(id,1,2,id,false,true)).kind,'invalid');assert.equal((await f.api.staffResubmit(id,1,2,id,true,false)).kind,'invalid');
});
test('selected history binds ID, strict page order and cursor and rejects identity/free-field expansion',async()=>{
 const f=fixture(),r={answerRevision:1,answers:detail.answers,submittedAt:at,snapshotAt:at,revisionKind:'enrollment_snapshot',recordedBy:{kind:'associated_youth'},decision:choice};
 f.client.rpc=async()=>({data:{responseId:id,items:[r],nextBeforeRevision:null}});assert.equal((await f.api.history(id)).kind,'ok');assert.equal((await f.api.history(other)).kind,'unavailable');
 for(const bad of [{responseId:id,items:[r,r],nextBeforeRevision:null},{responseId:id,items:[{...r,actorId:id}],nextBeforeRevision:null},{responseId:id,items:[r],nextBeforeRevision:2}]){f.client.rpc=async()=>({data:bad});assert.equal((await f.api.history(id)).kind,'unavailable');}
});
test('correction calls discard late results after logout and map only bounded errors',async()=>{
 const f=fixture();let resolve;f.client.rpc=()=>new Promise(r=>resolve=r);const pending=f.api.mine();await new Promise(r=>setTimeout(r,0));f.signOut();resolve({data:detail});assert.equal((await pending).kind,'unavailable');
 const g=fixture();for(const [code,kind]of [['42501','denied'],['40001','conflict'],['22023','invalid'],['23514','unavailable']]){g.client.rpc=async()=>({error:{code,message:'private diagnostic'}});assert.equal((await g.api.mine()).kind,kind);}
});
test('retired owner submit, begin and walk-in entry methods are not exposed',()=>{const f=fixture();for(const name of ['submit','begin','walkin'])assert.equal(f.api[name],undefined);assert.equal(f.calls.length,0);});
