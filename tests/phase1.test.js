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

test('maps structural and selected state variants to valid CSS pseudo-classes', () => {
  assert.match(parseAttribute('first-bg', 'white').selector, /:first-child$/);
  assert.match(parseAttribute('last-bg', 'white').selector, /:last-child$/);
  assert.match(parseAttribute('odd-bg', 'white').selector, /:nth-child\(odd\)$/);
  assert.match(parseAttribute('even-bg', 'white').selector, /:nth-child\(even\)$/);
  assert.match(parseAttribute('selected-bg', 'white').selector, /:checked$/);
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

test('supports modern CSS property names commonly used in framework-based UI', () => {
  const styleTag = installDocumentStub();
  clearGeneratedRules();

  generateAndInjectRule(parseAttribute('font-family', '"Inter", sans-serif'));
  generateAndInjectRule(parseAttribute('font-style', 'italic'));
  generateAndInjectRule(parseAttribute('background-blend-mode', 'multiply'));
  generateAndInjectRule(parseAttribute('mix-blend-mode', 'screen'));
  generateAndInjectRule(parseAttribute('mask-image', 'radial-gradient(circle, black 0%, transparent 100%)'));

  const rules = styleTag.sheet.cssRules.join('\n');
  assert.match(rules, /font-family: \"Inter\", sans-serif;/);
  assert.match(rules, /font-style: italic;/);
  assert.match(rules, /background-blend-mode: multiply;/);
  assert.match(rules, /mix-blend-mode: screen;/);
  assert.match(rules, /mask-image: radial-gradient\(circle, black 0%, transparent 100%\);/);
});

test('parses container query variants and composes them with states and responsive variants', () => {
  const parsed = parseAttribute('cq-md-hover-bg', 'oklch(60% 0.2 250)');
  assert.ok(parsed);
  assert.match(parsed.wrapperStart, /@container \(min-width: 768px\)/);
  assert.match(parsed.selector, /:hover/);
  assert.match(parsed.wrapperEnd, /\}/);

  const combined = parseAttribute('md-cq-sm-focus-visible-p', '4');
  assert.ok(combined);
  assert.match(combined.wrapperStart, /@media/);
  assert.match(combined.wrapperStart, /@container/);
  assert.match(combined.selector, /:focus-visible/);
});

test('container query variants work with an unnamed inline-size ancestor', () => {
  const parsed = parseAttribute('cq-md-grid-cols', '2');
  assert.equal(parsed.wrapperStart, '@container (min-width: 768px) { ');
  const namedAncestor = parseAttribute('container', 'card / inline-size');
  assert.equal(namedAncestor.propKey, 'container');
});

test('aspect video and square aliases resolve to valid ratios', () => {
  const styleTag = installDocumentStub();
  clearGeneratedRules();
  generateAndInjectRule(parseAttribute('aspect', 'video'));
  generateAndInjectRule(parseAttribute('aspect', 'square'));
  const rules = styleTag.sheet.cssRules.join('\n');
  assert.match(rules, /aspect-ratio: 16 \/ 9;/);
  assert.match(rules, /aspect-ratio: 1 \/ 1;/);
});

test('generates modern CSS declarations without rewriting compound values', () => {
  const styleTag = installDocumentStub();
  clearGeneratedRules();

  const examples = [
    ['container-type', 'inline-size'],
    ['text-wrap', 'balance'],
    ['content-visibility', 'auto'],
    ['contain-intrinsic-size', 'auto 20rem'],
    ['field-sizing', 'content'],
    ['animation-timeline', 'view(block)'],
    ['position-area', 'block-end span-inline-start'],
    ['clip-path', 'inset(0 round 1rem)'],
    ['view-transition-name', 'card'],
    ['inset-inline-start', 'calc(100% - 1rem)'],
  ];
  for (const [attribute, value] of examples) {
    generateAndInjectRule(parseAttribute(attribute, value));
  }

  const rules = styleTag.sheet.cssRules.join('\n');
  for (const [attribute, value] of examples) {
    assert.ok(rules.includes(`${attribute}="${value}"`), `selector missing ${attribute}`);
    assert.ok(rules.includes(`${attribute === 'inset-inline-start' ? 'inset-inline-start' : attribute}: ${value};`), `declaration missing ${attribute}`);
  }
});
