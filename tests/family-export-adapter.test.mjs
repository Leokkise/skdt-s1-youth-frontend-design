import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {runInNewContext} from 'node:vm';
const bundle=await build({entryPoints:['src/auth/youth-family-export.ts'],bundle:true,write:false,format:'cjs',platform:'node',external:['@supabase/supabase-js']});
const module={exports:{}};runInNewContext(bundle.outputFiles[0].text,{module,exports:module.exports});
const id='00000000-0000-4000-8000-000000000031',other='00000000-0000-4000-8000-000000000032',at='2026-10-25T00:00:00Z';
const row={responseId:id,kkNumber:'0001',firstName:'Fictional',surname:'Sample',reportingDate:'2026-10-25',reportingDateKind:'actual_submission',answerRevision:2,source:'self_service',sections:[{sectionId:'voice',answers:{suggestions:'=SUM(1,2)',message:'<b>Literal answer</b>',certification:'true'}}]};
const response={requestId:id,recordedAt:at,sections:['voice'],items:[row]};
function fixture(){let session={access_token:'synthetic-test',user:{id}};const calls=[];const client={auth:{getSession:async()=>({data:{session}})},rpc:async(n,a)=>{calls.push({n,a});return {data:structuredClone(response)};}};return {client,calls,api:module.exports.youthFamilyExportV1(client),signOut:()=>session=null};}
test('export adapter binds exact approved selection, revision, sections and request and preserves literal answer strings',async()=>{
 const f=fixture(),result=await f.api.exportProfiles([{responseId:id,answerRevision:2}],['voice'],id);assert.equal(result.kind,'ok');assert.equal(result.data.items[0].sections[0].answers.suggestions,'=SUM(1,2)');assert.equal(f.calls.length,1);assert.equal(f.calls[0].n,'youth_staff_profile_export_v1');assert.equal(f.calls[0].a.p_expected_revisions[id],2);
 for(const bad of [{...response,requestId:other},{...response,sections:['household']},{...response,items:[{...row,responseId:other}]},{...response,items:[{...row,answerRevision:1}]},{...response,items:[]}]){f.client.rpc=async()=>({data:bad});assert.equal((await f.api.exportProfiles([{responseId:id,answerRevision:2}],['voice'],id)).kind,'unavailable');}
});
test('full-section parser refuses Auth, audit, acknowledgment, wrong-section fields and invalid reporting dates',async()=>{
 const f=fixture();for(const bad of [{...response,actorId:id},{...response,items:[{...row,receipt:{}}]},{...response,items:[{...row,reportingDate:'2026-02-31'}]},{...response,items:[{...row,sections:[{sectionId:'voice',answers:{rbiNumber:'PRIVATE'}}]}]},{...response,items:[{...row,sections:[{sectionId:'voice',answers:{reviewNote:'UNREQUESTED'}}]}]}]){f.client.rpc=async()=>({data:bad});assert.equal((await f.api.exportProfiles([{responseId:id,answerRevision:2}],['voice'],id)).kind,'unavailable');}
});
test('export requires an explicit bounded unique record and section selection and never loads data for an invalid selection',async()=>{
 const f=fixture();for(const [selected,sections]of [[[],['voice']],[[{responseId:id,answerRevision:null}],[]],[[{responseId:id,answerRevision:null}],['voice','voice']],[[{responseId:id,answerRevision:0}],['voice']],[[{responseId:id,answerRevision:null},{responseId:id,answerRevision:null}],['voice']],[Array.from({length:26},(_,n)=>({responseId:String(n),answerRevision:null})),['voice']]])assert.equal((await f.api.exportProfiles(selected,sections,id)).kind,'invalid');assert.equal(f.calls.length,0);
});
test('export discards late private results after logout and returns only bounded failure kinds',async()=>{
 const f=fixture();let release;f.client.rpc=()=>new Promise(r=>release=r);const pending=f.api.exportProfiles([{responseId:id,answerRevision:2}],['voice'],id);await new Promise(r=>setTimeout(r,0));f.signOut();release({data:response});assert.equal((await pending).kind,'unavailable');
 const g=fixture();for(const [code,kind]of [['42501','denied'],['40001','conflict'],['22023','invalid'],['23514','unavailable']]){g.client.rpc=async()=>({error:{code,message:'private diagnostic'}});assert.equal((await g.api.exportProfiles([{responseId:id,answerRevision:2}],['voice'],id)).kind,kind);}
});

test('retired family consent/save/submit methods are not exposed by the export adapter',()=>{const f=fixture();for(const name of ['acknowledge','staffAcknowledge','save','submit','walkin'])assert.equal(f.api[name],undefined);});
