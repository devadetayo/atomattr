import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGroups, NEW_GROUPS, STOCK_ASSETS, stockIdsIn } from '../src/panels/kit';
import { attrsFor } from '../src/document/attrs';
import { flatten } from '../src/document/tree';
import type { Node } from '../src/document/types';

const all = (n: Node): Node[] => [n, ...(n.children || []).flatMap(all)];

test('checkbox family has four variants, each wrapping a real checkbox in a label', () => {
  const g = NEW_GROUPS.find(x => x.id === 'checkbox')!;
  const basics = g.items.filter(i => i.section === 'Basic');
  assert.equal(basics.length, 4);
  for (const item of basics) {
    const node = item.make();
    const boxes = all(node).filter(n => n.type === 'input' && n.field?.type === 'checkbox');
    assert.ok(boxes.length >= 1, `${item.name} contains a checkbox`);
    assert.ok(item.blurb.length > 10, `${item.name} is explained`);
    const labelled = item.name === 'Checkbox group' ? all(node).filter(n => n.tag === 'label').length === 3 : node.tag === 'label';
    assert.ok(labelled, `${item.name} is label-wrapped`);
    for (const b of boxes) assert.equal(typeof b.style.w, 'number');
  }
});

test('a legacy kit item is never lost: it is grouped by name, unknown names go to More blocks', () => {
  const stub = (name: string): [string, () => Node] => [name, () => ({ id: name, type: 'container', name, style: {} })];
  const groups = buildGroups([stub('Pricing table'), stub('Navbar'), stub('Checkbox'), stub('Something new')]);
  const names = groups.flatMap(g => g.items.map(i => i.name));
  assert.ok(names.includes('Pricing table') && names.includes('Something new'));
  assert.ok(!names.includes('Checkbox'), 'old bare checkbox is replaced by the family');
  assert.ok(!names.includes('Navbar'), 'the old plain Navbar is replaced by the one with a working menu');
  assert.equal(groups.find(g => g.items.some(i => i.name === 'Something new'))!.id, 'more');
});

test('checkbox size comes from the node instead of a fixed 18px', () => {
  const box = NEW_GROUPS.find(x => x.id === 'checkbox')!.items[0].make().children!.find(c => c.type === 'input')!;
  const a = attrsFor(box, { chain: [], bp: 'desktop' } as any);
  assert.equal(a.w, '20px'); assert.equal(a.h, '20px');
});

test('label rows stay horizontal in the export instead of stacking on mobile', async () => {
  const { generate } = await import('../src/exporters/codegen');
  const { newProject } = await import('../src/document/factory');
  const p = newProject('T', 'website', 'blank');
  p.pages[0].root.children![0].children = [NEW_GROUPS.find(x => x.id === 'checkbox')!.items[0].make()];
  const html = generate(p, 'HTML').code;
  const label = html.slice(html.indexOf('<label'), html.indexOf('<input'));
  assert.ok(/flex-row|flex(?!-col)/.test(label) && !/flex-col/.test(label), label);
});

test('buttons family: every variant is a real button with an icon and a label or accessible name', () => {
  const g = NEW_GROUPS.find(x => x.id === 'buttons')!;
  assert.ok(g.items.length >= 4);
  for (const item of g.items) {
    const nodes = all(item.make());
    if (/icon|fab|hamburger/i.test(item.name)) assert.ok(nodes.some(n => n.type === 'path' && n.svgD), `${item.name} has an icon`);
    const btn = nodes.find(n => n.tag === 'button')!;
    assert.ok(btn, `${item.name} is a <button>`);
    assert.ok(nodes.some(n => n.type === 'text') || btn.attrs?.['aria-label'], `${item.name} has a label`);
  }
});

test('navbar family offers hamburger, side drawer and stacked layouts', () => {
  const names = NEW_GROUPS.find(x => x.id === 'navigation')!.items.map(i => i.name);
  for (const n of ['Navbar with hamburger', 'Navbar with side drawer', 'Navbar with stacked links']) assert.ok(names.includes(n), n);
  const drawer = NEW_GROUPS.find(x => x.id === 'navigation')!.items.find(i => i.name === 'Navbar with side drawer')!.make();
  assert.ok(all(drawer).some(n => n.behavior?.role === 'toggle' && !n.behavior.mobileOnly), 'hamburger shows at every size');
  assert.ok(all(drawer).some(n => n.behavior?.role === 'close'), 'drawer has a close button');
});

test('navigation offers navbars that sit in different places and open menus in different ways', () => {
  const g = NEW_GROUPS.find(x => x.id === 'navigation')!;
  const byName = (n: string) => g.items.find(i => i.name === n)!.make();
  for (const n of ['Navbar with hamburger', 'Sticky navbar', 'Floating pill navbar', 'Navbar with side drawer', 'Navbar with left drawer', 'Full-screen menu navbar', 'Bottom sheet menu', 'Bottom tab bar (phones)', 'App header (centered title)']) assert.ok(g.items.some(i => i.name === n), `${n} exists`);
  assert.equal(byName('Sticky navbar').style.position, 'sticky');
  assert.equal(byName('Floating pill navbar').style.position, 'fixed');
  const tabs = byName('Bottom tab bar (phones)');
  assert.equal(tabs.style.position, 'fixed'); assert.equal(tabs.style.bottom, 0); assert.equal(tabs.style.display, 'none'); assert.equal(tabs.bp?.mobile?.display, 'flex');
});

test('navbar rows stay on one line on phones (brand left, menu button right)', () => {
  const g = NEW_GROUPS.find(x => x.id === 'navigation')!;
  for (const name of ['Navbar with hamburger', 'Sticky navbar', 'Floating pill navbar', 'Navbar with side drawer', 'Full-screen menu navbar', 'Bottom sheet menu', 'App header (centered title)']) {
    const n = g.items.find(i => i.name === name)!.make();
    assert.equal(n.bp?.mobile?.dir, 'row', `${name} keeps its row on phones`);
  }
});

test('hero group: at least 22 variants whose headings shrink on tablet and phone', () => {
  const g = NEW_GROUPS.find(x => x.id === 'hero')!;
  assert.ok(g.items.length >= 22);
  const heads = (n: Node): Node[] => [...(n.type === 'heading' ? [n] : []), ...(n.children || []).flatMap(heads)];
  for (const it of g.items) {
    const hs = heads(it.make()); assert.ok(hs.length, `${it.name} has a heading`);
    for (const h of hs) { const d = Number(h.style.fontSize); assert.ok(Number(h.bp?.mobile?.fontSize) < d, `${it.name}: phone heading is smaller`); assert.ok(Number(h.bp?.tablet?.fontSize) <= d, `${it.name}: tablet heading is not bigger`); }
    assert.equal(it.make().type, 'section', `${it.name} is a section`);
  }
});

test('photo heroes use Unsplash placeholder photos with a gradient underneath as a fallback', () => {
  const g = NEW_GROUPS.find(x => x.id === 'hero')!;
  const img = g.items.find(i => i.name.startsWith('Image hero'))!.make();
  assert.equal(img.style.fillImg, 'stock-office'); assert.match(String(img.style.fill), /gradient/);
  assert.ok(STOCK_ASSETS.every(a => /^https:\/\/images\.unsplash\.com\//.test(a.dataUrl)), 'placeholder photos are Unsplash links');
  const split = g.items.find(i => i.name === 'Split hero (image right)')!.make();
  assert.deepEqual(stockIdsIn(split), ['stock-team']);
});

// ---- round 11: controls, loaders, animated buttons, footers, forms
import { usedUi, uiCss, UI } from '../src/document/ui-css';
import { ANIM_PRESETS } from '../src/document/animations';
const group = (id: string) => NEW_GROUPS.find(g => g.id === id)!;
const walkAll = (n: any, f: (x: any) => void) => { f(n); (n.children || []).forEach((c: any) => walkAll(c, f)); };

test('library has the new groups with enough variants', () => {
  assert.ok(group('loaders').items.length >= 20);
  assert.ok(group('animbuttons').items.length >= 20);
  assert.ok(group('switch').items.length >= 9);
  assert.ok(group('radio').items.length >= 6);
  assert.ok(group('checkbox').items.length >= 10);
  assert.ok(group('darkmode').items.length >= 6);
  assert.ok(group('footer').items.length >= 8);
  assert.ok(group('forms').items.length >= 15);
});

test('every new item builds, and every data-ui id has CSS', () => {
  for (const id of ['loaders', 'animbuttons', 'switch', 'radio', 'checkbox', 'darkmode', 'footer', 'forms']) {
    for (const it of group(id).items) {
      const n = it.make(); assert.ok(n, it.name);
      walkAll(n, x => { const v = x.attrs?.['data-ui']; if (typeof v === 'string') v.split(/\s+/).forEach((u: string) => { if (u !== 'vh') assert.ok(UI[u], `${it.name}: no CSS for ${u}`); }); });
    }
  }
});

test('loader animations use real presets', () => {
  const ids = new Set(ANIM_PRESETS.map((p: any) => p.id));
  for (const it of group('loaders').items) walkAll(it.make(), x => { if (x.anim) assert.ok(ids.has(x.anim.preset), `${it.name}: ${x.anim.preset}`); });
});

test('radio groups get their own name each time', () => {
  const names = (n: any) => { const s = new Set<string>(); walkAll(n, x => { if (x.field?.type === 'radio') s.add(x.field.name); }); return [...s]; };
  const it = group('radio').items[0];
  assert.notDeepEqual(names(it.make()), names(it.make()));
});

test('exports only carry the control rules a page uses', () => {
  const sw = group('switch').items[0].make();
  assert.ok(usedUi([sw]).includes('sw-ios'));
  assert.ok(uiCss([sw]).includes('sw-ios') || uiCss([sw]).includes('data-ui^="sw-"'));
  assert.ok(!uiCss([sw]).includes('dm-sky'));
});

test('dark mode toggles carry the theme behavior', () => {
  for (const it of group('darkmode').items.filter(i => i.section === 'Toggles')) { let found = false; walkAll(it.make(), x => { if (x.behavior?.role === 'theme') found = true; }); assert.ok(found, it.name); }
});
