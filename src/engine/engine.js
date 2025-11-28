import { parseAttribute } from './parser.js';
import { generateAndInjectRule } from './generator.js';
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