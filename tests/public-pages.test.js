import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseAttribute } from '../src/engine/parser.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('homepage gives direct paths to the product and demonstrates AtomAttr itself', () => {
  const home = read('../index.html');
  assert.match(home, /href="playground\.html"[\s\S]*?Try the Playground/);
  assert.match(home, /href="docs\.html"/);
  assert.match(home, /Get started/);
  assert.match(home, /bg="primary"[\s\S]*?hover-bg="blue-700"/);
  assert.doesNotMatch(home, /18,246|128\.7K|Review your payout/);
});

test('sponsorship pages describe real provider links without claiming a live payment flow', () => {
  const sponsors = read('../sponsors.html');
  const support = read('../support.html');
  assert.match(sponsors, /No sponsors listed yet/);
  assert.match(sponsors, /EXAMPLE · SPONSORED/);
  assert.match(sponsors, /form\.reportValidity\(\)/);
  assert.match(sponsors, /nothing has been sent or stored/);
  assert.match(sponsors, /clipboard\.writeText/);
  assert.match(support, /no verified payment destination configured|verified sponsor list|GitHub Sponsors/);
  for (const page of [sponsors, support]) {
    assert.match(page, /https:\/\/github\.com\/sponsors\/devadetayo|https:\/\/buymeacoffee\.com\/devadetayo|https:\/\/ko-fi\.com\/devadetayo/);
    assert.match(page, /dist\/defaults\.css/);
    assert.match(page, /data-site-nav/);
  }
});

test('shared navigation preserves guide and links to the real product routes', () => {
  const app = read('../site/app.js');
  for (const route of ['docs.html', 'playground.html', 'docs/cheatsheet.html', 'ui.html', 'premium.html', 'sponsors.html', 'support.html']) {
    assert.ok(app.includes(route), `navigation should retain ${route}`);
  }
  assert.match(app, /lg-display="flex"/);
  assert.match(app, /lg-display="none"/);
});

test('catalog exposes backed filters and loads a selected design through the existing share format', () => {
  const page = read('../catalog.html');
  const script = read('../catalog.js');
  assert.match(page, /id="category-select"/);
  assert.match(page, /id="sort-select"/);
  assert.match(script, /categorySelect\?\.addEventListener\('change'/);
  assert.match(script, /sortSelect\?\.addEventListener\('change'/);
  assert.match(script, /v: 2, l: 'html'/);
  assert.match(script, /#code=\$\{token\}/);
  assert.match(script, /slug: item\.slug, title: item\.name/);
  assert.match(script, /license: item\.license/);
  assert.match(script, /data-open-playground|Open in Playground/);
});

test('contribution draft is validated locally and never claims to be submitted', () => {
  const contribution = read('../contribute.html');
  assert.match(contribution, /form\.reportValidity\(\)/);
  assert.match(contribution, /allowedPreview/);
  assert.match(contribution, /allowedSource/);
  assert.match(contribution, /2 \* 1024 \* 1024/);
  assert.match(contribution, /local-draft-only/);
  assert.match(contribution, /has not been uploaded or submitted/);
  assert.match(contribution, /No review queue is connected/);
});

test('responsive attributes used by the public pages are supported by AtomAttr', () => {
  for (const [name, value] of [
    ['display', 'grid'], ['lg-grid-cols', '2'], ['sm-flex-row', 'row'],
    ['self', 'start'], ['border-color', 'gray-200'], ['dark-bg', 'gray-900'],
  ]) {
    assert.ok(parseAttribute(name, value), `${name}=${value} should parse`);
  }
});
