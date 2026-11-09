import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Compile the actual pure domain modules, without adding a test framework dependency.
const directory = await mkdtemp(join(tmpdir(), 's1-profiling-tests-'));
try {
  for (const name of ['fields', 'validation']) {
    const source = await readFile(new URL(`../src/profiling/${name}.ts`, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace("from './fields'", "from './fields.mjs'");
    await writeFile(join(directory, `${name}.mjs`), compiled);
  }
  const { allFields, visibleFields } = await import(pathToFileURL(join(directory, 'fields.mjs')).href);
  const { ageAt, groupForAge, profilingDate, validate, changeAnswer, syntheticAnswers, normalizeMobile } = await import(pathToFileURL(join(directory, 'validation.mjs')).href);
  const date = '2026-09-30';
  const fixture = { ...syntheticAnswers(date), certification: 'true' };

  test('all 35 UI fields have unique identifiers; valid synthetic answers pass', () => {
    assert.equal(allFields.length, 35);
    assert.equal(new Set(allFields.map(field => field.id)).size, 35);
    assert.deepEqual(validate(fixture, date), {});
  });
  test('missing and whitespace-only required answers fail; optional answers may be absent', () => {
    for (const field of allFields.filter(field => field.required)) {
      assert.ok(validate({ ...fixture, [field.id]: '   ' }, date)[field.id], field.id);
    }
    assert.deepEqual(validate(fixture, date), {});
    assert.ok(validate({ ...fixture, certification: 'false' }, date).certification);
    assert.equal(syntheticAnswers(date).certification, undefined);
  });
  test('birthdays, leap dates, impossible dates and Philippine date rollover', () => {
    assert.equal(ageAt('2006-10-01', date), 19);
    assert.equal(ageAt('2006-09-30', date), 20);
    assert.equal(ageAt('2008-02-29', '2026-02-28'), 17);
    assert.equal(ageAt('2008-02-29', '2026-03-01'), 18);
    for (const birth of ['2007-02-29', '2000-13-01', '2027-01-01', 'not-a-date']) assert.equal(ageAt(birth, date), null);
    assert.equal(profilingDate(new Date('2026-09-30T16:01:00Z')), '2026-10-01');
  });
  test('eligibility boundaries 15–30 and each age band match birthdate', () => {
    for (const age of [14, 15, 17, 18, 24, 25, 30, 31]) {
      const answers = { ...fixture, age: String(age), birthdate: `${2026 - age}-09-30`, ageGroup: groupForAge(age) };
      assert.equal(Boolean(validate(answers, date).age), age < 15 || age > 30);
      if (age >= 15 && age <= 30) assert.deepEqual(validate(answers, date), {});
    }
    assert.ok(validate({ ...fixture, age: '20.5' }, date).age);
    assert.ok(validate({ ...fixture, age: '21' }, date).age);
    assert.ok(validate({ ...fixture, ageGroup: 'Child Youth (15 - 17 yrs old)' }, date).ageGroup);
  });
  test('automatic birthday values, phone normalization, structured address, siblings and OSY years', () => {
    const changed = changeAnswer(fixture, 'birthdate', '2001-09-30', date);
    assert.equal(changed.age, '25'); assert.equal(changed.ageGroup, groupForAge(25));
    assert.equal(changed.certification, '');
    assert.equal(changeAnswer(fixture, 'birthdate', 'invalid', date).age, '');
    assert.equal(normalizeMobile('0900 000 0000'), '+639000000000');
    assert.equal(normalizeMobile('9000000000'), '+639000000000');
    assert.ok(validate({ ...fixture, contactNumber: '+63900' }, date).contactNumber);
    assert.ok(validate({ ...fixture, locality: 'Another barangay' }, date).locality);
    assert.ok(validate({ ...fixture, siblings: JSON.stringify([{ name: 'Demo sibling', age: '' }]) }, date).siblings);
    assert.deepEqual(validate({ ...fixture, siblings: JSON.stringify([{ name: '', age: '' }]) }, date), {});
    assert.ok(validate({ ...fixture, isOsy: 'Yes', osyFrom: '2024', osyTo: '2019' }, date).osyTo);
    assert.ok(validate({ ...fixture, isOsy: 'Yes', osyFrom: '2019', osyTo: '2027' }, date).osyTo);
    assert.deepEqual(validate({ ...fixture, isOsy: 'Yes', osyFrom: '2019', osyTo: '2024' }, date), {});
    assert.equal(changeAnswer({ ...fixture, isOsy: 'Yes', osyFrom: '2019' }, 'isOsy', 'No').osyFrom, undefined);
  });
  test('all selection values are checked; hidden LGBTQIA+ details are removed', () => {
    for (const field of allFields.filter(field => field.options)) assert.ok(validate({ ...fixture, [field.id]: 'invalid' }, date)[field.id]);
    const answers = { ...fixture, gender: 'LGBTQIA+', lgbtqiaDetails: 'Synthetic detail' };
    assert.equal(visibleFields(allFields, answers).length, 33);
    const changed = changeAnswer(answers, 'gender', 'Female');
    assert.equal(changed.lgbtqiaDetails, undefined);
    assert.equal(visibleFields(allFields, changed).length, 32);
  });
} finally {
  await rm(directory, { recursive: true, force: true });
}
