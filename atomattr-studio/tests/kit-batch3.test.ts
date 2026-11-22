import test from 'node:test';
import assert from 'node:assert/strict';
import { NEW_GROUPS } from '../src/panels/kit';
import { UI } from '../src/document/ui-css';
import type { Node } from '../src/document/types';

const all = (n: Node): Node[] => [n, ...(n.children || []).flatMap(all)];
const group = (id: string) => NEW_GROUPS.find(g => g.id === id)!;

test('navigation has at least 8 new items in each of its six types', () => {
  const items = group('navigation').items;
  for (const s of ['Navbars', 'Menus', 'Tabs', 'Breadcrumbs', 'Pagination', 'Sidebars']) assert.ok(items.filter(i => i.section === s).length >= 8, `${s} has 8`);
});
test('radio gained at least 8 and footers gained 16', () => {
  assert.ok(group('radio').items.length >= 19, `radio ${group('radio').items.length}`);
  assert.ok(group('footer').items.length >= 24, `footer ${group('footer').items.length}`);
});
test('every new nav, radio and footer item builds, and every data-ui has CSS', () => {
  for (const id of ['navigation', 'radio', 'footer', 'hero', 'darkmode']) for (const item of group(id).items) {
    const n = item.make(); assert.ok(n, item.name);
    for (const x of all(n)) { const u = x.attrs?.['data-ui']; if (u) for (const t of String(u).split(/\s+/)) if (t !== 'vh') assert.ok(UI[t] !== undefined, `${item.name}: ${t}`); }
  }
});
test('each tab set has unique keys and one open panel', () => {
  for (const item of group('navigation').items.filter(i => i.section === 'Tabs')) {
    const n = item.make(); const tabs = all(n).filter(x => x.behavior?.role === 'tab'); const panels = all(n).filter(x => x.behavior?.role === 'panel' && x.behavior.group);
    assert.equal(tabs.length, 3, item.name); assert.equal(new Set(tabs.map(t => t.behavior!.key)).size, 3);
    assert.equal(panels.filter(p => p.behavior!.initial === 'open').length, 1, item.name);
  }
});

test('hero has at least 22 variants', () => { assert.ok(group('hero').items.length >= 22, `hero ${group('hero').items.length}`); });

test('switch, checkbox and toasts are topped up', () => { assert.ok(group('switch').items.length >= 20, `switch ${group('switch').items.length}`); assert.ok(group('checkbox').items.length >= 22, `checkbox ${group('checkbox').items.length}`); assert.ok(group('toasts').items.length >= 22, `toasts ${group('toasts').items.length}`); });

test('dark mode has at least 20 toggles, all use the theme behavior', () => { const g = group('darkmode'); assert.ok(g.items.length >= 20, `darkmode ${g.items.length}`); for (const it of g.items) { const n = it.make(); assert.ok(all(n).some(x => x.behavior?.role === 'theme'), it.name); } });
