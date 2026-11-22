import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeColor, usedColors, replaceColor } from '../src/document/colors';

const node = (id: string, style: any, extra: any = {}) => ({ id, type: 'box', name: id, style, children: [], ...extra });
const project: any = { pages: [{ id: 'p', name: 'P', root: node('root', {}, { children: [
  node('a', { fill: '#F00', color: 'rgb(255, 255, 255)' }),
  node('b', { fill: '#ff0000', stroke: '#00f' }, { states: { hover: { fill: '#ff0000' } } }),
  node('c', { fill: 'linear-gradient(90deg, #ff0000, #0000ff)' }),
] }) }], colors: [] };

test('normalizeColor spells colours one way', () => {
  assert.equal(normalizeColor('#F00'), '#ff0000');
  assert.equal(normalizeColor('rgb(255, 255, 255)'), '#ffffff');
  assert.equal(normalizeColor('rgba(0,0,0,0.5)'), '#00000080');
});
test('usedColors merges spellings, counts states and gradient stops', () => {
  const u = usedColors(project); const red = u.find(c => c.hex === '#ff0000')!;
  assert.equal(red.count, 4); assert.deepEqual(red.nodeIds.sort(), ['a', 'b', 'c']); assert.ok(red.roles.includes('fill'));
  assert.equal(u[0].hex, '#ff0000');
});
test('replaceColor changes every use, keeps the rest', () => {
  const { project: next, changed } = replaceColor(project, '#f00', '#00ff00');
  assert.equal(changed, 4);
  assert.equal(usedColors(next).some(c => c.hex === '#ff0000'), false);
  assert.equal(usedColors(next).find(c => c.hex === '#00ff00')!.count, 4);
  assert.equal(next.pages[0].root.children[2].style.fill, 'linear-gradient(90deg, #00ff00, #0000ff)');
  assert.equal(usedColors(project).find(c => c.hex === '#ff0000')!.count, 4); // original untouched
});
