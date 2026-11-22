import test from 'node:test';
import assert from 'node:assert/strict';

// The engine must start observing while the document is still loading (no <body> yet),
// so elements added by the parser are styled before they are painted.
test('startEngine observes immediately when the body does not exist yet', async () => {
  const observed = [];
  const listeners = [];
  const root = {
    nodeType: 1,
    attributes: [],
    dataset: {},
    classList: { contains: () => false },
    querySelectorAll: () => [],
  };
  globalThis.document = {
    documentElement: root,
    body: null,
    readyState: 'loading',
    getElementById: () => null,
    addEventListener: (type, fn) => listeners.push(type),
  };
  globalThis.MutationObserver = class {
    observe(target, options) { observed.push({ target, options }); }
    disconnect() {}
  };

  const { startEngine, stopEngine } = await import('../src/engine/engine.js');
  startEngine();

  assert.equal(observed.length >= 1, true, 'observer should be attached before DOMContentLoaded');
  assert.equal(observed.at(-1).target, root);
  assert.equal(observed.at(-1).options.childList, true);
  assert.equal(listeners.includes('DOMContentLoaded'), true, 'a final full pass is still scheduled');

  stopEngine();
  delete globalThis.document;
  delete globalThis.MutationObserver;
});
