import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { runInNewContext } from 'node:vm';
const out = await build({ entryPoints: ['src/auth/staff-access.ts'], bundle: true, write: false, format: 'cjs', platform: 'node' });
const module = { exports: {} };
runInNewContext(out.outputFiles[0].text, { module, exports: module.exports });
const { canPresentReview } = module.exports;

test('staff presentation requires freshly checked active account and exact review capability', () => {
  const allowed = { kind: 'signedIn', authUserId: 'synthetic-reviewer', access: { accountStatus: 'active', roles: [], capabilities: ['youth.registration_review'] } };
  assert.equal(canPresentReview(allowed, false), true);
  assert.equal(canPresentReview(allowed, true), false);
  for (const kind of ['loading', 'signedOut', 'error', 'unavailable']) assert.equal(canPresentReview({ kind }, false), false);
  for (const status of [null, 'suspended']) assert.equal(canPresentReview({ ...allowed, access: { ...allowed.access, accountStatus: status } }, false), false);
  for (const roles of [['sk_admin'], ['sk_staff'], ['youth_registration_reviewer']]) {
    assert.equal(canPresentReview({ ...allowed, access: { ...allowed.access, roles, capabilities: ['access.manage'] } }, false), false);
  }
});
