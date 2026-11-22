import { parseAttribute } from './parser.js';
import { generateAndInjectRule } from './generator.js';
import { shouldIgnoreAttribute } from '../style-data/variables.js';

let observer = null;
let started = false;
const pendingElements = new Set();
const pendingTrees = new Set();
let flushScheduled = false;

function scheduleProcess(root, includeDescendants = false) {
  if (root?.nodeType === 1) (includeDescendants ? pendingTrees : pendingElements).add(root);
  if (flushScheduled) return;
  flushScheduled = true;
  const flush = () => {
    flushScheduled = false;
    const elements = Array.from(pendingElements);
    const trees = Array.from(pendingTrees);
    pendingElements.clear();
    pendingTrees.clear();
    for (const element of elements) processElement(element);
    for (const tree of trees) processTree(tree);
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush);
  else Promise.resolve().then(flush);
}

// Parsing is pure, so the result for a given attribute name and value is reused.
// Pages repeat the same values constantly, so most attributes skip the parser entirely.
const parseCache = new Map();
const PARSE_CACHE_LIMIT = 20000;

function parseCached(name, value) {
  const key = `${name}\u0000${value}`;
  let parsed = parseCache.get(key);
  if (parsed !== undefined) return parsed;
  parsed = parseAttribute(name, value) || null;
  if (parseCache.size >= PARSE_CACHE_LIMIT) parseCache.clear();
  parseCache.set(key, parsed);
  return parsed;
}

function processElement(element) {
  if (!element || element.nodeType !== 1 || !element.attributes) return;

  for (const attribute of element.attributes) {
    if (shouldIgnoreAttribute(attribute.name)) continue;

    const parsed = parseCached(attribute.name, attribute.value);
    if (parsed) generateAndInjectRule(parsed);
  }
}

function processTree(root) {
  if (!root || root.nodeType !== 1) return;

  processElement(root);
  root.querySelectorAll('*').forEach(processElement);
}

export function refreshAtomAttr(root = document.documentElement) {
  if (typeof document === 'undefined') return;
  processTree(root);
}

export function startEngine() {
  if (started || typeof document === 'undefined') return;

  // Start right away, even while the document is still loading. Elements that the
  // parser adds afterwards are picked up by the observer below and styled before the
  // browser paints them, so there is no flash of unstyled content. Load the browser
  // build with a normal (non-deferred) script in <head> to get this behaviour.
  started = true;
  refreshAtomAttr(document.documentElement);

  observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        scheduleProcess(mutation.target);
      }

      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) scheduleProcess(node, true);
        });
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  // Safety net: one full pass once parsing has finished.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => refreshAtomAttr(document.documentElement), { once: true });
  }
}

export function stopEngine() {
  if (observer) observer.disconnect();
  pendingElements.clear();
  pendingTrees.clear();
  flushScheduled = false;
  observer = null;
  started = false;
}
