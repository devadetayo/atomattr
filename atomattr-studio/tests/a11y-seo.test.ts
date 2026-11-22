import test from 'node:test';
import assert from 'node:assert/strict';
import { makeButton, makeHeading, makeImage, makePage, makeSection, makeText } from '../src/document/factory';
import { seoQuality, staticQuality } from '../src/document/quality';
import { langOf, langValid } from '../src/document/lang';
import type { Project } from '../src/document/types';

const project = (pages = [makePage('Home', [])], extra: Partial<Project> = {}): Project => ({
  version: 1, id: 'p', name: 'Site', kind: 'website', pages: pages.map(p => ({ ...p })) as any, activePageId: pages[0].id,
  assets: [], components: [], colors: [], createdAt: 0, updatedAt: 0, ...extra,
});
const rules = (p: Project) => staticQuality(p).map(i => i.rule);

test('aria-label gives an icon button its name; a link with no name is an error', () => {
  const named = makeButton(0, 0, ''); named.text = ''; named.attrs = { 'aria-label': 'Close' };
  const bare = makeButton(0, 0, ''); bare.text = '';
  const link = makeButton(0, 0, ''); link.text = ''; link.href = 'https://example.com';
  const r = rules(project([makePage('Home', [named, bare, link])]));
  assert.equal(r.filter(x => x === 'empty-button').length, 2); // bare + the link-shaped button without a name
  assert.ok(!staticQuality(project([makePage('Home', [named])])).some(i => i.id === named.id && i.rule === 'empty-button'));
});

test('ARIA and focus rules', () => {
  const a = makeText(0, 0, 'a'); a.attrs = { id: 'x' };
  const b = makeText(0, 0, 'b'); b.attrs = { id: 'x', role: 'bogus', tabindex: '3' };
  const c = makeButton(0, 0, 'Hi'); c.attrs = { 'aria-hidden': 'true' };
  const d = makeButton(0, 0, 'Out'); d.href = 'https://x.com'; d.attrs = { target: '_blank' };
  const r = rules(project([makePage('Home', [a, b, c, d])]));
  for (const rule of ['duplicate-id', 'aria-role', 'tabindex-positive', 'aria-hidden-focusable', 'target-blank']) assert.ok(r.includes(rule), rule);
});

test('alt text quality', () => {
  const i1 = makeImage(0, 0, 10, 10, 'x', undefined, 'IMG_2041.jpg');
  const i2 = makeImage(0, 0, 10, 10, 'x', undefined, 'Image of a dog');
  const i3 = makeImage(0, 0, 10, 10, 'x', undefined, 'A dog catching a ball');
  const r = rules(project([makePage('Home', [i1, i2, i3])]));
  assert.equal(r.filter(x => x === 'alt-filename').length, 1); assert.equal(r.filter(x => x === 'alt-redundant').length, 1);
});

test('a second main landmark is flagged', () => {
  const s = makeSection('Content', 100); s.tag = 'main';
  assert.ok(rules(project([makePage('Home', [s])])).includes('nested-main'));
});

test('language: validation, fallback, and the SEO nudge', () => {
  assert.ok(langValid('en') && langValid('pt-BR') && langValid('zh-Hans-CN') && !langValid('english please') && !langValid(''));
  assert.equal(langOf({ site: { lang: 'fr' } } as any), 'fr'); assert.equal(langOf({} as any), 'en'); assert.equal(langOf({ site: { lang: '!!' } } as any), 'en');
  assert.ok(seoQuality(project()).some(i => i.rule === 'seo-lang'));
  assert.ok(!seoQuality(project(undefined, { site: { lang: 'fr' } })).some(i => i.rule === 'seo-lang'));
});

test('SEO: thin content, long H1, bad slug', () => {
  const h = makeHeading(0, 0, 'x'.repeat(90)); h.tag = 'h1';
  const pg = makePage('Home', [h, makeText(0, 0, 'short')]); (pg as any).slug = 'About Us';
  const r = seoQuality(project([pg])).map(i => i.rule);
  for (const rule of ['seo-thin', 'seo-h1-long', 'seo-slug']) assert.ok(r.includes(rule), rule);
});
