import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const directory = await mkdtemp(join(tmpdir(), 's1-presentation-tests-'));
try {
  for (const [name, path] of Object.entries({ fields: 'profiling/fields', validation: 'profiling/validation', presentationWorkflow: 'demo/presentationWorkflow', registryData: 'demo/registryData' })) {
    const source = await readFile(new URL(`../src/${path}.ts`, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
      .replace(/from ['"](?:\.\.\/profiling\/|\.\/)(fields|validation|presentationWorkflow)['"]/g, "from './$1.mjs'");
    await writeFile(join(directory, `${name}.mjs`), compiled);
  }
  const { syntheticAnswers } = await import(pathToFileURL(join(directory, 'validation.mjs')).href);
  const { recordDecision, correctResponse, possibleDuplicates, consentReceipt, formatKkNumber } = await import(pathToFileURL(join(directory, 'presentationWorkflow.mjs')).href);
  const { registryRecords, initialRecords, registryFixtures, fixtureAnswers } = await import(pathToFileURL(join(directory, 'registryData.mjs')).href);
  const date = '2026-10-04';
  const submittedAt = '2026-10-04T01:00:00.000Z';
  const reviewedAt = '2026-10-04T01:30:00.000Z';
  const correctedAt = '2026-10-04T02:00:00.000Z';
  const response = { kkNumber: '0007', key: 'fictional-response', answers: { ...syntheticAnswers(date), certification: 'true', privacyConsent: 'true', privacyAcceptedAt: submittedAt, certificationAcceptedAt: submittedAt, noticeVersion: 'test-preview' }, referenceDate: date, status: 'For review', note: '', history: [{ action: 'Profile submitted', actor: 'Synthetic youth', at: submittedAt, note: '' }] };

  test('review decisions retain ordered history and require a useful changes note', () => {
    assert.throws(() => recordDecision(response, 'Needs changes', '  ', reviewedAt), /Explain/);
    const review = recordDecision(response, 'Needs changes', '  Please correct the address.  ', reviewedAt);
    assert.equal(review.note, 'Please correct the address.');
    assert.deepEqual(review.history.map(entry => entry.at), [submittedAt, reviewedAt]);
    assert.equal(review.history[1].actor, 'Synthetic staff');
    assert.equal(response.history.length, 1);
  });

  test('valid corrections preserve identity/date and history, return to review, and keep prior notes in history', () => {
    const returned = { ...response, ...recordDecision(response, 'Needs changes', 'Please correct the address.', reviewedAt) };
    const corrected = correctResponse(returned, { ...returned.answers, address: 'Corrected fictional address' }, correctedAt);
    assert.equal(corrected.key, response.key);
    assert.equal(corrected.referenceDate, date);
    assert.equal(corrected.status, 'For review');
    assert.equal(corrected.note, '');
    assert.equal(corrected.history.length, 3);
    assert.equal(corrected.history[1].note, 'Please correct the address.');
    assert.equal(corrected.history[2].action, 'Corrections submitted');
    assert.notEqual(corrected.answers, returned.answers);
    assert.notEqual(returned.answers.address, corrected.answers.address);
    assert.throws(() => correctResponse(returned, { ...returned.answers, certification: '' }, correctedAt), /check/);
    assert.throws(() => correctResponse(response, response.answers, correctedAt), /Only/);
    assert.throws(() => correctResponse({ ...response, status: 'Approved (demo)' }, response.answers, correctedAt), /Only/);
  });

  test('consent states/timestamps are required; corrections preserve KK number and earlier receipts', () => {
    const receipt = consentReceipt(response.answers);
    assert.equal(receipt.privacyAccepted, true);
    assert.throws(() => consentReceipt({ ...response.answers, privacyConsent: 'false' }), /Accept/);
    assert.throws(() => consentReceipt({ ...response.answers, certificationAcceptedAt: 'invalid' }), /Accept/);
    assert.throws(() => consentReceipt({ ...response.answers, certificationAcceptedAt: '2026-10-03T00:00:00Z' }), /Accept/);
    const returned = { ...response, ...recordDecision(response, 'Needs changes', 'Check street', reviewedAt, ['street', 'unknown', 'street', 'age', 'ageGroup', 'locality']) };
    assert.deepEqual(returned.correctionFields, ['street']);
    const corrected = correctResponse(returned, { ...response.answers, certificationAcceptedAt: correctedAt }, correctedAt);
    assert.equal(corrected.kkNumber, '0007');
    assert.equal(corrected.history.at(-1).consent.certifiedAt, correctedAt);
    const rejected = { ...corrected, ...recordDecision(corrected, 'Rejected (demo)', 'Fictional rejection', correctedAt) };
    assert.equal(rejected.kkNumber, '0007');
    assert.throws(() => recordDecision(response, 'Rejected (demo)', '', reviewedAt), /Explain/);
    assert.equal(formatKkNumber(1), '0001'); assert.equal(formatKkNumber(3001), '3001'); assert.equal(formatKkNumber(10000), '10000');
    assert.throws(() => formatKkNumber(0), /Invalid/);
  });
  test('duplicate warnings normalize names, require all exact fields, exclude self, and never match on RBI/contact alone', () => {
    const candidates = [{ key: 'a', answers: { firstName: 'Juan   Miguel', surname: 'Dela Cruz', birthdate: '2006-01-01', rbiNumber: 'fake-a' } }];
    const answers = { firstName: ' juan miguel ', surname: ' DELA CRUZ ', birthdate: '2006-01-01', rbiNumber: 'fake-b' };
    assert.equal(possibleDuplicates(answers, candidates).length, 1);
    assert.equal(possibleDuplicates(answers, candidates, 'a').length, 0);
    assert.equal(possibleDuplicates({ ...answers, birthdate: '' }, candidates).length, 0);
    assert.equal(possibleDuplicates({ ...answers, surname: 'Santos', rbiNumber: 'fake-a' }, candidates).length, 0);
    assert.equal(possibleDuplicates({ ...answers, birthdate: '2006-01-02' }, candidates).length, 0);
  });

  test('registry/report snapshot includes walk-ins and latest decisions without adding a second corrected profile', () => {
    const returned = { ...response, ...recordDecision(response, 'Needs changes', 'Check details.', reviewedAt) };
    const corrected = correctResponse(returned, returned.answers, correctedAt);
    const walkIn = { ...response, key: 'walk-in', history: [] };
    const review = recordDecision({ history: [] }, 'Needs changes', 'Sample note.', reviewedAt);
    const records = registryRecords([corrected, walkIn], { 'fixture-alpha': review });
    assert.equal(records.length, registryFixtures.length + 2);
    assert.equal(records.filter(item => item.key === response.key).length, 1);
    assert.equal(records.find(item => item.key === 'fixture-alpha').status, 'Needs changes');
    assert.equal(initialRecords[0].status, 'For review');
    assert.equal(possibleDuplicates(fixtureAnswers('fixture-alpha', date), initialRecords.map(item => ({ key: item.key, answers: fixtureAnswers(item.key, date) }))).length, 1);
  });
} finally {
  await rm(directory, { recursive: true, force: true });
}
