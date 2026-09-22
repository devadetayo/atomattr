import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAttribute } from '../src/engine/parser.js';
import { clearGeneratedRules, generateAndInjectRule } from '../src/engine/generator.js';

class FakeStyleSheet {
  constructor() {
    this.cssRules = [];
  }

  insertRule(rule) {
    this.cssRules.push(rule);
    return this.cssRules.length - 1;
  }
}

class FakeStyleElement {
  constructor() {
    this.sheet = new FakeStyleSheet();
    this.textContent = '';
  }
}

function installDocumentStub() {
  const styleTag = new FakeStyleElement();
  const documentStub = {
    head: {
      appendChild(node) {
        if (node.id === 'atomattr-generated') {
          styleTag.node = node;
        }
      },
    },
    createElement(tag) {
      if (tag === 'style') {
        return new FakeStyleElement();
      }
      return {};
    },
    getElementById(id) {
      return id === 'atomattr-generated' ? styleTag : null;
    },
  };

  global.document = documentStub;
  global.window = { addEventListener() {} };
  return styleTag;
}

test('parses focus and pseudo-element modifiers', () => {
  const focusParsed = parseAttribute('focus-border', 'blue-500');
  assert.ok(focusParsed);
  assert.equal(focusParsed.propKey, 'border');
  assert.match(focusParsed.selector, /:focus/);

  const beforeParsed = parseAttribute('before-content', "'");
  assert.ok(beforeParsed);
  assert.equal(beforeParsed.propKey, 'content');
  assert.match(beforeParsed.selector, /::before/);
});

test('generates border, outline, and ring utilities correctly', () => {
  const styleTag = installDocumentStub();
  clearGeneratedRules();

  generateAndInjectRule(parseAttribute('border', 'blue-500'));
  generateAndInjectRule(parseAttribute('focus-outline', '2'));
  generateAndInjectRule(parseAttribute('focus-ring', '2'));
  generateAndInjectRule(parseAttribute('before-content', "'"));

  const rules = styleTag.sheet.cssRules.join('\n');
  assert.match(rules, /border-color:/);
  assert.match(rules, /outline-width:/);
  assert.match(rules, /box-shadow:/);
  assert.match(rules, /content:/);
});

test('resolves semantic colors, alpha values, and simple color mixing', () => {
  const styleTag = installDocumentStub();
  clearGeneratedRules();

  generateAndInjectRule(parseAttribute('bg', 'primary'));
  generateAndInjectRule(parseAttribute('text', 'white/80'));
  generateAndInjectRule(parseAttribute('bg', 'mix(blue-500,white,20%)'));

  const rules = styleTag.sheet.cssRules.join('\n');
  assert.match(rules, /background-color: var\(--aa-color-primary, #2563eb\)/);
  assert.match(rules, /rgba\(255, 255, 255, 0\.8\)/);
  assert.match(rules, /color-mix/);
});

test('uses flex as a separate property from display and supports numeric values', () => {
  const styleTag = installDocumentStub();
  clearGeneratedRules();

  generateAndInjectRule(parseAttribute('display', 'flex'));
  generateAndInjectRule(parseAttribute('flex', '1'));

  const rules = styleTag.sheet.cssRules.join('\n');
  assert.match(rules, /display: flex;/);
  assert.match(rules, /flex: 1;/);
});

test('supports numeric font-weight values without forcing a default line-height', () => {
  const styleTag = installDocumentStub();
  clearGeneratedRules();

  generateAndInjectRule(parseAttribute('font-weight', '100'));
  generateAndInjectRule(parseAttribute('weight', '900'));

  const rules = styleTag.sheet.cssRules.join('\n');
  assert.match(rules, /font-weight: 100;/);
  assert.match(rules, /font-weight: 900;/);
});

test('supports 2- and 4-value spacing shorthands with default px units', () => {
  const styleTag = installDocumentStub();
  clearGeneratedRules();

  generateAndInjectRule(parseAttribute('p', '1 2'));
  generateAndInjectRule(parseAttribute('m', '2 4 6 8'));

  const rules = styleTag.sheet.cssRules.join('\n');
  assert.match(rules, /padding: 4px 8px;/);
  assert.match(rules, /margin: 8px 16px 24px 32px;/);
});

test('supports canonical scroll property attributes and the scroll-snap alias', () => {
  const styleTag = installDocumentStub();
  clearGeneratedRules();

  generateAndInjectRule(parseAttribute('scroll-snap-type', 'x mandatory'));
  generateAndInjectRule(parseAttribute('scroll-snap', 'y proximity'));
  generateAndInjectRule(parseAttribute('scroll-snap-stop', 'always'));
  generateAndInjectRule(parseAttribute('scroll-margin-block-start', '2'));
  generateAndInjectRule(parseAttribute('scroll-padding-inline', '1rem'));

  const rules = styleTag.sheet.cssRules.join('\n');
  assert.match(rules, /scroll-snap-type: x mandatory;/);
  assert.match(rules, /scroll-snap-type: y proximity;/);
  assert.match(rules, /scroll-snap-stop: always;/);
  assert.match(rules, /scroll-margin-block-start: 2px;/);
  assert.match(rules, /scroll-padding-inline: 1rem;/);
});
