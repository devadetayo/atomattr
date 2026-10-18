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

function processElement(element) {
  if (!element || element.nodeType !== 1 || !element.attributes) return;

  for (const attribute of element.attributes) {
    if (shouldIgnoreAttribute(attribute.name)) continue;

    const parsed = parseAttribute(attribute.name, attribute.value);
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

  if (!document.body) {
    window.addEventListener('DOMContentLoaded', startEngine, { once: true });
    return;
  }

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
}

export function stopEngine() {
  if (observer) observer.disconnect();
  pendingElements.clear();
  pendingTrees.clear();
  flushScheduled = false;
  observer = null;
  started = false;
}
