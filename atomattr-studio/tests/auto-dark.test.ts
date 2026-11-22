import { test } from 'node:test';
import assert from 'node:assert/strict';
import { autoDark, darkOf } from '../src/document/auto-dark';
import { buildGroups } from '../src/panels/kit';
import { mk } from '../src/document/factory';
import { generate } from '../src/exporters/codegen';
import { newProject } from '../src/document/factory';

test('colours map by lightness', () => {
  assert.equal(darkOf('#ffffff', 'fill'), '#111827'); assert.equal(darkOf('#f3f4f6', 'fill'), '#1f2937');
  assert.equal(darkOf('#4f46e5', 'fill'), null); assert.equal(darkOf('#111827', 'text'), '#f9fafb'); assert.equal(darkOf('#6b7280', 'text'), '#9ca3af');
  assert.equal(darkOf('#e5e7eb', 'stroke'), '#374151'); assert.equal(darkOf('#ffffff', 'text'), null); assert.equal(darkOf('linear-gradient(red,blue)', 'fill'), null);
});

test('a dark button turns light and its label turns dark; an own dark look is kept', () => {
  const label = mk('text', 'L', { color: '#ffffff' } as never); const btn = mk('container', 'B', { fill: '#111827' } as never, { tag: 'button', children: [label] });
  const out = autoDark(btn); assert.equal(out.states?.dark?.fill, '#f3f4f6'); assert.equal(out.children![0].states?.dark?.color, '#111827');
  const own = mk('container', 'O', { fill: '#ffffff' } as never, { states: { dark: { fill: '#000000' } } as never });
  assert.equal(autoDark(own).states?.dark?.fill, '#000000');
});

test('library blocks gain dark looks and export html.dark rules', () => {
  const all = buildGroups([]).filter(g => g.id !== 'darkmode').flatMap(g => g.items);
  let withDark = 0; const has = (n: any): boolean => !!n.states?.dark || (n.children || []).some(has);
  for (const it of all.slice(0, 120)) if (has(it.make())) withDark++;
  assert.ok(withDark > 80, `only ${withDark} of 120 blocks have a dark look`);
  const p = newProject('T', 'website', 'blank'); p.pages[0].root.children = [buildGroups([]).find(g => g.id === 'cards')!.items[0].make()];
  assert.match(generate(p, 'CSS').code, /html\.dark /);
});
