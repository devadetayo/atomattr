import test from 'node:test';
import assert from 'node:assert/strict';
import { itemFile, itemRow, itemSlugs, collectionRows } from '../src/document/cms';
import { buildSiteFiles, siteOutputs, pageFiles } from '../src/exporters/site';
import { staticQuality } from '../src/document/quality';
import { makeHeading, makePage, makeSection, makeText, makeButton } from '../src/document/factory';
import type { Collection, Project } from '../src/document/types';

const blog = (): Collection => ({ id: 'c1', name: 'Blog', slug: 'blog', fields: [{ id: 'f1', name: 'Title', key: 'title', type: 'text' }, { id: 'f2', name: 'Body', key: 'body', type: 'longtext' }],
  items: [{ id: 'a', values: { title: 'Hello World', body: 'First post.' } }, { id: 'b', values: { title: 'Hello World', body: 'Same title.' } }, { id: 'd', values: { title: 'Draft one', body: 'x' }, draft: true }, { id: 'e', values: { title: 'Third!', body: 'Last.' } }] });
const base = (): Project => {
  const home = makePage('Home'); const tpl = makeSection('Item', 400); tpl.children = [makeHeading(0, 0, '{{title}}', 40), makeText(0, 0, '{{body}}', 18)];
  const item = { ...makePage('Blog item page', [tpl]), templateOf: 'c1' };
  const list = makeButton(0, 0, 'Read'); list.href = '{{item-url}}';
  return { id: 'p', name: 'Site', kind: 'site', pages: [home, item], activePageId: home.id, assets: [], collections: [blog()] } as unknown as Project;
};

test('item slugs are unique even when two items share a title', () => { const s = itemSlugs(blog()); assert.deepEqual([...s.values()], ['hello-world', 'hello-world-2', 'draft-one', 'third']); });
test('item rows carry the slug and the file the page will have', () => { const c = blog(); const r = itemRow(c, c.items[0], 0); assert.equal(r['item-slug'], 'hello-world'); assert.equal(r['item-url'], 'blog-hello-world.html'); assert.equal(itemFile(c, 'x'), 'blog-x.html'); });
test('collection rows expose item-url, drafts excluded', () => { const rows = collectionRows(blog()); assert.equal(rows.length, 3); assert.equal(rows[1]['item-url'], 'blog-hello-world-2.html'); });
test('the export writes one page per published item and none for the template or drafts', () => {
  const p = base(); const files = buildSiteFiles(p).map(f => f.path);
  for (const f of ['index.html', 'blog-hello-world.html', 'blog-hello-world-2.html', 'blog-third.html']) assert.ok(files.includes(f), f);
  assert.ok(!files.includes('blog-draft-one.html')); assert.ok(!files.some(f => /blog-item-page/.test(f)), 'template page is not exported as itself');
});
test('each item page carries its own content, title and styles', () => {
  const files = buildSiteFiles(base()); const get = (n: string) => String(files.find(f => f.path === n)!.data);
  const a = get('blog-hello-world.html'), b = get('blog-hello-world-2.html');
  assert.match(a, /First post\./); assert.doesNotMatch(a, /\{\{/); assert.match(b, /Same title\./); assert.match(a, /<title>Hello World/);
  assert.ok(files.some(f => f.path === 'css/blog-hello-world.css'));
});
test('a template for a deleted collection exports nothing and is flagged', () => {
  const p = base(); p.collections = []; assert.equal(siteOutputs(p, pageFiles(p)).length, 1);
  const q = staticQuality(p, p.pages[1].id); assert.ok(q.some(i => i.rule === 'cms-missing'));
});
test('quality: bindings are fine on an item page, unknown ones are flagged', () => {
  const p = base(); assert.ok(!staticQuality(p, p.pages[1].id).some(i => i.rule === 'stray-binding'));
  (p.pages[1].root.children![0] as any).text = '{{nope}}'; assert.ok(staticQuality(p, p.pages[1].id).some(i => i.rule === 'cms-binding'));
});

test('quality: {{item-url}} in a list needs an item page', () => {
  const p = base(); const card = makeSection('Card', 100); const link = makeButton(0, 0, 'Read'); link.href = '{{item-url}}'; card.children = [link];
  const rep = makeSection('List', 200); rep.repeat = { csv: '', rows: [], collectionId: 'c1' } as any; rep.children = [card];
  p.pages[0].root.children = [rep];
  assert.ok(!staticQuality(p, p.pages[0].id).some(i => i.rule === 'cms-no-item-page'));
  p.pages = p.pages.filter(x => !x.templateOf); assert.ok(staticQuality(p, p.pages[0].id).some(i => i.rule === 'cms-no-item-page'));
});
