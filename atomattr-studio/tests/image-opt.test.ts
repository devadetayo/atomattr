import test from 'node:test';
import assert from 'node:assert/strict';
import { canOptimize, dataUrlBytes, extFor, fitWithin, keepOriginal, pickFormat, renameForMime, formatBytes } from '../src/document/image-opt';

test('fitWithin scales the long edge only when over the limit', () => {
  assert.deepEqual(fitWithin(1000, 500, 2400), { w: 1000, h: 500, scaled: false });
  assert.deepEqual(fitWithin(4800, 2400, 2400), { w: 2400, h: 1200, scaled: true });
  assert.deepEqual(fitWithin(2000, 6000, 2400), { w: 800, h: 2400, scaled: true });
  assert.equal(fitWithin(0, 0).scaled, false);
});
test('format choice: WebP when supported, else PNG for alpha and JPEG for opaque', () => {
  assert.equal(pickFormat({ hasAlpha: true, webp: true }), 'image/webp');
  assert.equal(pickFormat({ hasAlpha: true, webp: false }), 'image/png');
  assert.equal(pickFormat({ hasAlpha: false, webp: false }), 'image/jpeg');
});
test('never touch SVG or GIF', () => {
  for (const m of ['image/svg+xml', 'image/gif', 'image/avif']) assert.equal(canOptimize(m), false, m);
  for (const m of ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']) assert.equal(canOptimize(m), true, m);
});
test('keep the original unless the saving is real', () => {
  assert.equal(keepOriginal(100, 99, false), true);
  assert.equal(keepOriginal(100, 90, false), false);
  assert.equal(keepOriginal(100, 120, true), true);
  assert.equal(keepOriginal(100, 98, true), false);
});
test('bytes and naming helpers', () => {
  assert.equal(dataUrlBytes('data:image/png;base64,AAAA'), 3);
  assert.equal(dataUrlBytes('data:image/svg+xml,%3Csvg%3E'), 9);
  assert.equal(extFor('image/jpeg'), 'jpg');
  assert.equal(renameForMime('Hero Photo.PNG', 'image/webp'), 'Hero Photo.webp');
  assert.equal(formatBytes(2_621_440), '2.5 MB');
});
