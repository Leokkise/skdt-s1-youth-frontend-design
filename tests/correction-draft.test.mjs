import test from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import {runInNewContext} from 'node:vm';
const output=await build({entryPoints:['src/demo/correction-draft.ts'],bundle:true,write:false,format:'cjs',platform:'node'});const module={exports:{}};runInNewContext(output.outputFiles[0].text,{module,exports:module.exports});const {correctionDraftError:check}=module.exports;
test('correction drafts require unique permitted fields and bounded nonblank per-field notes',()=>{
 assert.notEqual(check([],['birthdate']),'');
 assert.equal(check([{fieldId:'birthdate',note:'Correct the date.'}],['birthdate']),'');
 for(const targets of [[{fieldId:'age',note:'Correct age.'}],[{fieldId:'birthdate',note:' '}],[{fieldId:'birthdate',note:'x'.repeat(1001)}],[{fieldId:'birthdate',note:'One'},{fieldId:'birthdate',note:'Two'}]])assert.notEqual(check(targets,['birthdate']),'');
 assert.equal(check([{fieldId:'birthdate',note:'🙂'.repeat(1000)}],['birthdate']),'');
 const ids=Array.from({length:33},(_,i)=>String(i));assert.notEqual(check(ids.map(fieldId=>({fieldId,note:'Fix'})),ids),'');assert.notEqual(check(ids.slice(0,17).map(fieldId=>({fieldId,note:'x'.repeat(1000)})),ids),'');
});
