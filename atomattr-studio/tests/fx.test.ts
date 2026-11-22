import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BEAMS, BACKGROUNDS, UI_FX, fxIds } from '../src/document/ui-css-fx';
import { uiCss, usedUi } from '../src/document/ui-css';

test('every beam and background has CSS and a unique id', () => {
  const ids = [...BEAMS, ...BACKGROUNDS].map(f => f.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(UI_FX[id]?.includes(`[data-ui~="${id}"]`), id);
  assert.ok(BEAMS.length >= 10 && BACKGROUNDS.length >= 12);
});

test('a node wearing a beam and a background exports both rules', () => {
  const n: any = { id: 'a', type: 'container', name: 'x', style: {}, children: [], attrs: { 'data-ui': 'fx-beam-neon fx-bg-aurora' } };
  assert.deepEqual(usedUi([n]).sort(), ['fx-beam-neon', 'fx-bg-aurora']);
  const css = uiCss([n]);
  assert.ok(css.includes('@property --beam-a') && css.includes('fx-beam-neon') && css.includes('fx-bg-aurora'));
  assert.deepEqual(fxIds('fx-beam-neon vh fx-bg-aurora'), ['fx-beam-neon', 'fx-bg-aurora']);
});
