import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {runInNewContext} from 'node:vm';
const out=await build({entryPoints:['src/auth/youth-workflow.ts'],bundle:true,write:false,format:'cjs',platform:'node',external:['@supabase/supabase-js']});
const module={exports:{}};runInNewContext(out.outputFiles[0].text,{module,exports:module.exports});
const id='00000000-0000-4000-8000-000000000028',other='00000000-0000-4000-8000-000000000029',at='2026-10-22T00:00:00Z';
const review={responseId:id,status:'approved',revision:1,history:[{eventId:id,revision:1,decision:'approved',note:'',recordedAt:at,actorLabel:'Synthetic chairperson',position:'chairperson'}]};
const detail={source:'self_service',encoderReceipt:null,detail:{responseId:id,kkNumber:'0001',submittedAt:at,answers:{firstName:'Fictional'},isVerified:false,noticeVersion:'synthetic-s1-027-review-v1',acknowledgedAt:at,review}};
function fixture(){let session={access_token:'test',user:{id}};const client={auth:{getSession:async()=>({data:{session}})},rpc:async()=>({data:null})};return {client,api:module.exports.youthWorkflowV1(client),signOut:()=>session=null};}
test('workflow binds selected detail and saved outcome to exact request',async()=>{
 const f=fixture();f.client.rpc=async()=>({data:detail});assert.equal((await f.api.detail(id)).kind,'ok');assert.equal((await f.api.detail(other)).kind,'unavailable');
 f.client.rpc=async()=>({data:review});assert.equal((await f.api.decide(id,'approved','',0,id)).kind,'ok');
 for(const args of [[other,'approved','',0,id],[id,'rejected','Synthetic note',0,id],[id,'approved','Different',0,id]])assert.equal((await f.api.decide(...args)).kind,'unavailable');
});
test('workflow refuses overexposed registry and analytics fields, invalid chronology and cursor',async()=>{
 const f=fixture(),row={responseId:id,kkNumber:'0001',firstName:'Fictional',surname:'Sample',ageGroup:'Core Youth (18 - 24 yrs old)',education:'College Undergraduate',submittedAt:at,reportingDate:'2024-01-05',reportingDateKind:'synthetic_illustration',source:'demo_import',reviewStatus:'approved',reviewRevision:1,isVerified:false};
 f.client.rpc=async()=>({data:{items:[row],nextCursor:null}});assert.equal((await f.api.registry()).kind,'ok');
 for(const bad of [{...row,answers:{}},{...row,source:'self_service'},{...row,reportingDate:'2024-02-31'}]){f.client.rpc=async()=>({data:{items:[bad],nextCursor:null}});assert.equal((await f.api.registry()).kind,'unavailable');}
 const a={reportingDate:'2024-01-05',reportingDateKind:'synthetic_illustration',source:'demo_import',age:'20',ageGroup:row.ageGroup,gender:'Male',civilStatus:'Single',education:row.education,workStatus:'Student',isOsy:null,skVoter:'No',nationalVoter:'No',election2023:null,kkAttendance:'No',organizationPresent:false,programCategories:['Unclassified suggestion']};
 f.client.rpc=async()=>({data:{items:[a],nextCursor:null}});assert.equal((await f.api.analytics()).kind,'ok');
 for(const bad of [{...a,responseId:id},{...a,suggestions:'Private text'},{...a,programCategories:['Unknown']},{...a,programCategories:['Sports','Sports']}]){f.client.rpc=async()=>({data:{items:[bad],nextCursor:null}});assert.equal((await f.api.analytics()).kind,'unavailable');}
 f.client.rpc=async()=>({data:{items:[],nextCursor:{submittedAt:at,responseId:id,actorId:id}}});assert.equal((await f.api.analytics()).kind,'unavailable');
});
test('workflow encoders have explicit staff receipts and never a youth ownership receipt',async()=>{
 const f=fixture(),d={...detail,source:'walk_in',detail:{...detail.detail,noticeVersion:'synthetic-s1-028-encoder-v1'},encoderReceipt:{kind:'fictional_staff_attestation',actorLabel:'😀'.repeat(80),position:'secretary',recordedAt:at,noticeVersion:'synthetic-s1-028-encoder-v1'}};
 f.client.rpc=async()=>({data:d});assert.equal((await f.api.detail(id)).kind,'ok');
 for(const e of [{...d.encoderReceipt,kind:'youth_consent'},{...d.encoderReceipt,actorLabel:'😀'.repeat(81)},{...d.encoderReceipt,actorId:id}]){f.client.rpc=async()=>({data:{...d,encoderReceipt:e}});assert.equal((await f.api.detail(id)).kind,'unavailable');}
});
test('workflow sends fixed notice versions and no caller-controlled actor/time',async()=>{
 const f=fixture();let sent;f.client.rpc=async(name,args)=>{sent={name,args};return {data:null};};await f.api.submit(1,id,true,true,true);
 assert.deepEqual(JSON.parse(JSON.stringify(sent)),{name:'youth_submit_for_review_v1',args:{p_revision:1,p_request_id:id,p_privacy_accepted:true,p_certified:true,p_notice_version:'synthetic-s1-028-submit-v1',p_accepted:true}});
 assert.equal(f.api.walkin,undefined);
});
test('workflow bounds errors and discards late responses after sign-out',async()=>{
 const f=fixture();for(const [code,kind]of [['42501','denied'],['40001','conflict'],['55000','conflict'],['22023','invalid'],['50000','unavailable']]){f.client.rpc=async()=>({error:{code,message:'private'}});assert.equal((await f.api.detail(id)).kind,kind);}
 f.client.rpc=async()=>{f.signOut();return {data:detail};};assert.equal((await f.api.detail(id)).kind,'unavailable');assert.equal((await f.api.detail(id)).kind,'denied');
});
