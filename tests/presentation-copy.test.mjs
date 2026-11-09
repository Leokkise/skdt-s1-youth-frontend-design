import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { runInNewContext } from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const output = await build({entryPoints:['src/presentation-copy.ts'],bundle:true,write:false,format:'cjs',platform:'node'});
const module={exports:{}};runInNewContext(output.outputFiles[0].text,{module,exports:module.exports});
const {displayLabel}=module.exports;
test('presentation captions preserve stored status and record values',()=>{
  const stored={name:'Fictional 2026 Quarter 4',status:'Approved (demo)',actor:'Synthetic chairperson',reference:'0146'};
  const original=JSON.stringify(stored);
  assert.equal(displayLabel(stored.name),'2026 Quarter 4');
  assert.equal(displayLabel(stored.status),'Approved');
  assert.equal(displayLabel(stored.actor),'chairperson');
  assert.equal(displayLabel(stored.reference),'0146');
  assert.equal(displayLabel('Stored fictional example'),'Stored record');
  assert.equal(JSON.stringify(stored),original);
});

test('approved raw notices retain exact bytes independently of display summaries',async()=>{
  const hashes={
    's1-correction-notice.json':'79a80a16897292005172bf4099652b2f9d1fb03303c9289d1f4e09b65564e7a5',
    's1-staff-correction-notice.json':'85da515a40f219b9332c38ef34322ab504324bfc7863f0f257ad19d68673ad8e',
    's1-family-export-notice.json':'de3bf29dda56b92c371197dac05b366435db623446ff5af5efb38ee4df128e15',
    's1-staff-family-export-notice.json':'aed40bc70b16944a53aaf11496da9cd571cbf06e9020f1d9a0f2a2daf14e535a',
  };
  for(const[file,expected]of Object.entries(hashes))assert.equal(createHash('sha256').update(await readFile('contracts/v1/'+file)).digest('hex'),expected);
});

test('all four revision summaries use professional wording and preserve scope distinctions',()=>{
  for(const staff of [false,true]) for(const family of [false,true]) {
    const copy=module.exports.revisionNoticeCopy(staff,family);
    assert.doesNotMatch(JSON.stringify(copy),/fictional|synthetic|dummy|demo|sample/i);
    assert.match(JSON.stringify(copy),/chairperson/);
    assert.match(JSON.stringify(copy),/Retention/);
    if(staff) assert.match(JSON.stringify(copy),/not youth or guardian consent/);
    if(family) assert.match(JSON.stringify(copy),/RBI/);
    else assert.match(JSON.stringify(copy),/cannot be reopened/);
  }
});
