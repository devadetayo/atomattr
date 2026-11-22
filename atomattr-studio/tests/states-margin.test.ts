import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../src/exporters/codegen';

const node = (id: string, type: string, style: any, children: any[] = [], extra: any = {}) => ({ id, type, name: id, style, children, ...extra });
const project = (kids: any[]): any => ({ version: 1, id: 'p', name: 'T', kind: 'website', settings: {}, assets: [], components: [], colors: [], activePageId: 'a',
  pages: [{ id: 'a', name: 'Home', order: 0, parentId: null, root: node('root', 'page', { w: 1440, h: 900 }, [node('sec', 'section', { w: 'fill', h: 400, layout: 'flex', dir: 'column', pad: 20 }, kids)]) }] });

test('text keeps its margins: the reset comes first, so every side set later wins', () => {
  const css = generate(project([node('t', 'text', { marginL: 24, marginT: 6 }, [], { text: 'hi' })]), 'CSS').code;
  const rule = css.split('\n').find(l => l.includes('margin-left:24px'))!;
  assert.ok(rule.indexOf('margin:0') < rule.indexOf('margin-left:24px'));
  assert.match(rule, /margin-top:6px/);
});

test('all four margins reach the exported HTML', () => {
  const html = generate(project([node('b', 'container', { w: 200, h: 100, marginT: 12, marginR: 8, marginB: 16, marginL: 40 })]), 'HTML').code;
  for (const a of ['mt="12px"', 'mr="8px"', 'mb="16px"', 'ml="40px"']) assert.ok(html.includes(a), a);
});

test('any property can change in a state, not just colours', () => {
  const html = generate(project([node('b', 'container', { w: 200, h: 100, fill: '#f00', radius: 8 }, [], { states: { hover: { w: 240, radius: 20, fill: '#00f', padL: 30, shadow: 'lg', scale: 1.05 }, dark: { fill: '#111', stroke: '#fff', strokeWidth: 2 } } })]), 'HTML').code;
  for (const a of ['hover-w="240px"', 'hover-bg="#00f"', 'hover-rounded="20px"', 'hover-pl="30px"', 'hover-shadow="lg"', 'hover-scale="1.05"', 'dark-bg="#111"', 'dark-border="2px solid #fff"']) assert.ok(html.includes(a), a);
  const css = generate(project([node('b', 'container', { w: 200, fill: '#f00' }, [], { states: { hover: { w: 240 } } })]), 'CSS').code;
  assert.match(css, /:hover\{width:240px/);
});
