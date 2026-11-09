import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const directory=await mkdtemp(join(tmpdir(),'s1-auth-config-'));
try {
  for(const name of ['browser-config','local-config']) {
    const source=await readFile(new URL('../src/auth/'+name+'.ts',import.meta.url),'utf8');
    const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace("'./browser-config'","'./browser-config.mjs'");
    await writeFile(join(directory,name+'.mjs'),compiled);
  }
  const {localBrowserConfig}=await import(pathToFileURL(join(directory,'local-config.mjs')).href);
  const env={VITE_SUPABASE_MODE:'local',VITE_SUPABASE_URL:'http://127.0.0.1:54321',VITE_SUPABASE_ANON_KEY:'sb_publishable_nonworking_fixture'};
  test('local Auth configuration requires complete public inputs',()=>{
    assert.equal(localBrowserConfig({}),null);
    assert.equal(localBrowserConfig({VITE_SUPABASE_URL:env.VITE_SUPABASE_URL}),null);
    assert.equal(localBrowserConfig(env).url,env.VITE_SUPABASE_URL);
  });
  test('S1 demo rejects hosted, remote, privileged and credential-bearing configuration',()=>{
    for(const change of [{VITE_SUPABASE_MODE:'hosted-development'},{VITE_SUPABASE_URL:'https://example.supabase.co'},{VITE_SUPABASE_URL:'http://user:password@127.0.0.1:54321'},{VITE_SUPABASE_ANON_KEY:'sb_secret_nonworking_fixture'}])assert.throws(()=>localBrowserConfig({...env,...change}));
  });
} finally { await rm(directory,{recursive:true,force:true}); }
