import { parseAttribute } from './parser.js';
import { generateAndInjectRule } from './generator.js';
<<<<<<< HEAD
import { shouldIgnoreAttribute } from '../style-data/variables.js';

let observer = null;
let started = false;

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
        processElement(mutation.target);
      }

      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) processTree(node);
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
  observer = null;
  started = false;
}
=======
import { IGNORED_ATTRS } from '../style-data/variables.js';

function processElement(el) {
    if (!el.attributes) return;
    for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        if (IGNORED_ATTRS.includes(attr.name)) continue;

        const parsed = parseAttribute(attr.name, attr.value);
        if (parsed) generateAndInjectRule(parsed);
    }
}

export function startEngine() {
    if (!document.body) {
        window.addEventListener('load', startEngine);
        return;
    }

    // Initial Scan
    const allElements = document.querySelectorAll('*');
    allElements.forEach(processElement);
    processElement(document.body);
    processElement(document.documentElement); // Catch 'dark' class on html

    // Runtime Observer
    new MutationObserver(mutations => {
        mutations.forEach(m => {
            if (m.type === 'childList') m.addedNodes.forEach(n => n.nodeType === 1 && processElement(n));
            if (m.type === 'attributes') processElement(m.target);
        });
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
}
>>>>>>> c8ec279c4d068a7424101ada2032f505b126f390
