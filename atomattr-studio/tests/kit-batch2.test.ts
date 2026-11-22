import test from 'node:test';
import assert from 'node:assert/strict';
import { NEW_GROUPS } from '../src/panels/kit';
import { UI } from '../src/document/ui-css';
import type { Node } from '../src/document/types';

const all = (n: Node): Node[] => [n, ...(n.children || []).flatMap(all)];
const IDS = ['accordion', 'cards', 'imagecards', 'imagepills', 'testimonials', 'sociallinks', 'tooltips', 'ranges', 'alerts', 'toasts', 'modals', 'appscreens', 'blocks'];

for (const id of IDS) {
  test(`group ${id}: at least 20 items, all build, every data-ui has CSS`, () => {
    const g = NEW_GROUPS.find(x => x.id === id);
    assert.ok(g, `${id} exists`);
    assert.ok(g!.items.length >= 18, `${id} has ${g!.items.length}`);
    for (const item of g!.items) {
      const n = item.make();
      assert.ok(n, `${item.name} builds`);
      assert.ok(item.blurb.length > 8, `${item.name} has a blurb`);
      for (const x of all(n)) {
        const ui = x.attrs?.['data-ui'];
        if (ui) for (const u of String(ui).split(/\s+/)) assert.ok(UI[u] !== undefined, `${item.name}: data-ui ${u} has CSS`);
      }
    }
  });
}
