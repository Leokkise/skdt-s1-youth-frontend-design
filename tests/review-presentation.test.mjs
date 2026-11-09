import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { runInNewContext } from 'node:vm';
import { readFile } from 'node:fs/promises';
const out = await build({ entryPoints: ['src/auth/review-presentation.ts'], bundle: true, write: false, format: 'cjs', platform: 'node' });
const module = { exports: {} };
runInNewContext(out.outputFiles[0].text, { module, exports: module.exports, Intl, Date });
const { decisionError, manilaTime, positionLabel } = module.exports;
test('review input counts Unicode code points and rejects empty or short required notes', () => {
  assert.equal(decisionError('approved', ''), '');
  assert.equal(decisionError('needs_changes', '😀'.repeat(10)), '');
  assert.notEqual(decisionError('rejected', '😀'.repeat(5)), '');
  assert.notEqual(decisionError('needs_changes', '\u00a0'.repeat(20)), '');
  assert.equal(decisionError('approved', '😀'.repeat(1000)), '');
  assert.notEqual(decisionError('approved', '😀'.repeat(1001)), '');
});
test('review times always use Manila and legacy actor presentation stays honest', () => {
  assert.match(manilaTime('2026-10-21T23:00:00Z'), /Oct 22, 2026.*7:00/i);
  assert.equal(positionLabel('legacy_reviewer'), 'Legacy reviewer');
});
test('sharing notice includes its exact version and separate owner choice', async () => {
  const notices = JSON.parse(await readFile('src/auth/review-notices.json', 'utf8'));
  assert.equal(notices.youth.version, 'synthetic-s1-027-review-v1');
  assert.equal(notices.staff.version, 'synthetic-staff-activity-v1');
  assert.equal(notices.youth.paragraphs.length, 7);
  assert.match(notices.youth.checkbox, /chairperson, treasurer and secretary/);
  assert.match(notices.staff.paragraphs.join(' '), /scope is not recorded/);
});
