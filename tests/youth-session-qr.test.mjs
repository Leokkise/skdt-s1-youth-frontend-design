import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import QRCode from 'qrcode';

async function moduleAt(file) {
  const source = await readFile(new URL(file, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
}
const { sessionPresentation } = await moduleAt('../src/auth/session-presentation.ts');
const { youthQrProfile, youthQrFields, youthQrText } = await moduleAt('../src/demo/youthQrPayload.ts');

test('background access check retains current layout but marks it blocked; terminal denial or identity result replaces it', () => {
  const state = { kind: 'signedIn', authUserId: 'synthetic-account-a', access: { accountStatus: 'active', roles: [], capabilities: [] } };
  const pending = sessionPresentation({ state, checking: false }, { kind: 'loading' });
  assert.equal(pending.state, state); assert.equal(pending.checking, true);
  for (const result of [{ kind: 'error' }, { kind: 'signedOut' }, { kind: 'signedIn', authUserId: 'synthetic-account-a', access: { accountStatus: 'suspended', roles: [], capabilities: [] } }, { ...state, authUserId: 'synthetic-account-b' }]) {
    assert.deepEqual(sessionPresentation(pending, result), { state: result, checking: false });
  }
  assert.deepEqual(sessionPresentation({ state: { kind: 'loading' }, checking: true }, { kind: 'loading' }), { state: { kind: 'loading' }, checking: true });
});

test('personalized synthetic QR includes exactly the requested basic fields and excludes private identifiers and household data', () => {
  const answers = { firstName: 'SYNTHETIC\nYOUTH', middleName: 'X', surname: 'DEMO', suffix: 'III', age: '20', ageGroup: 'Core Youth (18 - 24 yrs old)', locality: 'Talipapa, Quezon City', education: 'College Undergraduate', workStatus: 'Student', birthdate: 'SECRET_BIRTHDATE', contactNumber: 'SECRET_PHONE', rbiNumber: 'SECRET_RBI', houseNumber: 'SECRET_HOUSE', street: 'SECRET_STREET', headOfFamily: 'SECRET_FAMILY', siblings: 'SECRET_SIBLINGS', youthId: 'SECRET_YOUTH_ID', authUserId: 'SECRET_AUTH_ID', picture: 'SECRET_PICTURE', email: 'SECRET_EMAIL' };
  const profile = youthQrProfile(answers);
  assert.deepEqual(Object.keys(profile), ['name', 'age', 'ageGroup', 'barangay', 'education', 'workStatus']);
  assert.equal(profile.name, 'SYNTHETIC YOUTH X DEMO III');
  assert.equal(youthQrFields(profile).length, 6);
  const payload = youthQrText(profile);
  assert.match(payload, /Name: SYNTHETIC YOUTH X DEMO III/);
  assert.match(payload, /UNVERIFIED — NOT VALID FOR IDENTIFICATION OR EVENT CHECK-IN/);
  assert.ok(!payload.includes('SECRET_'));
  assert.ok(QRCode.create(payload, { errorCorrectionLevel: 'M' }).modules.size > 0);
  assert.ok(!youthQrText(youthQrProfile({})).includes('Alex Demo'));
});
