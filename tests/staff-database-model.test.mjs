import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { runInNewContext } from 'node:vm';
async function moduleFor(path) {
  const out = await build({ entryPoints: [path], bundle: true, write: false, platform: 'node', format: 'cjs' });
  const module = { exports: {} };
  runInNewContext(out.outputFiles[0].text, { module, exports: module.exports, Intl, Date, Set, Map });
  return module.exports;
}
const analytics = await moduleFor('src/demo/analyticsOverview.ts');
const staff = await moduleFor('src/demo/staffInsights.ts');
const record = {
  key: 'database-response', name: 'Fictional import', band: 'Core Youth', education: 'College Undergraduate',
  source: 'demo_import', reportingDate: '2024-04-05', reportingDateKind: 'synthetic_illustration', status: 'Approved (demo)',
  history: [{ action: 'Profile submitted', at: '2026-10-22T08:00:00Z', actor: 'Actual server actor', note: '' }],
  programCategories: ['Sports', 'Education support'],
};
test('stored reporting chronology drives charts without rewriting actual server history', () => {
  assert.equal(analytics.submissionDate(record), '2024-04-05');
  assert.equal(staff.submissionPeriod(record, 'Quarterly'), '2024 Q2');
  assert.equal(staff.monthlyComparison([record], 2024)[3].current, 1);
  assert.equal(analytics.selectedApproved([record], { year: '2024', period: 'Q2', band: 'All age groups' }, '2026-10-22').length, 1);
  assert.equal(record.history[0].at, '2026-10-22T08:00:00Z');
});
test('minimized database summaries never manufacture full fixture answers or free text', () => {
  assert.doesNotThrow(() => staff.staffInsights([record], '2026-10-22'));
  assert.deepEqual(Array.from(analytics.programCategories(record)), ['Sports', 'Education support']);
  assert.equal(record.answers, undefined);
  assert.deepEqual(Array.from(analytics.programCategories({ ...record, programCategories: ['not an approved category'] })), []);
});
