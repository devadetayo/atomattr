import test from 'node:test';
import assert from 'node:assert/strict';
import { makeButton, makeForm, makeHeading, makeInput, makePage, makeSection, makeText } from '../src/document/factory';
import { projectQuality, seoQuality, staticQuality } from '../src/document/quality';
import type { Project } from '../src/document/types';

const project = (pages = [makePage('Home', [])], extra: Partial<Project> = {}): Project => ({
  version: 1, id: 'p', name: 'Site', kind: 'website', pages: pages.map(p => ({ ...p })) as any, activePageId: pages[0].id,
  assets: [], components: [], colors: [], createdAt: 0, updatedAt: 0, ...extra,
});
const rules = (p: Project) => staticQuality(p).map(i => i.rule);

test('link checks: empty, javascript:, http://, scheme-less and missing anchors', () => {
  const target = makeSection('About', 100); target.id = 'about';
  const ok = makeButton(0, 0, 'Go'); ok.href = '#about';
  const missing = makeButton(0, 0, 'Go'); missing.href = '#nowhere';
  const empty = makeButton(0, 0, 'Go'); empty.href = '  ';
  const js = makeButton(0, 0, 'Go'); js.href = 'javascript:alert(1)';
  const http = makeButton(0, 0, 'Go'); http.href = 'http://example.com';
  const bare = makeButton(0, 0, 'Go'); bare.href = 'example.com';
  const fine = makeButton(0, 0, 'Go'); fine.href = 'https://example.com/a';
  const r = rules(project([makePage('Home', [target, ok, missing, empty, js, http, bare, fine])]));
  for (const rule of ['anchor-link', 'empty-link', 'unsafe-link', 'insecure-link', 'link-format']) assert.ok(r.includes(rule), rule);
  assert.equal(r.filter(x => x === 'anchor-link').length, 1);
  assert.equal(r.filter(x => x === 'link-format').length, 1);
});

test('anchor targets may also come from an id attribute', () => {
  const t = makeSection('X', 50); t.attrs = { id: 'pricing' };
  const l = makeButton(0, 0, 'Go'); l.href = '#pricing';
  assert.ok(!rules(project([makePage('Home', [t, l])])).includes('anchor-link'));
});

test('generic link text, unlabeled inputs, forms without submit or action', () => {
  const link = makeText(0, 0, 'click here', 16); link.href = 'https://example.com';
  const input = makeInput('text', 'name', ''); input.field!.placeholder = '';
  const unnamed = makeInput('text', 'x', 'X'); unnamed.field!.name = '';
  const form = makeForm('Contact', [makeInput('text', 'a', 'A')]);
  const r = rules(project([makePage('Home', [link, input, unnamed, form])]));
  for (const rule of ['link-text', 'input-label', 'input-name', 'form-submit', 'form-action']) assert.ok(r.includes(rule), rule);
  const good = makeForm('Good', [makeInput('text', 'a', 'A'), makeButton(0, 0, 'Send')]); good.attrs = { action: 'https://f.example/x' };
  const r2 = rules(project([makePage('Home', [good])]));
  assert.ok(!r2.includes('form-submit') && !r2.includes('form-action'));
});

test('large embedded images are flagged', () => {
  const img = { ...makeText(0, 0, '', 16), type: 'image' as const, assetId: 'a1', alt: 'x' };
  const big = 'data:image/png;base64,' + 'A'.repeat(800_000);
  const p = project([makePage('Home', [img as any])], { assets: [{ id: 'a1', name: 'a', mime: 'image/png', dataUrl: big }] });
  assert.ok(rules(p).includes('large-image'));
});

test('SEO checks: missing, length, duplicates, social image, site url', () => {
  const a = makePage('Home', []), b = makePage('About', []);
  const p = project([a, b]);
  let r = seoQuality(p).map(i => i.rule);
  for (const rule of ['seo-title', 'seo-description', 'seo-social-image', 'seo-base-url']) assert.ok(r.includes(rule), rule);
  const seo = { title: 'A perfectly fine page title', description: 'x'.repeat(100), socialImage: 'https://i.example/x.png' };
  a.seo = { ...seo }; b.seo = { ...seo };
  const p2 = project([a, b], { site: { baseUrl: 'https://example.com' } });
  r = seoQuality(p2).map(i => i.rule);
  assert.ok(r.includes('seo-duplicate-title') && r.includes('seo-duplicate-description'));
  assert.ok(!r.includes('seo-base-url') && !r.includes('seo-social-image') && !r.includes('seo-title'));
  b.seo = { title: 'Short', description: 'y'.repeat(200) };
  r = seoQuality(project([a, b])).map(i => i.rule);
  assert.ok(r.includes('seo-title-length') && r.includes('seo-description-length'));
});

test('projectQuality covers every page and tags issues with the page id', () => {
  const l = makeButton(0, 0, 'Go'); l.href = '#nope';
  const h = makeHeading(0, 0, 'Hi', 32);
  const home = makePage('Home', [h]), other = makePage('Other', [l]);
  const issues = projectQuality(project([home, other]));
  const anchor = issues.find(i => i.rule === 'anchor-link')!;
  assert.equal(anchor.pageId, other.id);
  assert.match(anchor.message, /^Other · /);
});
