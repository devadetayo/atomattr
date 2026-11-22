import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, newProject } from '../src/document/factory';
import { applyPreviewClick } from '../src/document/behavior';
import { resolveNode } from '../src/document/style';
import type { Node } from '../src/document/types';

const all = (n: Node): Node[] => [n, ...(n.children || []).flatMap(all)];
const FULL = PRESETS.filter(p => p.id !== 'blank').map(p => p.id);
const pageOf0 = (_id: string, nodes: Node[]) => nodes[0];
const pageOf = (id: (typeof PRESETS)[number]['id']) => newProject('T', 'website', id).pages[0].root;

test('the gallery offers the twelve templates plus a blank page', () => {
  assert.deepEqual(FULL, ['finance', 'fintech', 'brand', 'dress', 'designer', 'dashboard', 'market', 'velour', 'mortgage', 'tasks', 'finexus', 'artshop']);
  assert.equal(PRESETS.length, 13);
});

test('every starting template builds a page with unique ids, readable text and a heading', () => {
  for (const p of PRESETS) {
    const nodes = all(pageOf(p.id));
    assert.equal(new Set(nodes.map(n => n.id)).size, nodes.length, `${p.name}: ids are unique`);
    if (p.id !== 'blank') assert.ok(nodes.some(n => n.type === 'heading'), `${p.name} has a heading`);
  }
});

test('every template has a working hamburger menu and real links', () => {
  for (const id of FULL) {
    const nodes = all(pageOf(id));
    assert.ok(nodes.some(n => n.behavior?.role === 'toggle' && n.behavior.mobileOnly), `${id}: hamburger toggle`);
    assert.ok(nodes.some(n => n.behavior?.role === 'panel' && n.behavior.mobile), `${id}: menu panel`);
    assert.ok(nodes.some(n => n.href), `${id}: real links`);
  }
});

test('navbars keep the brand left and the menu button right on phones (justify between) and shrink their padding', () => {
  for (const id of FULL) {
    const navs = all(pageOf(id)).filter(n => n.behavior?.role === 'scope' && (n.children || []).some(c => c.behavior?.role === 'toggle' && c.behavior.mobileOnly));
    assert.ok(navs.length, `${id}: has a navbar`);
    for (const nav of navs) {
      assert.equal(nav.bp?.mobile?.justify, 'between', `${id}: phone navbar justify between`);
      const r = resolveNode(nav, 'mobile'); assert.equal(r.s.dir, 'row', `${id}: the phone navbar stays a row (the editor would otherwise stack it)`); assert.equal(r.s.justify, 'between');
      assert.equal(nav.bp?.mobile?.padX, 20, `${id}: phone navbar padding`);
      assert.equal(nav.bp?.tablet?.padX, 32, `${id}: tablet navbar padding`);
      const brandNode = nav.children![0]; assert.equal(brandNode.style.w, 'auto', `${id}: brand does not stretch`);
    }
  }
});

test('side padding differs by screen size: wide on desktop, 32 on tablet, 20 on phones', () => {
  for (const id of FULL) {
    const wide = (pageOf(id).children || []).concat(all(pageOf(id)).filter(n => n.type === 'section')).filter(n => n.type === 'section' && (n.style.padX ?? 0) > 32);
    assert.ok(wide.length, `${id}: has padded sections`);
    for (const s of wide) { assert.equal(s.bp?.tablet?.padX, 32, `${id}/${s.name}: tablet`); assert.equal(s.bp?.mobile?.padX, 20, `${id}/${s.name}: phone`); }
  }
});

test('large headings shrink on phones and fixed widths go full width', () => {
  for (const id of FULL) {
    const nodes = all(pageOf(id));
    for (const h of nodes.filter(n => n.type === 'heading' && (n.style.fontSize ?? 0) >= 36)) assert.ok((h.bp?.mobile?.fontSize ?? 999) < (h.style.fontSize as number), `${id}/${h.text}: phone size smaller`);
    for (const n of nodes.filter(n => n !== pageOf0(id, nodes) && n.type !== 'path' && typeof n.style.w === 'number' && n.style.w >= 280)) assert.equal(n.bp?.mobile?.w, 'fill', `${id}/${n.name}: full width on phones`);
  }
});

test('grids drop to fewer columns on tablet and phone', () => {
  for (const id of FULL) {
    const grids = all(pageOf(id)).filter(n => n.style.layout === 'grid');
    if (id !== 'dashboard') assert.ok(grids.length, `${id}: has grids`);
    for (const g of grids) { assert.ok((g.bp?.tablet?.cols ?? 99) <= 3, `${id}/${g.name}: tablet`); assert.ok((g.bp?.mobile?.cols ?? 99) <= 3 && g.bp!.mobile!.cols! <= g.style.cols!, `${id}/${g.name}: phone`); }
  }
});

test('templates export to HTML and React without throwing, and keep the menu attributes', async () => {
  const { generate } = await import('../src/exporters/codegen');
  for (const p of PRESETS) {
    const project = newProject('T', 'website', p.id);
    assert.ok(generate(project, 'HTML').code.length > 100, `${p.name} HTML`);
    assert.ok(generate(project, 'React').code.length > 100, `${p.name} React`);
    if (p.id !== 'blank') assert.match(generate(project, 'HTML').code, /data-ast-toggle/, `${p.name}: toggle attribute exported`);
  }
});

test('preview mode: the hamburger opens and closes the menu, and clicking elsewhere leaves it alone', () => {
  const root = pageOf('finance');
  const nodes = all(root); const toggle = nodes.find(n => n.behavior?.role === 'toggle' && n.behavior.mobileOnly)!; const menu = nodes.find(n => n.behavior?.role === 'panel' && n.behavior.mobile)!;
  const nav = nodes.find(n => n.behavior?.role === 'scope' && n.children?.includes(toggle))!;
  const state = new Map<string, boolean>();
  assert.equal(applyPreviewClick(root, [toggle.id, nav.id, root.id], state), true); assert.equal(state.get(menu.id), true, 'opens');
  assert.equal(applyPreviewClick(root, [toggle.id, nav.id, root.id], state), true); assert.equal(state.get(menu.id), false, 'closes');
  assert.equal(applyPreviewClick(root, [nav.id, root.id], state), false, 'a click on the bar changes nothing');
});

test('preview mode: FAQ items open independently and the first one starts open', () => {
  const root = pageOf('finance'); const nodes = all(root);
  const panels = nodes.filter(n => n.behavior?.role === 'panel' && n.behavior.key?.startsWith('faq-'));
  assert.equal(panels.length, 4); assert.equal(panels[0].behavior!.initial, 'open');
  const state = new Map<string, boolean>();
  const toggle2 = nodes.find(n => n.behavior?.role === 'toggle' && n.behavior.key === 'faq-2')!; const scope2 = nodes.find(n => n.behavior?.role === 'scope' && n.children?.includes(toggle2))!;
  applyPreviewClick(root, [toggle2.id, scope2.id, root.id], state);
  assert.equal(state.get(panels[1].id), true); assert.equal(state.has(panels[0].id), false, 'the first item is untouched');
});

test('the dashboard table rows stay in a line on phones while hidden columns drop out', () => {
  const rows = all(pageOf('dashboard')).filter(n => n.name.endsWith(' row') && n.children?.length === 5);
  assert.ok(rows.length >= 8);
  for (const r of rows) { assert.equal(resolveNode(r, 'mobile').s.dir, 'row', `${r.name} stays a row`); assert.equal(r.children!.filter(c => c.bp?.mobile?.display === 'none').length, 3, `${r.name}: date, invoice and medium hide on phones`); }
});
