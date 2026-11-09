import type {RegistrationV2,RegistrationFailureV2,RegistrationAttemptV2,RegistrationProofV2} from '../../contracts/v1/registration-v2';
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const keys=(x:Record<string,unknown>,allowed:string[])=>Object.keys(x).length===allowed.length&&Object.keys(x).every(k=>allowed.includes(k));
const token=(x:unknown):x is string=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const uuid=(x:unknown):x is string=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
export function registrationV2(workerUrl='http://127.0.0.1:5190/'):RegistrationV2{
 const url=new URL(workerUrl);if(url.protocol!=='http:'||!['127.0.0.1','localhost'].includes(url.hostname)||url.port!=='5190'||url.pathname!=='/'||url.username||url.password||url.search||url.hash)throw Error('Local signup provider required');
 let revision=0;
 async function post<T>(payload:object,allowed:string[]):Promise<T|RegistrationFailureV2>{const current=++revision;try{
 const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',cache:'no-store',redirect:'error',body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)}),data:unknown=await r.json();
 if(current!==revision||!object(data)||typeof data.kind!=='string'||!allowed.includes(data.kind))return{kind:'unavailable'};
 if(data.kind==='checkEmail')return r.status===200&&keys(data,['kind','attemptId','attemptToken'])&&uuid(data.attemptId)&&token(data.attemptToken)?data as T:{kind:'unavailable'};
 if(data.kind==='passwordRequired'){
 if(r.status!==200||!keys(data,['kind','setupToken','expiresAt'])||!token(data.setupToken)||typeof data.expiresAt!=='string'||!Number.isFinite(Date.parse(data.expiresAt)))return{kind:'unavailable'};
 return Date.parse(data.expiresAt)<=Date.now()?{kind:'setupRejected'}:data as T;
 }
 if(!keys(data,['kind']))return{kind:'unavailable'};
 if(['existingAccount','complete'].includes(data.kind))return r.status===200?data as T:{kind:'unavailable'};
 return [400,403,409,429,503].includes(r.status)?data as RegistrationFailureV2:{kind:'unavailable'};
 }catch{return{kind:'unavailable'};}}
 return{
 async request(raw){const email=typeof raw==='string'?raw.trim().toLowerCase():'';if(email.length>254||email.split('@')[0].length>64||!/^[a-z0-9.!#$%&*+/=?^_`{|}~-]+@example\.invalid$/.test(email)){++revision;return{kind:'invalidEmail'};}return post<RegistrationAttemptV2>({action:'request',email},['checkEmail','invalidEmail','setupRejected','rateLimited','unavailable']);},
 async verify(attemptId,attemptToken,code){if(!uuid(attemptId)||!token(attemptToken)||typeof code!=='string'||!/^\d{6}$/.test(code)){++revision;return{kind:'invalidCode'};}return post<RegistrationProofV2|{kind:'existingAccount'}>({action:'verify',attemptId,attemptToken,code},['passwordRequired','existingAccount','invalidCode','setupRejected','rateLimited','unavailable']);},
 async complete(attemptId,setupToken,password,confirmation,requestId){if(!uuid(attemptId)||!token(setupToken)||!uuid(requestId)){++revision;return{kind:'setupRejected'};}if(typeof password!=='string'||password!==confirmation||[...password].length<8||new TextEncoder().encode(password).length>72){++revision;return{kind:'invalidPassword'};}return post<{kind:'complete'|'existingAccount'}>({action:'complete',attemptId,setupToken,password,confirmation,requestId},['complete','existingAccount','invalidPassword','setupRejected','conflict','needsSupport','unavailable']);},
 };
}

