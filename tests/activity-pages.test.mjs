import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {runInNewContext} from 'node:vm';
const out=await build({entryPoints:['src/auth/activity-pages.ts'],bundle:true,write:false,format:'cjs',platform:'node'});
const module={exports:{}};runInNewContext(out.outputFiles[0].text,{module,exports:module.exports});
const {activityPages}=module.exports;
test('activity pagination keeps five fixed slots with current and last pages',()=>{
 for(const count of[1,2,6,7,8,12,100,1000])for(let page=0;page<count;page++){
  const slots=Array.from(activityPages(page,count));
  assert.equal(slots.length,Math.min(count,5));
  assert.ok(slots.includes(page));assert.equal(slots.at(-1),count-1);
  if(page===0)assert.equal(slots[0],0);
  if(page===count-1)assert.equal(slots.at(-1),count-1);
  assert.equal(new Set(slots).size,slots.length);
  const numbers=slots.filter(n=>typeof n==='number');
  assert.ok(numbers.every((n,i)=>n>=0&&n<count&&(i===0||n>numbers[i-1])));
 }
});
