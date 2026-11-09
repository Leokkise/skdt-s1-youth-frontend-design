import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { runInNewContext } from 'node:vm';

const out = await build({ entryPoints: ['src/auth/youth-password.ts'], bundle: true, write: false, format: 'cjs', platform: 'node', plugins: [{ name: 'provider-fixture', setup(b) {
  b.onResolve({ filter: /^@supabase\/supabase-js$/ }, () => ({ path: 'provider', namespace: 'fixture' }));
  b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const createClient=()=>globalThis.provider;' }));
} }] });

for (const scenario of ['success', 'wrong password', 'identity mismatch', 'cleanup failure', 'mismatch', 'account switched', 'update rejected']) {
  test('signed-in password change: ' + scenario, async () => {
    const calls = [], module = { exports: {} };
    const provider = { auth: {
      signInWithPassword: async ({ password }) => {
        calls.push('reauthenticate'); assert.equal(password, 'Synthetic-old-123');
        return { error: scenario === 'wrong password' ? { status: 400 } : null, data: { user: { id: scenario === 'identity mismatch' ? 'other' : 'youth' } } };
      },
      updateUser: async () => { throw Error('Password must be updated through the retained browser session'); },
      signOut: async ({ scope }) => { calls.push('provider:' + scope); return { error: scenario === 'cleanup failure' ? { status: 500 } : null }; },
    } };
    let reads = 0;
    const client = { auth: {
      getUser: async () => ({ error: null, data: { user: { id: ++reads > 1 && scenario === 'account switched' ? 'other' : 'youth', email: 'fixture@example.invalid' } } }),
      updateUser: async ({ password }) => { calls.push('update'); assert.equal(password, 'Synthetic-new-456'); return { error: scenario === 'update rejected' ? { status: 401 } : null }; },
      signOut: async () => { throw Error('The browser session must remain signed in'); },
    } };
    runInNewContext(out.outputFiles[0].text, { module, exports: module.exports, provider });
    const result = await module.exports.youthPasswordV1(client, 'http://127.0.0.1:54321', 'synthetic').change('Synthetic-old-123', 'Synthetic-new-456', scenario === 'mismatch' ? 'different' : 'Synthetic-new-456');
    assert.equal(result.kind, scenario === 'success' ? 'ok' : scenario === 'cleanup failure' ? 'unavailable' : scenario === 'mismatch' ? 'invalidPassword' : 'rejected');
    assert.deepEqual(calls, scenario === 'mismatch' ? [] : scenario === 'wrong password' ? ['reauthenticate'] : ['identity mismatch', 'cleanup failure', 'account switched'].includes(scenario) ? ['reauthenticate', 'provider:local'] : ['reauthenticate', 'provider:local', 'update']);
  });
}
