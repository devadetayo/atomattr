import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogItems } from '../data/catalog-data.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('AtomAttr UI landing page and free gallery have explicit public routes', () => {
  const home = read('../ui.html');
  const gallery = read('../catalog.html');
  assert.match(home, /href="\.\/catalog\.html"[^>]*>[\s\S]*?Browse catalog/);
  assert.match(home, /href="\.\/playground\.html"/);
  assert.match(gallery, /Published free patterns/);
  assert.match(gallery, /id="category-select"/);
  assert.match(gallery, /id="sort-select"/);
  assert.match(gallery, /id="search-input"/);
  assert.match(gallery, /href="\.\/contribute\.html"/);
});

test('published free designs have stable detail routes and honest creator and license metadata', () => {
  assert.ok(catalogItems.length > 0);
  for (const item of catalogItems) {
    assert.ok(item.slug);
    assert.ok(item.preview);
    assert.equal(item.access, 'free');
    assert.ok(item.creator);
    assert.ok(item.license);
    assert.equal(item.publicationStatus, 'published');
  }
  const detail = read('../catalog.js');
  assert.match(detail, /item\.html\?slug=/);
  assert.match(detail, /Creator:/);
  assert.match(detail, /License:/);
  assert.match(detail, /Open in Playground/);
  assert.match(detail, /v: 2, l: 'html', h: code, c: css/);
});

test('Playground integration keeps existing share route and treats malformed links as an error state', () => {
  const playground = read('../playground.html');
  assert.match(playground, /#code=<z\|b>/);
  assert.match(playground, /decodeShare\(hashMatch\[1\]\)/);
  assert.match(playground, /This share link could not be opened/);
  assert.match(playground, /Restore mine/);
});

test('contribution route validates a license and keeps drafts local instead of claiming moderation submission', () => {
  const page = read('../contribute.html');
  assert.match(page, /name="license" required/);
  assert.match(page, /form\.reportValidity\(\)/);
  assert.match(page, /2 \* 1024 \* 1024/);
  assert.match(page, /local-draft-only/);
  assert.match(page, /has not been uploaded or submitted/);
  assert.match(page, /localStorage\.setItem/);
  assert.match(page, /Download draft JSON/);
});

test('community drafts can be edited, deleted, restored, exported, and previewed in the playground', () => {
  const page = read('../contribute.html');
  assert.match(page, /Edit draft/);
  assert.match(page, /Delete/);
  assert.match(page, /Restore a downloaded draft/);
  assert.match(page, /schemaVersion !== 1/);
  assert.match(page, /Open preview in Playground/);
  assert.match(page, /v: 2, l: 'html', h: draft\.preview, c: ''/);
  assert.match(page, /Download JSON/);
});

test('shared site navigation connects the library and contribution routes', () => {
  const app = read('../site/app.js');
  for (const route of ['ui.html', 'components.html', 'sections.html', 'templates.html', 'contribute.html', 'premium.html']) {
    assert.ok(app.includes(route), `shared navigation should include ${route}`);
  }
  const config = read('../vite.config.js');
  assert.match(config, /readdirSync\('\.'/);
  assert.match(config, /endsWith\('\.html'\)/);
});
