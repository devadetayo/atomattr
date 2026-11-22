import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import JSZip from 'jszip';
import { generate } from '../src/exporters/codegen';
import { buildReactProjectZip } from '../src/exporters/react-project';
import { newProject } from '../src/document/factory';
import { NEW_GROUPS } from '../src/panels/kit';
import { attrsFor } from '../src/document/attrs';
import { behaviorAttrs, usesBehavior } from '../src/document/behavior';
import type { Node } from '../src/document/types';

const item = (group: string, name: string) => NEW_GROUPS.find(g => g.id === group)!.items.find(i => i.name === name)!;
function page(...nodes: Node[]) {
  const p = newProject('T', 'website', 'blank');
  p.pages[0].root.children![0].children = nodes; return p;
}
function load(project: ReturnType<typeof page>) {
  const html = generate(project, 'HTML').code.replace(/<script src=[^>]*><\/script>/, '');
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
  const d = dom.window.document;
  const click = (el: Element) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const state = (el: Element) => el.getAttribute('data-ast-state');
  const key = (e: string) => dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: e, bubbles: true }));
  return { dom, d, click, state, key, html };
}

test('navbar: the Menu button opens and closes the mobile menu', () => {
  const { d, click, state } = load(page(item('navigation', 'Navbar with hamburger').make()));
  const toggle = d.querySelector('[data-ast-toggle="menu"]')!; const menu = d.querySelector('[data-ast-panel="menu"]')!;
  assert.ok(toggle.hasAttribute('data-ast-mobile-only'), 'Menu button only shows on small screens');
  assert.ok(menu.hasAttribute('data-ast-mobile'));
  assert.equal(state(menu), 'closed');
  click(toggle); assert.equal(state(menu), 'open'); assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  click(toggle); assert.equal(state(menu), 'closed'); assert.equal(toggle.getAttribute('aria-expanded'), 'false');
});

test('dropdown: opens, closes on outside click and Escape, and copies do not interfere', () => {
  const make = () => item('navigation', 'Dropdown menu').make();
  const { d, click, state, key } = load(page(make(), make()));
  const toggles = d.querySelectorAll('[data-ast-toggle="menu"]'); const panels = d.querySelectorAll('[data-ast-panel="menu"]');
  assert.equal(toggles.length, 2);
  click(toggles[0]); assert.equal(state(panels[0]), 'open'); assert.equal(state(panels[1]), 'closed');
  click(toggles[1]); assert.equal(state(panels[1]), 'open'); assert.equal(state(panels[0]), 'closed', 'opening the second closes the first (outside click)');
  key('Escape'); assert.equal(state(panels[1]), 'closed');
  click(toggles[0]); click(d.body); assert.equal(state(panels[0]), 'closed');
});

test('tabs: first panel starts open, clicking a tab switches panels and marks the tab selected', () => {
  const { d, click, state } = load(page(item('navigation', 'Tabs').make()));
  const tabs = [...d.querySelectorAll('[data-ast-tab]')]; const panels = [...d.querySelectorAll('[data-ast-panel]')];
  assert.deepEqual(panels.map(state), ['open', 'closed', 'closed']);
  assert.deepEqual(tabs.map(t => t.getAttribute('aria-selected')), ['true', 'false', 'false']);
  click(tabs[2]);
  assert.deepEqual(panels.map(state), ['closed', 'closed', 'open']);
  assert.deepEqual(tabs.map(t => t.getAttribute('aria-selected')), ['false', 'false', 'true']);
});

test('modal: opens from the button, closes from a close button, the backdrop and Escape', () => {
  const { d, click, state, key } = load(page(item('modals', 'Confirm dialog').make()));
  const open = d.querySelector('[data-ast-open="dlg-1"]')!; const overlay = d.querySelector('[data-ast-panel="dlg-1"]')!;
  assert.equal(overlay.getAttribute('role'), 'dialog');
  click(open); assert.equal(state(overlay), 'open');
  click(overlay.querySelector('[data-ast-close]')!); assert.equal(state(overlay), 'closed');
  click(open); click(overlay); assert.equal(state(overlay), 'closed', 'clicking the backdrop closes');
  click(open); const card = overlay.firstElementChild!; click(card); assert.equal(state(overlay), 'open', 'clicking inside does not');
  key('Escape'); assert.equal(state(overlay), 'closed');
});

test('pages without behavior get no script or style, and React exports only add the runtime when used', async () => {
  const plain = page(); assert.equal(usesBehavior(plain.pages[0].root), false);
  const html = generate(plain, 'HTML').code;
  assert.ok(!html.includes('data-ast') && !html.includes('__astBehavior'));
  const zipOf = async (p: ReturnType<typeof page>) => JSZip.loadAsync(buildReactProjectZip(p));
  assert.equal(!!(await zipOf(plain)).file('src/astBehavior.js'), false);
  const withMenu = page(item('navigation', 'Dropdown menu').make());
  const zip = await zipOf(withMenu);
  assert.ok(zip.file('src/astBehavior.js')); assert.match(await zip.file('src/main.jsx')!.async('string'), /astBehavior/);
  assert.ok(generate(withMenu, 'HTML').code.includes('__astBehavior'));
});

test('the editor keeps a modal overlay inline so it never covers the canvas', () => {
  const overlay = item('modals', 'Confirm dialog').make().children![1];
  const ctx = { parent: null, parentResolved: null, chain: [], bp: 'desktop' as const };
  assert.equal(attrsFor(overlay, { ...ctx, editor: false }).position, 'fixed');
  assert.equal(attrsFor(overlay, { ...ctx, editor: true }).position, 'relative');
  assert.deepEqual(behaviorAttrs({ role: 'close' }), { 'data-ast-close': '' });
});
