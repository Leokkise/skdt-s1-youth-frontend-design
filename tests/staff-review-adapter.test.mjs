import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {runInNewContext} from 'node:vm';
const out=await build({entryPoints:['src/auth/youth-review.ts'],bundle:true,write:false,format:'cjs',platform:'node',external:['@supabase/supabase-js']});
const module={exports:{}};runInNewContext(out.outputFiles[0].text,{module,exports:module.exports});const {youthReviewV1}=module.exports;
const id='00000000-0000-4000-8000-000000000026',at='2026-10-22T00:00:00Z';
function fixture(){let session={access_token:'synthetic',user:{id:'synthetic'}};const c={auth:{getSession:async()=>({data:{session}})},rpc:async()=>({data:null})};return {c,api:youthReviewV1(c),setSession:s=>session=s};}
const event={eventId:id,revision:1,decision:'needs_changes',note:'Synthetic clarification',recordedAt:at,actorLabel:'Designated synthetic reviewer'};
const state={responseId:id,status:'needs_changes',revision:1,history:[event]};
test('review adapter validates event/state and preserves bounded conflict/denial/session results',async()=>{
  const f=fixture();f.c.rpc=async()=>({data:state});assert.equal((await f.api.mine()).kind,'ok');
  f.c.rpc=async()=>({data:{...state,history:[{...event,note:'😀'.repeat(501)}]}});assert.equal((await f.api.mine()).kind,'ok');
  f.c.rpc=async()=>({data:{...state,history:[{...event,note:'😀'.repeat(5)}]}});assert.equal((await f.api.mine()).kind,'unavailable');
  for(const bad of [{...state,actorId:id},{...state,history:[{...event,actorId:id}]},{...state,history:[{...event,note:'\u00a0'.repeat(10)}]},{...state,history:[{...event,note:'\u000b'.repeat(10)}]},{...state,revision:0}]){f.c.rpc=async()=>({data:bad});assert.equal((await f.api.mine()).kind,'unavailable');}
  for(const [code,kind]of [['40001','conflict'],['42501','denied'],['22023','invalid'],['50000','unavailable']]){f.c.rpc=async()=>({error:{code,message:'private diagnostic'}});assert.equal((await f.api.mine()).kind,kind);}
  f.c.rpc=async()=>{f.setSession(null);return {data:state};};assert.equal((await f.api.mine()).kind,'unavailable');assert.equal((await f.api.mine()).kind,'denied');
});
test('review adapter sends fixed owner notice and caller-free decision/retry arguments',async()=>{
  const f=fixture();let sent;f.c.rpc=async(name,args)=>{sent={name,args};return {data:{responseId:id,noticeVersion:'synthetic-s1-026-review-v1',recordedAt:at}};};
  assert.equal((await f.api.acknowledge(true)).kind,'ok');assert.deepEqual(JSON.parse(JSON.stringify(sent)),{name:'youth_allow_review_v1',args:{p_notice_version:'synthetic-s1-026-review-v1',p_accepted:true}});
  f.c.rpc=async(name,args)=>{sent={name,args};return {data:state};};assert.equal((await f.api.decide(id,'needs_changes',event.note,0,id)).kind,'ok');
  assert.deepEqual(JSON.parse(JSON.stringify(sent)),{name:'youth_review_decide_v1',args:{p_response_id:id,p_decision:'needs_changes',p_note:event.note,p_expected_revision:0,p_request_id:id}});
});
test('review adapter rejects overexposed lists, unknown detail fields and inconsistent workload counts',async()=>{
  const f=fixture(),row={responseId:id,kkNumber:'0001',firstName:'DEMO',surname:'DEMO',submittedAt:at,isVerified:false,reviewStatus:'pending_review',reviewRevision:0};
  f.c.rpc=async()=>({data:{items:[row],nextCursor:null}});assert.equal((await f.api.list()).kind,'ok');f.c.rpc=async()=>({data:{items:[{...row,answers:{}}],nextCursor:null}});assert.equal((await f.api.list()).kind,'unavailable');
  const detail={responseId:id,kkNumber:'0001',submittedAt:at,isVerified:false,noticeVersion:'synthetic-s1-026-review-v1',acknowledgedAt:at,review:state,answers:{firstName:'DEMO'}};
  f.c.rpc=async()=>({data:detail});assert.equal((await f.api.detail(id)).kind,'ok');f.c.rpc=async()=>({data:{...detail,answers:{privateFutureField:'unexpected'}}});assert.equal((await f.api.detail(id)).kind,'unavailable');
  for(const x of [{submittedCount:0,pendingCount:0,approvedCount:0,needsChangesCount:0,rejectedCount:0,actorId:id},{submittedCount:1,pendingCount:0,approvedCount:0,needsChangesCount:0,rejectedCount:0}]){f.c.rpc=async()=>({data:x});assert.equal((await f.api.counts()).kind,'unavailable');}
});
