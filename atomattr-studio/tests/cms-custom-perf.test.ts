import test from 'node:test';
import assert from 'node:assert/strict';
import { makeContainer, makeEmbed, makeHeading, makePage, makeText } from '../src/document/factory';
import { buildGen, type Gen } from '../src/document/gen';
import { collectionRows, compareValues, resolveRepeatRows } from '../src/document/cms';
import { appendCsv, collectionFromCsv, collectionToCsv, collectionToJson } from '../src/document/cms-io';
import { parseCsv } from '../src/document/gen';
import { staticQuality } from '../src/document/quality';
import { analyzePerformance } from '../src/document/performance';
import { buildSiteFiles } from '../src/exporters/site';
import { generate } from '../src/exporters/codegen';
import { buildReactProjectZip } from '../src/exporters/react-project';
import { previewSafe } from '../src/exporters/custom-code';
import type { Collection, Project } from '../src/document/types';
import JSZip from 'jszip';

let n = 0; const uid = () => `id${++n}`;
const posts: Collection = {
  id: 'c1', name: 'Posts', slug: 'posts',
  fields: [{ id: 'f1', name: 'Title', key: 'title', type: 'text' }, { id: 'f2', name: 'Views', key: 'views', type: 'number' }, { id: 'f3', name: 'Date', key: 'date', type: 'date' }],
  items: [
    { id: 'i1', values: { title: 'Beta', views: '10', date: '2026-02-01' } },
    { id: 'i2', values: { title: 'Alpha', views: '9', date: '2026-03-01' } },
    { id: 'i3', values: { title: 'Gamma', views: '100', date: '2025-12-31' } },
    { id: 'i4', values: { title: 'Hidden', views: '1', date: '2026-01-01' }, draft: true },
  ],
};
const project = (pages = [makePage('Home', [])], extra: Partial<Project> = {}): Project => ({ version: 1, id: 'p', name: 'Site', kind: 'website', pages: pages as any, activePageId: pages[0].id, assets: [], components: [], colors: [], createdAt: 0, updatedAt: 0, ...extra });

test('collection rows: drafts hidden, numeric sort, date sort, filter, limit', () => {
  assert.deepEqual(collectionRows(posts).map(r => r.title), ['Beta', 'Alpha', 'Gamma']);
  assert.deepEqual(collectionRows(posts, { sortKey: 'views', sortDir: 'desc' }).map(r => r.title), ['Gamma', 'Beta', 'Alpha']);
  assert.deepEqual(collectionRows(posts, { sortKey: 'date', sortDir: 'asc' }).map(r => r.title), ['Gamma', 'Beta', 'Alpha']);
  assert.deepEqual(collectionRows(posts, { filterKey: 'views', filterOp: 'gt', filterValue: '9' }).map(r => r.title), ['Beta', 'Gamma']);
  assert.deepEqual(collectionRows(posts, { filterKey: 'title', filterOp: 'contains', filterValue: 'AM' }).map(r => r.title), ['Gamma']);
  assert.deepEqual(collectionRows(posts, { sortKey: 'title', limit: 2 }).map(r => r.title), ['Alpha', 'Beta']);
  assert.equal(collectionRows(posts, { sortKey: 'title' })[0]['item-number'], '1');
  assert.ok(compareValues('2', '10', 'number') < 0);
});

test('a repeater pointing at a deleted collection renders nothing, CSV repeaters still work', () => {
  assert.deepEqual(resolveRepeatRows({ csv: '', rows: [], collectionId: 'gone' }, [posts], parseCsv), []);
  assert.deepEqual(resolveRepeatRows({ csv: 'a\n1', rows: [] }, undefined, parseCsv), [{ a: '1' }]);
});

const listGen = (p: Project) => buildGen(p.pages[0].root, 'desktop', 'export', [], null, null, p);
const texts = (g: Gen): string[] => [g.text ?? '', ...g.children.flatMap(texts)].filter(Boolean);
const repeaterPage = (extra: Record<string, unknown> = {}) => {
  const list = makeContainer(0, 0, 400, 300); list.repeat = { csv: '', rows: [], collectionId: 'c1', sortKey: 'title', ...extra };
  list.children = [makeText(0, 0, '{{title}} · {{views}}', 16)];
  return makePage('Home', [list]);
};

test('repeater binds collection items into the generated tree', () => {
  const p = project([repeaterPage()], { collections: [posts] });
  assert.deepEqual(texts(listGen(p)), ['Alpha · 9', 'Beta · 10', 'Gamma · 100']);
  const limited = project([repeaterPage({ limit: 1, sortDir: 'desc' })], { collections: [posts] });
  assert.deepEqual(texts(listGen(limited)), ['Gamma · 100']);
});

test('CMS quality rules: unknown binding, missing and empty collection, stray binding', () => {
  const bad = repeaterPage(); (bad.root.children![0] as any).children = [makeText(0, 0, '{{nope}} {{title}}', 16)];
  let rules = staticQuality(project([bad], { collections: [posts] })).map(i => i.rule);
  assert.ok(rules.includes('cms-binding'));
  rules = staticQuality(project([repeaterPage()], { collections: [] })).map(i => i.rule);
  assert.ok(rules.includes('cms-missing'));
  rules = staticQuality(project([repeaterPage()], { collections: [{ ...posts, items: [] }] })).map(i => i.rule);
  assert.ok(rules.includes('cms-empty'));
  rules = staticQuality(project([makePage('Home', [makeHeading(0, 0, 'Hi {{title}}', 30)])])).map(i => i.rule);
  assert.ok(rules.includes('stray-binding'));
  assert.ok(!staticQuality(project([repeaterPage()], { collections: [posts] })).some(i => i.rule === 'cms-binding' || i.rule === 'stray-binding'));
});

test('CSV import guesses types, round-trips, appends by column name', () => {
  const csv = 'Title,Price,Published,Photo,Notes\n"Hello, world",10,true,https://x.com/a.png,hi\nSecond,2.5,false,https://x.com/b.jpg,\n';
  const c = collectionFromCsv(csv, 'Shop', { uid })!;
  assert.deepEqual(c.fields.map(f => [f.key, f.type]), [['title', 'text'], ['price', 'number'], ['published', 'bool'], ['photo', 'image'], ['notes', 'text']]);
  assert.equal(c.items.length, 2); assert.equal(c.items[0].values.title, 'Hello, world');
  assert.deepEqual(parseCsv(collectionToCsv(c)), parseCsv(csv));
  const r = appendCsv(c, 'title,price,zzz\nThird,7,x', uid);
  assert.equal(r.added, 1); assert.deepEqual(r.ignored, ['zzz']); assert.equal(r.collection.items[2].values.price, '7');
  assert.equal(JSON.parse(collectionToJson(c)).items.length, 2);
  assert.equal(collectionFromCsv('', 'X', { uid }), null);
});

const customProject = () => {
  const embed = makeEmbed('<div id="w">widget</div><!--/ast-embed--><script>alert(1)</script>');
  const home = makePage('Home', [makeHeading(0, 0, 'Hi', 40), embed]); home.custom = { css: '.x{color:red}', js: 'console.log("page")' };
  const about = makePage('About', [makeHeading(0, 0, 'About', 40)]);
  return project([home, about], { custom: { css: 'body{margin:0} </style><b>', js: 'console.log("site")', head: '<link rel="preconnect" href="https://f.example"><!--/ast-custom-head--><script>x()</script>' } });
};

test('site export includes custom CSS, JS and head HTML', () => {
  const files = new Map(buildSiteFiles(customProject()).map(f => [f.path, f.data] as const));
  const html = String(files.get('index.html')), css = String(files.get('css/index.css'));
  assert.match(css, /Custom CSS[\s\S]*body\{margin:0\}[\s\S]*\.x\{color:red\}/);
  assert.ok(!css.includes('</style>'), 'style terminator escaped');
  assert.match(html, /<link rel="preconnect" href="https:\/\/f\.example">/);
  assert.match(html, /<script src="js\/custom\.js" defer><\/script>/);
  assert.match(html, /<script src="js\/index\.js" defer><\/script>/);
  assert.match(String(files.get('js/custom.js')), /"site"/); assert.match(String(files.get('js/index.js')), /"page"/);
  assert.ok(!String(files.get('about.html')).includes('js/index.js'), 'page code only on its page');
  assert.match(String(files.get('about.html')), /js\/custom\.js/);
  assert.match(html, /<div id="w">widget<\/div>/, 'embed html is exported');
});

test('single HTML and React exports carry custom code', async () => {
  const p = customProject();
  const single = generate(p, 'HTML').code;
  assert.match(single, /body\{margin:0\}/); assert.match(single, /console\.log\("site"\)/); assert.match(single, /preconnect/);
  const zip = await JSZip.loadAsync(await buildReactProjectZip(p).arrayBuffer());
  assert.match(await zip.file('src/custom.css')!.async('string'), /body\{margin:0\}/);
  const js = await zip.file('src/custom.js')!.async('string'); assert.match(js, /"site"/); assert.match(js, /pathname === "\/"/);
  assert.match(await zip.file('src/main.jsx')!.async('string'), /import '\.\/custom\.css'[\s\S]*import '\.\/custom\.js'/);
  assert.match(await zip.file('index.html')!.async('string'), /preconnect/);
  assert.match(await zip.file('src/pages/Page1.jsx')!.async('string'), /dangerouslySetInnerHTML/);
});

test('previews never run custom JS or head HTML, and embeds are sandboxed even when they try to break out', () => {
  const files = new Map(buildSiteFiles(customProject()).map(f => [f.path, f.data] as const));
  const safe = previewSafe(String(files.get('index.html')));
  assert.ok(!safe.includes('preconnect') && !safe.includes('x()'), 'head html removed');
  assert.ok(!safe.includes('js/custom.js') && !safe.includes('js/index.js'), 'custom scripts removed');
  assert.match(safe, /<iframe sandbox="allow-scripts"/);
  assert.ok(!/allow-same-origin/.test(safe.match(/<iframe[^>]*>/)![0]));
  assert.ok(!safe.includes('alert(1)') || safe.indexOf('alert(1)') > safe.indexOf('srcdoc='), 'the injected script stays inside srcdoc');
  const outside = safe.replace(/<iframe[\s\S]*?<\/iframe>/g, '');
  assert.ok(!outside.includes('alert(1)') && !outside.includes('<script>alert'), 'nothing executable outside the sandbox');
});

test('performance report measures the export and flags problems', () => {
  const big = 'data:image/png;base64,' + 'A'.repeat(1_600_000);
  const img = { ...makeText(0, 0, '', 16), type: 'image' as const, assetId: 'a1', src: big, alt: 'x', name: 'Hero' };
  const p = project([makePage('Home', [makeHeading(0, 0, 'Hi', 40), img as any])], {
    assets: [{ id: 'a1', name: 'hero.png', mime: 'image/png', dataUrl: big, w: 4000, h: 3000 }, { id: 'a2', name: 'spare.png', mime: 'image/png', dataUrl: 'data:image/png;base64,AAAA' }],
    custom: { head: '<script src="https://cdn.example/a.js"></script>' },
  });
  const r = analyzePerformance(p);
  assert.ok(r.bytes.images > 1_100_000 && r.bytes.total > r.bytes.images);
  assert.equal(r.images.length, 1);
  const rules = r.issues.map(i => i.rule);
  for (const rule of ['perf-image-large', 'perf-image-format', 'perf-image-dimensions', 'perf-blocking-script', 'perf-external', 'perf-unused-assets']) assert.ok(rules.includes(rule), rule);
  assert.ok(r.score < 85 && r.estimate.slow3g > r.estimate.fast4g);
  const lean = analyzePerformance(project([makePage('Home', [makeHeading(0, 0, 'Hi', 40)])]));
  assert.equal(lean.score, 100); assert.equal(lean.grade, 'good'); assert.equal(lean.issues.length, 0);
});
