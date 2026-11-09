import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const directory = await mkdtemp(join(tmpdir(), 's1-saved-answers-'));
try {
  const snapshot = await readFile(new URL('../contracts/v1/youth-fields.json', import.meta.url), 'utf8');
  for (const [name, file] of [['fields', 'profiling/fields'], ['validation', 'profiling/validation'], ['saved-answers', 'auth/saved-answers']]) {
    let source = await readFile(new URL('../src/' + file + '.ts', import.meta.url), 'utf8');
    source = source.replace("import fields from '../../contracts/v1/youth-fields.json';", 'const fields = ' + snapshot + ';');
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
      .replace("'./fields'", "'./fields.mjs'").replace("'../profiling/validation'", "'./validation.mjs'");
    await writeFile(join(directory, name + '.mjs'), js);
  }
  const { savedAnswers } = await import(pathToFileURL(join(directory, 'saved-answers.mjs')).href);
  test('saved payload allowlist strips browser receipts/helpers and hidden answers, normalizes mobile', () => {
    const source = { firstName: 'SYNTHETIC', contactNumber: '0900 000 0000', address: 'helper', noticeVersion: 'old', privacyConsent: 'true', privacyAcceptedAt: 'client', certificationAcceptedAt: 'client', gender: 'Male', lgbtqiaDetails: 'hidden', isOsy: 'No', osyFrom: '2020', osyTo: '2021', arbitraryYouthId: 'forged' };
    assert.deepEqual(savedAnswers(source, '2026-10-21'), { firstName: 'SYNTHETIC', contactNumber: '+639000000000', gender: 'Male', isOsy: 'No' });
    assert.equal(source.address, 'helper');
  });
  test('birthday rollover derives current age/group and invalidates stale certification only when age changes', () => {
    const source = { birthdate: '2008-10-21', age: '17', ageGroup: 'Child Youth (15 - 17 yrs old)', certification: 'true', gender: 'LGBTQIA+', lgbtqiaDetails: 'fictional', isOsy: 'Yes', osyFrom: '2024', osyTo: '2025' };
    const updated = savedAnswers(source, '2026-10-21');
    assert.equal(updated.age, '18'); assert.equal(updated.ageGroup, 'Core Youth (18 - 24 yrs old)'); assert.equal(updated.certification, '');
    assert.equal(updated.lgbtqiaDetails, 'fictional'); assert.equal(updated.osyFrom, '2024');
    assert.equal(savedAnswers({ ...updated, certification: 'true' }, '2026-10-21').certification, 'true');
  });
} finally { await rm(directory, { recursive: true, force: true }); }
