import test from 'node:test';
import assert from 'node:assert/strict';
import { CUSTOM_ID, animAttrs, animValue, customDefaults, customKeyframes, customName } from '../src/document/animations';
import { behaviorCss } from '../src/exporters/behavior-runtime';
import type { Node } from '../src/document/types';

const node = (anim?: any, children: Node[] = []): Node => ({ id: 'n' + Math.random(), type: 'container', name: 'x', style: {}, children, anim } as any);
const anim = (custom = customDefaults()) => ({ preset: CUSTOM_ID, duration: 700, delay: 0, ease: 'ease-out', repeat: 1, trigger: 'load' as const, custom });

test('custom animation names depend only on its values', () => {
  assert.equal(customName(customDefaults()), customName({ ...customDefaults() }));
  assert.notEqual(customName(customDefaults()), customName({ ...customDefaults(), rotate: 5 }));
  assert.match(customName({ opacity: 0.5, scale: 1, blur: 0, rotate: -5, x: 0, y: 0 }), /^ast-c-[a-z0-9-]+$/);
});

test('animValue uses the custom keyframe name and exports include its rule once', () => {
  const a = anim({ ...customDefaults(), y: 120 });
  assert.ok(animValue(a).startsWith(customName(a.custom)));
  assert.equal(animAttrs(a, 'x', false).animate, animValue(a));
  const root = node(undefined, [node(a), node(a), node(anim({ ...customDefaults(), rotate: 5 }))]);
  const css = customKeyframes([root]);
  assert.equal(css.split('@keyframes').length - 1, 2);
  assert.ok(css.includes('translate(0px,120px)'));
  assert.ok(behaviorCss([root]).includes(customName(a.custom)));
});

test('a custom animation without values is ignored', () => {
  assert.deepEqual(animAttrs({ ...anim(), custom: undefined }, 'x', false), {});
  assert.equal(customKeyframes([node({ ...anim(), custom: undefined })]), '');
});
