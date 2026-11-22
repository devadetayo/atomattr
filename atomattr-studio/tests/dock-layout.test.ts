import test from 'node:test';
import assert from 'node:assert/strict';
import { CANVAS_MIN, COL_MIN, PRESETS, activePreset, defaultLayout, dockMode, layoutSig, makeWin, presetSig, presetWins, sideWidth, winBox, type Layout } from '../src/state/layout';

test('every preset builds docked windows with float rectangles and unique panels', () => {
  for (const p of PRESETS) {
    const wins = presetWins(p); const tabs = wins.flatMap(w => w.tabs);
    assert.equal(new Set(tabs).size, tabs.length, `${p.name} lists a panel twice`);
    assert.ok(wins.every(w => w.dock && w.floatRect && w.tabs.includes(w.active)), `${p.name} windows are docked with a float rect`);
  }
});

test('default layout is the Design preset and reads as it until the arrangement changes', () => {
  const l = defaultLayout(); assert.equal(activePreset(l)?.id, 'design');
  const moved: Layout = { ...l, wins: l.wins.map((w, i) => (i === 0 ? { ...w, dock: null } : w)) };
  assert.equal(activePreset(moved), null, 'floating a panel makes it Custom');
  const resized: Layout = { ...l, wins: l.wins.map(w => ({ ...w, w: 500, h: 500, collapsed: true })) };
  assert.equal(activePreset(resized)?.id, 'design', 'sizes and collapse state do not change the preset');
  assert.equal(layoutSig(l.wins, false), presetSig(PRESETS[0]));
});

test('floating windows always lie fully inside the area', () => {
  const area = { w: 600, h: 400 };
  for (const patch of [{ x: -50, y: -50 }, { x: 5000, y: 5000 }, { x: 10, y: 10, w: 2000, h: 2000 }, { ax: 'l' as const, x: 590, y: 390 }]) {
    const b = winBox(makeWin('layers', patch), area);
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= area.w && b.y + b.h <= area.h, JSON.stringify([patch, b]));
  }
});

test('docked columns squeeze before collapsing into a sheet, and the canvas keeps its minimum', () => {
  assert.equal(dockMode(1440, 2, 0), 'full');
  assert.equal(dockMode(960, 2, 0), 'compact');
  assert.equal(dockMode(700, 2, 0), 'sheet');
  assert.equal(dockMode(1440, 2, 700), 'sheet', 'a wide pinned code panel pushes docks into the sheet');
  assert.equal(dockMode(1000, 0, 0), 'full', 'with no docked columns there is nothing to squeeze');
  for (const w of [820, 900, 1000, 1200]) {
    const each = sideWidth(320, w, 0, 2);
    assert.ok(each >= COL_MIN && (dockMode(w, 2, 0) === 'sheet' || w - 2 * each >= CANVAS_MIN), `canvas keeps room at ${w}`);
  }
});
