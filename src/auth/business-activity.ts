import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessActivityV1, BusinessActivityPageV1 } from '../../contracts/v1/business-activity';
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const keys=(x:Record<string,unknown>,allowed:string[])=>Object.keys(x).length===allowed.length&&Object.keys(x).every(k=>allowed.includes(k));
const uuid=(x:unknown)=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const time=(x:unknown)=>typeof x==='string'&&Number.isFinite(Date.parse(x));
function event(x:unknown){return object(x)&&keys(x,['eventId','actorLabel','position','scope','action','recordRef','outcome','recordedAt'])&&uuid(x.eventId)&&
  typeof x.actorLabel==='string'&&x.actorLabel.trim().length>0&&[...x.actorLabel].length<=80&&['chairperson','treasurer','secretary'].includes(String(x.position))&&time(x.recordedAt)&&
  ((x.scope==='auth'&&['password_sign_in','auth_logout_committed'].includes(String(x.action))&&x.recordRef===null&&x.outcome==='provider_committed')||
   (x.scope==='s1'&&x.action==='registration_decision'&&typeof x.recordRef==='string'&&/^\d{4,}$/.test(x.recordRef)&&['approved','needs_changes','rejected'].includes(String(x.outcome))));}
export function businessActivityV1(client:SupabaseClient):BusinessActivityV1{return {read:async(scope='all',limit=25,before)=>{
  try{
    const initial=await client.auth.getSession();if(initial.error||!initial.data.session)return {kind:'denied'};
    const {data,error}=await client.rpc('platform_business_activity_v1',{p_scope:scope,p_limit:limit,p_before_time:before?.recordedAt??null,p_before_id:before?.eventId??null});
    const latest=await client.auth.getSession();if(latest.error||latest.data.session?.access_token!==initial.data.session.access_token||latest.data.session?.user.id!==initial.data.session.user.id)return {kind:'unavailable'};
    if(error)return {kind:error.code==='42501'?'denied':['22023','22P02','22007','22008'].includes(error.code)?'invalid':'unavailable'};
    if(!object(data)||!keys(data,['items','nextCursor','displayTimezone'])||data.displayTimezone!=='Asia/Manila'||!Array.isArray(data.items)||data.items.length>limit||!data.items.every(event)||
      !(data.nextCursor===null||(object(data.nextCursor)&&keys(data.nextCursor,['recordedAt','eventId'])&&time(data.nextCursor.recordedAt)&&uuid(data.nextCursor.eventId))))return {kind:'unavailable'};
    return {kind:'ok',data:data as unknown as BusinessActivityPageV1};
  }catch{return {kind:'unavailable'};}
}};}
