import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsHead, analyticsProblem } from '../src/document/analytics';
import { customHead, headBlock } from '../src/exporters/custom-code';

test('each provider validates its id', () => {
  assert.equal(analyticsProblem({ provider: 'plausible', id: 'example.com' }), ''); assert.ok(analyticsProblem({ provider: 'plausible', id: 'x"><script>' }));
  assert.equal(analyticsProblem({ provider: 'ga4', id: 'G-ABC123XYZ' }), ''); assert.ok(analyticsProblem({ provider: 'ga4', id: 'UA-1' }));
  assert.ok(analyticsProblem({ provider: 'umami', id: 'nope' })); assert.ok(analyticsProblem({ provider: 'custom', id: 'http://x.test' }));
  assert.equal(analyticsProblem({ provider: 'none', id: '' }), '');
});
test('invalid or off settings ship nothing', () => {
  assert.equal(analyticsHead(undefined), ''); assert.equal(analyticsHead({ provider: 'none', id: '' }), ''); assert.equal(analyticsHead({ provider: 'ga4', id: 'bad' }), '');
});
test('the snippet embeds the config safely and honours Do Not Track', () => {
  const h = analyticsHead({ provider: 'custom', id: 'https://x.test/collect?a=1&b=<2>' as any });
  assert.equal(h, '');
  const ok = analyticsHead({ provider: 'custom', id: 'https://x.test/collect', respectDnt: true });
  assert.ok(ok.includes('"dnt":true')); assert.ok(ok.includes('doNotTrack')); assert.ok(ok.includes('data-ast-event'));
  assert.ok(!analyticsHead({ provider: 'plausible', id: 'example.com', respectDnt: false }).includes('"dnt":true'));
});
test('analytics lands in the protected head block, so previews can strip it', () => {
  const project: any = { analytics: { provider: 'ga4', id: 'G-ABC123XYZ' }, custom: { head: '<meta name="x">' } };
  assert.ok(customHead(project).includes('googletagmanager')); assert.ok(headBlock(project).startsWith('<!--ast-custom-head-->'));
});
