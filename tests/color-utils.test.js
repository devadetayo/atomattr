import test from 'node:test';
import assert from 'node:assert/strict';
import { hexToOklch, oklchToHex, mixOklch } from '../src/style-data/color-utils.js';

test('oklch round-trip conversions', () => {
  const hex = '#3b82f6'; // blue-500
  const o = hexToOklch(hex);
  assert.ok(typeof o.L === 'number');
  assert.ok(typeof o.C === 'number');
  assert.ok(typeof o.h === 'number');

  const back = oklchToHex(o.L, o.C, o.h);
  assert.match(back, /^#[0-9a-f]{6}$/i);
});

test('mixing two colors returns a hex', () => {
  const a = '#3b82f6';
  const b = '#ffffff';
  const mixed = mixOklch(a, b, 20);
  assert.match(mixed, /^#[0-9a-f]{6}$/i);
});
