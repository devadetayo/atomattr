import test from 'node:test';
import assert from 'node:assert/strict';
import { googleHref, fontHead, fontFaceCss, formatOf, FAMILY_OK } from '../src/document/fonts';

test('googleHref builds one sorted stylesheet for all Google families', () => {
  const h = googleHref([{ id: '1', family: 'Space Grotesk', kind: 'google', weights: [700, 400] }, { id: '2', family: 'Lora', kind: 'google', weights: [400], italic: true }]);
  assert.equal(h, 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Lora:ital,wght@0,400;1,400&display=swap');
});
test('fontHead covers links and embedded files, and ignores non-https links', () => {
  const head = fontHead({ webFonts: [
    { id: '1', family: 'Inter', kind: 'google' },
    { id: '2', family: 'Bunny', kind: 'css', url: 'https://fonts.bunny.net/css?family=abel' },
    { id: '3', family: 'Bad', kind: 'css', url: 'javascript:alert(1)' },
    { id: '4', family: 'Mine', kind: 'file', dataUrl: 'data:font/woff2;base64,AAAA', format: 'woff2', weights: [500] },
  ] });
  assert.match(head, /rel="preconnect" href="https:\/\/fonts\.gstatic\.com"/);
  assert.match(head, /css2\?family=Inter:wght@400;700/);
  assert.match(head, /fonts\.bunny\.net/); assert.doesNotMatch(head, /javascript:/);
  assert.match(head, /@font-face\{font-family:"Mine";src:url\(data:font\/woff2;base64,AAAA\) format\("woff2"\);font-weight:500/);
  assert.equal(fontHead({}), '');
});
test('names and formats are validated', () => {
  assert.ok(FAMILY_OK.test('DM Serif Display')); assert.ok(!FAMILY_OK.test('x";}body{'));
  assert.equal(formatOf('A.TTF'), 'truetype'); assert.equal(formatOf('a.exe'), null);
  assert.equal(fontFaceCss({ id: 'x', family: 'A', kind: 'file', dataUrl: 'https://evil/x.woff' }), '');
});
