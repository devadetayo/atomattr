import test from 'node:test';
import assert from 'node:assert/strict';
import { makePage } from '../src/document/factory';
import { addAutoSnapshot, AUTO_INTERVAL_MS, makeSnapshot, MAX_AUTO_SNAPSHOTS, restoreFromSnapshot, shouldAutoSnapshot } from '../src/state/snapshots';
import type { Project } from '../src/document/types';

const base = (): Project => ({ version: 1, id: 'p', name: 'Site', kind: 'website', pages: [makePage('Home', [])], activePageId: 'x', assets: [{ id: 'a', name: 'a', mime: 'image/png', dataUrl: 'data:image/png;base64,AAAA' }], components: [], colors: [], createdAt: 0, updatedAt: 0 });

test('auto snapshots are throttled and skip image data', () => {
  let p = base();
  assert.ok(shouldAutoSnapshot(p, 1_000_000));
  p = addAutoSnapshot(p, 's1', 1_000_000);
  assert.ok(!shouldAutoSnapshot(p, 1_000_000 + AUTO_INTERVAL_MS - 1));
  assert.ok(shouldAutoSnapshot(p, 1_000_000 + AUTO_INTERVAL_MS));
  assert.deepEqual(JSON.parse(p.snapshots![0].data).assets, []);
  assert.equal(p.snapshots![0].auto, true);
});

test('auto snapshots are capped but named ones are kept', () => {
  let p = base();
  p = { ...p, snapshots: [makeSnapshot(p, 'Before launch', 'named', 1)] };
  for (let i = 0; i < MAX_AUTO_SNAPSHOTS + 5; i++) p = addAutoSnapshot(p, `a${i}`, 1000 + i * AUTO_INTERVAL_MS);
  assert.equal(p.snapshots!.filter(s => s.auto).length, MAX_AUTO_SNAPSHOTS);
  assert.ok(p.snapshots!.some(s => s.id === 'named'));
  assert.ok(!p.snapshots!.some(s => s.id === 'a0'));
});

test('restore keeps current assets and the snapshot list; named snapshots keep their own assets', () => {
  let p = base();
  p = addAutoSnapshot(p, 'auto', 5);
  const edited = { ...p, name: 'Renamed', assets: [...p.assets, { id: 'b', name: 'b', mime: 'image/png', dataUrl: 'data:image/png;base64,BBBB' }] };
  const r = restoreFromSnapshot(edited, edited.snapshots![0])!;
  assert.equal(r.name, 'Site');
  assert.deepEqual(r.assets.map(a => a.id).sort(), ['a', 'b']);
  assert.equal(r.snapshots, edited.snapshots);
  const named = makeSnapshot(base(), 'Named', 'n', 1);
  assert.equal(JSON.parse(named.data).assets.length, 1);
  assert.equal(restoreFromSnapshot(base(), { ...named, data: '{bad' }), null);
});

import { diffProjects, compareSnapshot, makeSnapshot } from '../src/state/snapshots';
test('compare reports added, removed and changed objects', () => {
  const mk = (kids: any[], extra: any = {}) => ({ version: 1, id: 'p', name: 'P', kind: 'website', pages: [{ id: 'pg', name: 'Home', guides: [], root: { id: 'r', type: 'container', name: 'Root', style: {}, children: kids } }], activePageId: 'pg', assets: [], components: [], colors: [], createdAt: 0, updatedAt: 0, ...extra } as any);
  const a = mk([{ id: 'a', type: 'text', name: 'Title', style: {}, text: 'Hi' }, { id: 'b', type: 'text', name: 'Gone', style: {} }]);
  const b = mk([{ id: 'a', type: 'text', name: 'Title', style: {}, text: 'Hello' }, { id: 'c', type: 'text', name: 'New one', style: {} }]);
  const d = diffProjects(a, b);
  assert.ok(d.lines.some(l => /1 object added: New one/.test(l))); assert.ok(d.lines.some(l => /1 object removed: Gone/.test(l))); assert.ok(d.lines.some(l => /1 object changed: Title/.test(l)));
  assert.equal(diffProjects(a, a).changed, false);
  assert.equal(compareSnapshot(b, makeSnapshot(a, 's', 'i', 1))!.changed, true);
});
