import test from 'node:test';
import assert from 'node:assert/strict';
import { applyClass, applyToken, captureClass, defaultScale, dropClass, dropToken, scaleVars, syncClass, syncToken, unlinkToken, usageOfToken } from '../src/document/scales';
import { patchStyle } from '../src/document/style';
import type { Node } from '../src/document/types';

const n = (id: string, style = {}, children: Node[] = []): Node => ({ id, type: 'container', name: id, style, children } as any);
const md = defaultScale().find(t => t.id === 'space-md')!;

test('scale variables cover every token', () => {
  const css = scaleVars(defaultScale());
  assert.match(css, /--space-md:16px/); assert.match(css, /--radius-full:999px/); assert.match(css, /--shadow-lg:0px 18px 40px/);
  assert.equal(scaleVars([]), '');
});

test('editing a token rewrites the nodes that follow it, and only those', () => {
  const root = n('r', {}, [applyToken(n('a'), 'pad', md), applyToken(n('b'), 'gap', md), n('c', { pad: 16 })]);
  const next = syncToken(root, { ...md, value: 20 });
  assert.deepEqual(next.children!.map(c => c.style.pad), [20, undefined, 16]);
  assert.equal(next.children![1].style.gap, 20);
  assert.equal(usageOfToken(root, md.id), 2);
});

test('typing a value unlinks that field, other links stay', () => {
  let a = applyToken(applyToken(n('a'), 'pad', md), 'gap', md);
  a = patchStyle(a, { pad: 10 }, 'desktop');
  assert.equal(a.style.pad, 10); assert.deepEqual(a.style.tok, { gap: md.id });
  a = patchStyle(a, { gap: 3 }, 'desktop'); assert.equal(a.style.tok, undefined);
});

test('deleting a token keeps values but unlinks', () => {
  const root = n('r', {}, [applyToken(n('a'), 'pad', md)]);
  const next = dropToken(root, md.id);
  assert.equal(next.children![0].style.pad, 16); assert.equal(next.children![0].style.tok, undefined);
  assert.equal(unlinkToken(n('x'), 'pad').style.tok, undefined);
});

test('style classes capture, apply, sync and drop', () => {
  const src = n('s', { fill: '#fff', radius: 12, w: 300, x: 5 });
  const cls = captureClass(src, 'Card', 'c1'); assert.deepEqual(cls.style, { fill: '#fff', radius: 12 });
  const root = n('r', {}, [applyClass(n('a', { w: 100 }), cls), n('b')]);
  const next = syncClass(root, { ...cls, style: { ...cls.style, radius: 20 } });
  assert.equal(next.children![0].style.radius, 20); assert.equal(next.children![0].style.w, 100); assert.equal(next.children![1].style.radius, undefined);
  assert.equal(dropClass(next, 'c1').children![0].cls, undefined);
});
