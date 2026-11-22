import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ToolIcon } from '../src/components/ToolIcons';
import { normalizeMovePatch, normalizeTextResizePatch } from '../src/canvas/Canvas';
import { makeButton, makeContainer, makeHeading, makeInput, makePage, makeSection, makeText, newProject } from '../src/document/factory';
import { find, pathTo } from '../src/document/tree';
import { getFlowReorderTarget, getSlotTarget, groupNodes, moveNode } from '../src/document/ops';
import { generate, assetNamesFor } from '../src/exporters/codegen';
import { attrsFor } from '../src/document/attrs';
import { defaultPositionMode, isAbs, patchStyle } from '../src/document/style';
import * as S from '../src/state/store';

const makeProject = () => {
  const hero = makeSection('Hero', 480);
  const features = makeSection('Features', 420);
  const footer = makeSection('Footer', 220);
  const page = makePage('Home', [hero, features, footer]);
  return { page, hero, features, footer };
};

test('tool icons render with fixed dimensions so they do not squash in flex layouts', () => {
  const markup = renderToStaticMarkup(createElement(ToolIcon, { n: 'plus', size: 20 }));

  assert.match(markup, /width="20"/);
  assert.match(markup, /height="20"/);
  assert.match(markup, /flex-shrink:0/);
  assert.match(markup, /display:block/);
});

test('reorders siblings in the target parent without an off-by-one drift', () => {
  const { page, hero, features, footer } = makeProject();
  const moved = moveNode(page.root, hero.id, page.root.id, 2);
  const ids = (moved.children ?? []).map((node) => node.id);

  assert.deepEqual(ids, [features.id, footer.id, hero.id]);
  assert.equal(pathTo(moved, hero.id)?.length, 2);
});

test('moves a node into a real child container while preserving descendants', () => {
  const page = makePage('Home', [makeSection('Overview', 400)]);
  const parent = makeSection('Parent', 300);
  const child = makeText(0, 0, 'Nested content', 18);
  child.id = 'nested-text';
  parent.children = [child];
  page.root.children = [parent];

  const next = moveNode(page.root, parent.id, page.root.id, 0);
  assert.ok(next.children?.some((node) => node.id === parent.id));
  assert.equal(find(next, 'nested-text')?.text, 'Nested content');
});

test('moves a node between parents and preserves sibling ordering', () => {
  const page = makePage('Home', [makeSection('A', 200), makeSection('B', 200)]);
  const a = page.root.children![0];
  const b = page.root.children![1];
  const target = makeText(0, 0, 'Moved child', 18);
  target.id = 'moved-child';
  a.children = [target];

  const next = moveNode(page.root, target.id, b.id, 0);
  const moved = find(next, target.id)!;
  const movedParent = find(next, b.id)!;

  assert.equal(movedParent.children?.[0]?.id, target.id);
  assert.equal(pathTo(next, target.id)?.[0]?.id, page.root.id);
  assert.equal(pathTo(next, target.id)?.[1]?.id, b.id);
});

test('text nodes keep auto height and do not emit fixed height attributes by default', () => {
  const text = makeText(20, 30, 'Hello world', 18);
  const attrs = attrsFor(text, { parent: null, parentResolved: null, chain: [text], bp: 'desktop' });
  assert.equal(attrs.w, 'fit-content');
  assert.equal(attrs.h, undefined);
  assert.equal(attrs['max-w'], '100%');
});

test('dragging a hug text node preserves auto sizing while increasing font size', () => {
  const text = makeText(20, 30, 'Hello world', 18);
  const next = normalizeTextResizePatch(text, { fontSize: 32 });
  assert.equal(next.w, 'auto');
  assert.equal(next.h, 'auto');
  assert.equal(next.fontSize, 32);
});

test('absolute drag moves clear stale left/top values so the item sticks to the new position', () => {
  const box = makeContainer(0, 0, 200, 120);
  box.style.position = 'absolute';
  box.style.left = 40;
  box.style.top = 60;
  box.style.mode = 'abs';

  const next = normalizeMovePatch(box, { x: 120, y: 90 });
  assert.equal(next.x, 120);
  assert.equal(next.y, 90);
  assert.equal(next.left, undefined);
  assert.equal(next.top, undefined);
  assert.equal(next.position, 'absolute');
  assert.equal(next.mode, 'abs');
});

test('explicit auto height survives a move into a freeform parent', () => {
  const page = makePage('Home', [makeSection('Hero', 200)]);
  const card = makeContainer(0, 0, 200, 120);
  card.style.h = 'auto';
  page.root.children = [card];

  const next = moveNode(page.root, card.id, page.root.id, 0);
  assert.equal(next.children?.[0]?.style.h, 'auto');
});

test('position mode defaults to relative unless the style explicitly overrides it', () => {
  assert.equal(defaultPositionMode({}), 'relative');
  assert.equal(defaultPositionMode({ position: 'absolute' }), 'absolute');
  assert.equal(defaultPositionMode({ position: 'relative' }), 'relative');
});

test('x/y edits clear stale edge offsets so positioning does not snap back to the start', () => {
  const box = makeContainer(0, 0, 240, 180);
  box.style.position = 'absolute';
  box.style.left = 20;
  box.style.top = 32;

  const next = patchStyle(box, { x: 120, y: 90 }, 'desktop');

  assert.equal(next.style.x, 120);
  assert.equal(next.style.y, 90);
  assert.equal(next.style.left, undefined);
  assert.equal(next.style.top, undefined);
  assert.equal(next.style.right, undefined);
  assert.equal(next.style.bottom, undefined);
  assert.equal(next.style.inset, undefined);
});

test('position mode and x/y stay in sync with the actual absolute-vs-relative behavior', () => {
  const abs = { ...makeContainer(0, 0, 240, 180), style: { ...makeContainer(0, 0, 240, 180).style, position: 'absolute', mode: 'abs', x: 50, y: 70 } };
  const rel = { ...makeContainer(0, 0, 240, 180), style: { ...makeContainer(0, 0, 240, 180).style, position: 'relative', mode: 'flow' } };

  assert.equal(isAbs(abs, 'free', false), true);
  assert.equal(isAbs(rel, 'free', false), false);

  const next = patchStyle(rel, { position: 'absolute', x: 120, y: 90 }, 'desktop');
  assert.equal(next.style.position, 'absolute');
  assert.equal(next.style.mode, 'abs');
  assert.equal(next.style.x, 120);
  assert.equal(next.style.y, 90);
});

test('page height state expands when the content runs past the visible artboard', () => {
  const project = newProject('Overflow test', 'page', 'blank');
  const tall = makeSection('Tall section', 1800);
  project.pages[0].root.children = [tall];
  project.pages[0].height = 900;
  project.pages[0].root.style.h = 900;
  S.openProject(project);

  assert.ok(S.getState().pageH >= 1800);
  assert.ok(S.pageHeightFor(S.page()) >= 1800);
});

test('directional margin attrs export for text nodes in the properties panel', () => {
  const text = makeText(20, 30, 'Hello world', 18);
  text.style.marginT = 12;
  text.style.marginR = 16;
  text.style.marginB = 20;
  text.style.marginL = 24;

  const attrs = attrsFor(text, { parent: null, parentResolved: null, chain: [text], bp: 'desktop' });
  assert.equal(attrs.mt, '12px');
  assert.equal(attrs.mr, '16px');
  assert.equal(attrs.mb, '20px');
  assert.equal(attrs.ml, '24px');
});

test('grouping preserves the original document order instead of selection order', () => {
  const page = makePage('Home');
  const a = makeContainer(0, 0, 120, 80); a.style.mode = 'abs';
  const b = makeContainer(140, 0, 120, 80); b.style.mode = 'abs';
  const c = makeContainer(280, 0, 120, 80); c.style.mode = 'abs';
  page.root.children = [a, b, c];

  const ids = [c.id, a.id, b.id];
  const grouped = groupNodes(page.root, ids);
  const group = find(grouped.root, grouped.groupId!);

  assert.ok(group);
  assert.deepEqual((group!.children ?? []).map((node) => Number(node.style.x)), [0, 140, 280]);
});

test('text, input, and button nodes retain explicit display and padding in the exported box model', () => {
  const text = makeText(20, 30, 'Hello world', 18);
  text.style.display = 'inline-flex';
  text.style.pad = 12;

  const input = makeInput('text', 'email', 'you@example.com');
  input.style.display = 'inline-flex';
  input.style.pad = 10;

  const btn = makeButton(12, 18, 'Save');
  btn.style.display = 'inline-flex';
  btn.style.pad = 8;

  const textAttrs = attrsFor(text, { parent: null, parentResolved: null, chain: [text], bp: 'desktop' });
  const inputAttrs = attrsFor(input, { parent: null, parentResolved: null, chain: [input], bp: 'desktop' });
  const btnAttrs = attrsFor(btn, { parent: null, parentResolved: null, chain: [btn], bp: 'desktop' });

  assert.equal(textAttrs.display, 'inline-flex');
  assert.equal(textAttrs.p, '12px');
  assert.equal(inputAttrs.display, 'inline-flex');
  assert.equal(inputAttrs.p, '10px');
  assert.equal(btnAttrs.display, 'inline-flex');
  assert.equal(btnAttrs.p, '8px');
});

test('button padding exports directional values in the box model', () => {
  const btn = makeButton(12, 18, 'Save');
  btn.style.padT = 8;
  btn.style.padR = 12;
  btn.style.padB = 8;
  btn.style.padL = 12;

  const attrs = attrsFor(btn, { parent: null, parentResolved: null, chain: [btn], bp: 'desktop' });
  assert.equal(attrs.pt, '8px');
  assert.equal(attrs.pr, '12px');
  assert.equal(attrs.pb, '8px');
  assert.equal(attrs.pl, '12px');
});

test('directional padding wins over stale shorthand values when exporting box model styles', () => {
  const container = makeContainer(20, 30, 220, 150, 'Card');
  container.style.pad = 16;
  container.style.padX = 12;
  container.style.padY = 20;
  container.style.padT = 8;
  container.style.padR = 10;
  container.style.padB = 12;
  container.style.padL = 14;

  const attrs = attrsFor(container, { parent: null, parentResolved: null, chain: [container], bp: 'desktop' });
  assert.equal(attrs.p, undefined);
  assert.equal(attrs.px, undefined);
  assert.equal(attrs.py, undefined);
  assert.equal(attrs.pt, '8px');
  assert.equal(attrs.pr, '10px');
  assert.equal(attrs.pb, '12px');
  assert.equal(attrs.pl, '14px');
});

test('new containers default to directional padding so the properties editor edits the real box model', () => {
  const box = makeContainer(0, 0, 240, 180);
  assert.equal(box.style.pad, undefined);
  assert.equal(box.style.padT, 24);
  assert.equal(box.style.padR, 24);
  assert.equal(box.style.padB, 24);
  assert.equal(box.style.padL, 24);

  const attrs = attrsFor(box, { parent: null, parentResolved: null, chain: [box], bp: 'desktop' });
  assert.equal(attrs.pt, '24px');
  assert.equal(attrs.pr, '24px');
  assert.equal(attrs.pb, '24px');
  assert.equal(attrs.pl, '24px');
});

test('intrinsic sizing keywords are preserved as CSS values', () => {
  const box = makeSection('Box', 240);
  box.style.w = 'fit-content';
  box.style.h = 'max-content';
  const attrs = attrsFor(box, { parent: null, parentResolved: null, chain: [box], bp: 'desktop' });
  assert.equal(attrs.w, 'fit-content');
  assert.equal(attrs.h, 'max-content');

  const minBox = { ...box, style: { ...box.style, w: 'min-content', h: 'min-content' } };
  const minAttrs = attrsFor(minBox, { parent: null, parentResolved: null, chain: [minBox], bp: 'desktop' });
  assert.equal(minAttrs.w, 'min-content');
  assert.equal(minAttrs.h, 'min-content');
});

test('text line-height emits the CSS property name that the renderer understands', () => {
  const text = makeText(20, 30, 'Hello world', 18);
  text.style.lineHeight = 1.8;
  const attrs = attrsFor(text, { parent: null, parentResolved: null, chain: [text], bp: 'desktop' });
  assert.equal(attrs['line-height'], '1.8');
  assert.equal(attrs.leading, undefined);
});

test('links and semantic tags survive export for navbar-like content', () => {
  const page = makePage('Home', [makeSection('Nav', 120)]);
  page.root.children = [
    {
      ...makeSection('Nav', 120),
      children: [
        { ...makeText(0, 0, 'Brand', 22), id: 'brand', tag: 'a', href: '#top' },
        { ...makeHeading(0, 0, 'Product', 28), id: 'product', tag: 'a', href: '#product' },
        { ...makeButton(0, 0, 'Get started'), id: 'cta', href: '#buy' },
      ],
    },
  ];

  const project = {
    name: 'Navbar test',
    kind: 'website',
    pages: [page],
    activePageId: page.id,
    assets: [],
    components: [],
    colors: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    id: 'proj-1',
  } as any;

  const result = generate(project, 'HTML', assetNamesFor(project));
  const html = result.code;

  assert.match(html, /<nav/);
  assert.match(html, /href="#product"/);
  assert.match(html, /href="#buy"/);
  assert.match(html, /<button|<a/);
});

test('flow reorder targets respect flex gap boundaries when justify is between', () => {
  const rects = [
    { left: 0, width: 80, right: 80, top: 0, bottom: 24, height: 24 },
    { left: 220, width: 80, right: 300, top: 0, bottom: 24, height: 24 },
    { left: 440, width: 80, right: 520, top: 0, bottom: 24, height: 24 },
  ];

  assert.equal(getFlowReorderTarget(rects, 120, true, 'between'), 1);
  assert.equal(getFlowReorderTarget(rects, 300, true, 'between'), 2);
  assert.equal(getFlowReorderTarget(rects, 40, true, 'between'), 0);
});

test('flow reorder targets still work in regular row and grid layouts without space-between', () => {
  const row = [
    { left: 0, width: 80, right: 80, top: 0, bottom: 24, height: 24 },
    { left: 100, width: 80, right: 180, top: 0, bottom: 24, height: 24 },
    { left: 200, width: 80, right: 280, top: 0, bottom: 24, height: 24 },
  ];

  assert.equal(getFlowReorderTarget(row, 80, true, 'start'), 1);
  assert.equal(getFlowReorderTarget(row, 150, true, 'start'), 2);
  assert.equal(getFlowReorderTarget(row, 300, true, 'start'), 3);
});

test('moving between freeform and flex parents keeps freeform positioning while grid stays locked', () => {
  const page = makePage('Home', [makeSection('Free', 400), makeSection('Flex', 400), makeSection('Grid', 400)]);
  const free = page.root.children![0];
  const flex = page.root.children![1];
  const grid = page.root.children![2];
  free.style.layout = 'free';
  flex.style.layout = 'flex';
  grid.style.layout = 'grid';
  const item = makeText(84, 126, 'Move me', 18);
  item.id = 'move-me'; item.style.w = 240; item.style.mode = 'abs';
  free.children = [item];
  const inFlex = moveNode(page.root, item.id, flex.id, 0);
  assert.equal(find(inFlex, item.id)?.style.mode, 'abs');
  assert.equal(typeof find(inFlex, item.id)?.style.x, 'number');
  const inGrid = moveNode(inFlex, item.id, grid.id, 0);
  assert.equal(find(inGrid, item.id)?.style.mode, 'flow');
  assert.equal(find(inGrid, item.id)?.style.x, undefined);
  const backToFree = moveNode(inGrid, item.id, free.id, 0);
  assert.equal(find(backToFree, item.id)?.style.mode, 'abs');
  assert.equal(typeof find(backToFree, item.id)?.style.x, 'number');
});

test('shop preset has a real nav with individual anchor links and responsive flow sections', async () => {
  const { presetPages } = await import('../src/document/factory');
  const page = presetPages('shop')[0];
  const nav = page.root.children?.find(n => n.name === 'Navbar');
  assert.ok(nav);
  const links = (nav.children || []).flatMap(n => n.children || []).filter(n => n.tag === 'a');
  assert.ok(links.length >= 3);
  assert.ok(links.every(n => typeof n.href === 'string' && n.href.startsWith('#')));
  assert.equal(page.root.style.layout, 'flex');
  assert.ok(page.root.children?.every(n => n.style.mode === 'flow'));
});

test('moving into grid preserves unrelated breakpoint styling and removes stale coordinates', () => {
  const page = makePage('Home', [makeSection('Free', 400), makeSection('Grid', 400)]);
  const free = page.root.children![0];
  const grid = page.root.children![1];
  grid.style.layout = 'grid';
  const item = makeText(80, 120, 'Responsive', 18);
  item.id = 'responsive-item';
  item.bp = { tablet: { color: '#ff0000', x: 40 }, mobile: { fontSize: 14, y: 90 } };
  free.children = [item];
  const next = moveNode(page.root, item.id, grid.id, 0);
  const moved = find(next, item.id)!;
  assert.equal(moved.style.mode, 'flow');
  assert.equal(moved.style.x, undefined);
  assert.equal(moved.bp?.tablet?.color, '#ff0000');
  assert.equal(moved.bp?.mobile?.fontSize, 14);
  assert.equal(moved.bp?.tablet?.x, undefined);
  assert.equal(moved.bp?.mobile?.y, undefined);
});

test('flex sections keep freeform child movement while grid remains locked', () => {
  const page = makePage('Home', [makeSection('Flex', 440), makeSection('Grid', 440)]);
  const flex = page.root.children![0];
  const grid = page.root.children![1];
  flex.style.layout = 'flex';
  grid.style.layout = 'grid';
  const item = makeText(60, 90, 'Move me', 18);
  item.id = 'flex-item';
  item.style.mode = 'abs';
  flex.children = [item];

  const movedIntoFlex = moveNode(page.root, item.id, flex.id, 0);
  const flexItem = find(movedIntoFlex, item.id)!;
  assert.equal(flexItem.style.mode, 'abs');
  assert.equal(typeof flexItem.style.x, 'number');
  assert.equal(typeof flexItem.style.y, 'number');

  const movedIntoGrid = moveNode(movedIntoFlex, item.id, grid.id, 0);
  const gridItem = find(movedIntoGrid, item.id)!;
  assert.equal(gridItem.style.mode, 'flow');
  assert.equal(gridItem.style.x, undefined);
});

test('reordered stacked children keep layer/document order in generated styles', async () => {
  const { buildGen } = await import('../src/document/gen');
  const { cssFor } = await import('../src/exporters/css');
  const page = makePage('Home', [makeSection('First', 200), makeSection('Second', 200)]);
  page.root.style.layout = 'flex';
  page.root.style.dir = 'column';
  const first = page.root.children![0];
  const second = page.root.children![1];
  const reordered = moveNode(page.root, first.id, page.root.id, 1);
  assert.deepEqual(reordered.children?.map(n => n.name), ['Second', 'First']);
  const project = { assets: [], colors: [], tokens: [], pageTheme: 'light' } as any;
  const gen = buildGen(reordered, 'desktop', 'export', [], null, null, project);
  const css = cssFor(gen, false);
  assert.doesNotMatch(css, /order:/);
});

test('freeform drag/resize treats absolute and fixed positioning as draggable', async () => {
  const { isFreeformPosition } = await import('../src/canvas/position');
  assert.equal(isFreeformPosition('absolute'), true);
  assert.equal(isFreeformPosition('fixed'), true);
  assert.equal(isFreeformPosition('relative'), false);
  assert.equal(isFreeformPosition('static'), false);
});

test('page settings updates the active page metadata and dimensions', () => {
  const page = makePage('Home', [makeSection('Hero', 400)]);
  page.seo = { title: 'Acme landing page', description: 'A product story for Acme' };
  page.width = 1280;
  page.height = 1600;
  page.root.style.w = 1280;
  page.root.style.h = 1600;

  S.openProject({
    version: 1,
    id: 'site-1',
    name: 'Acme',
    kind: 'website',
    settings: { tablet: true, mobile: true, autoStack: true },
    pages: [page],
    activePageId: page.id,
    assets: [],
    components: [],
    colors: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as any);

  S.setPageSettings(page.id, {
    name: 'Landing',
    seo: { title: 'New SEO title', description: 'Updated description' },
    width: 1366,
    height: 1500,
  });

  const updated = S.getState().project!.pages[0];
  assert.equal(updated.name, 'Landing');
  assert.equal(updated.width, 1366);
  assert.equal(updated.height, 1500);
  assert.deepEqual(updated.seo, { title: 'New SEO title', description: 'Updated description' });
  assert.equal(updated.root.style.w, 1366);
  assert.equal(updated.root.style.h, 1500);
});

test('project settings can rename a site and update responsive defaults', () => {
  const page = makePage('Home', [makeSection('Hero', 400)]);
  S.openProject({
    version: 1,
    id: 'site-2',
    name: 'Old site',
    kind: 'website',
    settings: { tablet: true, mobile: true, autoStack: true },
    pages: [page],
    activePageId: page.id,
    assets: [],
    components: [],
    colors: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as any);

  S.saveProjectSettings({ name: 'Studio site', settings: { tablet: false, mobile: true, autoStack: false } });

  const project = S.getState().project!;
  assert.equal(project.name, 'Studio site');
  assert.equal(project.settings?.tablet, false);
  assert.equal(project.settings?.mobile, true);
  assert.equal(project.settings?.autoStack, false);
});

test('site navigation metadata updates each page label, slug, and visibility without disturbing canvas content', () => {
  const home = makePage('Home', [makeSection('Hero', 360)]);
  const about = makePage('About', [makeSection('Story', 320)]);
  S.openProject({
    version: 1,
    id: 'site-3',
    name: 'Navigation site',
    kind: 'website',
    settings: { tablet: true, mobile: true, autoStack: true },
    pages: [home, about],
    activePageId: home.id,
    assets: [],
    components: [],
    colors: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as any);

  S.saveSiteNavigation([
    { id: home.id, navLabel: 'Home', slug: 'home', inNav: true },
    { id: about.id, navLabel: 'Our story', slug: 'our-story', inNav: false },
  ]);

  const pages = S.getState().project!.pages;
  assert.equal(pages[0].navLabel, 'Home');
  assert.equal(pages[0].slug, 'home');
  assert.equal(pages[0].inNav, true);
  assert.equal(pages[1].navLabel, 'Our story');
  assert.equal(pages[1].slug, 'our-story');
  assert.equal(pages[1].inNav, false);
});

test('page templates generate complete starter pages instead of a blank canvas', async () => {
  const { pageTemplates } = await import('../src/document/factory');
  const page = pageTemplates('landing')[0];
  assert.equal(page.name, 'Home');
  assert.ok(page.root.children && page.root.children.length >= 3);
  assert.ok(page.root.children!.some(node => node.name === 'Hero'));
  assert.ok(page.root.children!.some(node => node.name === 'Features'));
});

test('exported HTML includes project and page social metadata tags', () => {
  const home = makePage('Home', [makeSection('Hero', 360)]);
  home.seo = {
    title: 'Launch plan',
    description: 'Launch sequencing and rollout details.',
    socialTitle: 'Launch plan',
    socialDescription: 'Everything you need for launch readiness.',
    socialImage: 'https://example.com/launch.png',
  } as any;
  const project = {
    name: 'Northstar',
    kind: 'website',
    pages: [home],
    activePageId: home.id,
    assets: [],
    components: [],
    colors: [],
    site: {
      name: 'Northstar',
      description: 'Growth for product teams.',
      baseUrl: 'https://northstar.example',
      socialImage: 'https://example.com/og-default.png',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    id: 'proj-social',
  } as any;

  const html = generate(project, 'HTML').code;
  assert.match(html, /<meta property="og:title" content="Launch plan"/);
  assert.match(html, /<meta property="og:description" content="Everything you need for launch readiness\."/);
  assert.match(html, /<meta property="og:image" content="https:\/\/example\.com\/launch\.png"/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
  assert.match(html, /<meta property="og:site_name" content="Northstar"/);
});

test('slot target: space-between row maps left, centre and right drops to slots 0, 1, 2', () => {
  const r = (l: number) => ({ left: l, right: l + 80, top: 0, bottom: 24 });
  const row = [r(0), r(220), r(440)];
  assert.equal(getSlotTarget(row, { x: 20, y: 10 }, 2), 0);
  assert.equal(getSlotTarget(row, { x: 250, y: 10 }, 0), 1);
  assert.equal(getSlotTarget(row, { x: 500, y: 10 }, 0), 2);
});

test('slot target: grid reorders across rows and treats empty cells as the last slot', () => {
  const c = (col: number, rowi: number) => ({ left: col * 100, right: col * 100 + 90, top: rowi * 100, bottom: rowi * 100 + 90 });
  const grid = [c(0, 0), c(1, 0), c(2, 0), c(0, 1), c(1, 1)];
  assert.equal(getSlotTarget(grid, { x: 20, y: 150 }, 0), 3);
  assert.equal(getSlotTarget(grid, { x: 150, y: 20 }, 4), 1);
  assert.equal(getSlotTarget(grid, { x: 250, y: 150 }, 0), 4);
  assert.equal(getSlotTarget(grid, { x: 20, y: 400 }, 1), 3);
});

test('a flow page takes its height from its sections, not a fixed 1200px', async () => {
  const { pageHeightFor, isFlowPage } = await import('../src/state/store');
  const sec = (id: string, minH: number) => ({ id, type: 'section' as const, name: id, style: { mode: 'flow' as const, w: 'fill' as const, h: 'auto' as const, minH }, children: [] });
  const page: any = { id: 'p', name: 'Home', guides: [], root: { id: 'r', type: 'page', name: 'Page', style: { layout: 'flex', dir: 'column', gap: 0, w: 1440, h: 'auto' }, children: [sec('a', 76), sec('b', 560), sec('c', 100)] } };
  assert.equal(isFlowPage(page), true);
  assert.equal(pageHeightFor(page), 736);
  page.root.children.push(sec('d', 300));
  assert.equal(pageHeightFor(page), 1036);
});
