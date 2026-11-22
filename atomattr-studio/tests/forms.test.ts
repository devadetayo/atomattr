import test from 'node:test';
import assert from 'node:assert/strict';
import { detectProvider, formAttrs, formProblem } from '../src/document/forms';

test('each provider writes plain form attributes and round-trips', () => {
  for (const [p, v] of [['formspree', 'abc123'], ['netlify', 'contact'], ['mailto', 'a@b.co'], ['custom', 'https://x.test/api']] as const) {
    const a = formAttrs({ id: 'keep' }, p, v); const d = detectProvider(a);
    assert.equal(d.provider, p); assert.equal(d.value, v); assert.equal(a.id, 'keep');
  }
});
test('switching provider clears what the old one wrote', () => {
  const a = formAttrs(formAttrs({}, 'mailto', 'a@b.co'), 'netlify', 'lead');
  assert.equal(a.action, undefined); assert.equal(a.enctype, undefined); assert.equal(a['data-netlify'], 'true');
  assert.deepEqual(formAttrs(a, 'none', ''), {});
});
test('problems are explained', () => {
  assert.match(formProblem('mailto', 'nope'), /valid email/); assert.match(formProblem('custom', 'ftp://x'), /https/);
  assert.match(formProblem('custom', 'http://x.test'), /blocked/); assert.equal(formProblem('formspree', 'abc'), '');
});
