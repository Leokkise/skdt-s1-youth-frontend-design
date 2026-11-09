import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/auth/registration-v2.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {registrationV2} = await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const id='12345678-1234-4234-8234-123456789abc', token='a'.repeat(64);
test('registration request sends only normalized email with guarded fetch options', async () => {
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async (url,options)=>{
      assert.equal(String(url),'http://127.0.0.1:5190/');
      assert.deepEqual(JSON.parse(options.body),{action:'request',email:'owner@example.invalid'});
      assert.equal(options.credentials,'omit'); assert.equal(options.redirect,'error'); assert.equal(options.cache,'no-store');
      return Response.json({kind:'checkEmail',attemptId:id,attemptToken:token});
    };
    assert.equal((await registrationV2().request(' OWNER@example.invalid ')).kind,'checkEmail');
  } finally {globalThis.fetch=original;}
});
test('verification and completion preserve exact attempt/proof and stable retry inputs', async () => {
  const original=globalThis.fetch, calls=[];
  try {
    globalThis.fetch=async (_url,o)=>{calls.push(JSON.parse(o.body)); return calls.length===1 ? Response.json({kind:'passwordRequired',setupToken:token,expiresAt:new Date(Date.now()+60000).toISOString()}) : calls.length===2 ? Response.json({kind:'unavailable'},{status:503}) : Response.json({kind:'complete'});};
    const api=registrationV2();
    assert.equal((await api.verify(id,token,'123456')).kind,'passwordRequired');
    assert.equal((await api.complete(id,token,'Owner-pass-9','Owner-pass-9',id)).kind,'unavailable');
    assert.equal((await api.complete(id,token,'Owner-pass-9','Owner-pass-9',id)).kind,'complete');
    assert.deepEqual(calls[1],calls[2]); assert.deepEqual(calls[0],{action:'verify',attemptId:id,attemptToken:token,code:'123456'});
  } finally {globalThis.fetch=original;}
});
test('documented setup rejection is distinct; malformed success and expired proof fail closed', async () => {
  const original=globalThis.fetch;
  try {
    const api=registrationV2(); globalThis.fetch=async()=>Response.json({kind:'setupRejected'},{status:403});
    assert.equal((await api.request('owner@example.invalid')).kind,'setupRejected');
    assert.equal((await api.verify(id,token,'123456')).kind,'setupRejected');
    globalThis.fetch=async()=>Response.json({kind:'passwordRequired',setupToken:token,expiresAt:new Date(0).toISOString()});
    assert.equal((await api.verify(id,token,'123456')).kind,'setupRejected');
    globalThis.fetch=async()=>Response.json({kind:'checkEmail',attemptId:id,attemptToken:token,session:'forbidden'});
    assert.equal((await api.request('owner@example.invalid')).kind,'unavailable');
    globalThis.fetch=async()=>{throw Error('network');};
    assert.equal((await api.request('owner@example.invalid')).kind,'unavailable');
  } finally {globalThis.fetch=original;}
});
test('password validation counts Unicode characters and UTF-8 bytes before any network call', async () => {
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async()=>{throw Error('must not reach network');};
    const api=registrationV2();
    for(const p of ['short','😀'.repeat(19)]) assert.equal((await api.complete(id,token,p,p,id)).kind,'invalidPassword');
    assert.equal((await api.complete(id,token,'abcdefgh','different',id)).kind,'invalidPassword');
    assert.throws(()=>registrationV2('https://example.com/'));
  } finally {globalThis.fetch=original;}
});
test('superseded adapter responses cannot replace the newer attempt', async () => {
  const original=globalThis.fetch; let release;
  try {
    let count=0; globalThis.fetch=async()=>++count===1 ? new Promise(r=>{release=r;}) : Response.json({kind:'checkEmail',attemptId:id,attemptToken:token});
    const api=registrationV2(), earlier=api.request('owner@example.invalid');
    assert.equal((await api.request('owner@example.invalid')).kind,'checkEmail');
    release(Response.json({kind:'checkEmail',attemptId:id,attemptToken:token}));
    assert.equal((await earlier).kind,'unavailable');
  } finally {globalThis.fetch=original;}
});
