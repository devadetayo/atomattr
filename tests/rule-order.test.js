import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAttribute } from '../src/engine/parser.js';
import { clearGeneratedRules, generateAndInjectRule } from '../src/engine/generator.js';

function installDocument() {
  const sheet = {
    cssRules: [],
    insertRule(rule, index = this.cssRules.length) {
      this.cssRules.splice(index, 0, rule);
      return index;
    },
  };
  const tag = { id: 'atomattr-generated', sheet, textContent: '', appendChild() {} };
  global.document = {
    head: { appendChild() {} },
    createElement: () => tag,
    createTextNode: () => ({}),
    getElementById: id => (id === 'atomattr-generated' ? tag : null),
  };
  global.window = { addEventListener() {} };
  clearGeneratedRules();
  return sheet;
}

function generate(...pairs) {
  for (const [name, value] of pairs) generateAndInjectRule(parseAttribute(name, value));
}

const order = sheet => sheet.cssRules.map(rule => rule.match(/\[([a-z-]+)=/)[1]);

test('base rules come before breakpoint rules whatever order they are discovered in', () => {
  const sheet = installDocument();
  generate(['md-p', '8'], ['p', '2']);
  assert.deepEqual(order(sheet), ['p', 'md-p']);
});

test('breakpoints are ordered from small to large', () => {
  const sheet = installDocument();
  generate(['xl-p', '4'], ['md-p', '4'], ['lg-p', '4'], ['sm-p', '4'], ['p', '4']);
  assert.deepEqual(order(sheet), ['p', 'sm-p', 'md-p', 'lg-p', 'xl-p']);
});

test('state rules come after base rules and before breakpoint rules', () => {
  const sheet = installDocument();
  generate(['md-hover-p', '6'], ['md-p', '4'], ['hover-p', '3'], ['p', '1']);
  const names = order(sheet);
  assert.ok(names.indexOf('p') < names.indexOf('hover-p'));
  assert.ok(names.indexOf('hover-p') < names.indexOf('md-p'));
  assert.ok(names.indexOf('md-p') < names.indexOf('md-hover-p'));
});

test('container query rules come after viewport breakpoint rules', () => {
  const sheet = installDocument();
  generate(['cq-md-p', '7'], ['lg-p', '5'], ['md-p', '3']);
  assert.deepEqual(order(sheet), ['md-p', 'lg-p', 'cq-md-p']);
});

test('the same attribute and value is only inserted once', () => {
  const sheet = installDocument();
  generate(['p', '4'], ['p', '4'], ['p', '4']);
  assert.equal(sheet.cssRules.length, 1);
});

test('clearing the rules resets the ordering state', () => {
  const sheet = installDocument();
  generate(['md-p', '8'], ['p', '2']);
  clearGeneratedRules();
  sheet.cssRules.length = 0;
  generate(['lg-p', '1'], ['p', '9']);
  assert.deepEqual(order(sheet), ['p', 'lg-p']);
});

test('shorthands come before the longhands they overlap', () => {
  const sheet = installDocument();
  generate(['pt', '2'], ['px', '3'], ['p', '4'], ['border-t', '1'], ['border', '1'], ['rounded-t', 'lg'], ['rounded', 'md']);
  const names = order(sheet);
  assert.ok(names.indexOf('p') < names.indexOf('px'));
  assert.ok(names.indexOf('px') < names.indexOf('pt'));
  assert.ok(names.indexOf('border') < names.indexOf('border-t'));
  assert.ok(names.indexOf('rounded') < names.indexOf('rounded-t'));
});

test('breakpoint order still wins over breadth', () => {
  const sheet = installDocument();
  generate(['md-pt', '2'], ['p', '4']);
  assert.deepEqual(order(sheet), ['p', 'md-pt']);
});
