import { DICTIONARY } from '../style-data/dictionary.js';
import { BREAKPOINTS, PSEUDO_STATES } from '../style-data/variables.js';

export function parseAttribute(attributeName, value) {
    const parts = attributeName.split('-');

    let propKey = null;
    let modifiers = [];

    // 1. LOOKUP STRATEGY
    // We need to find the property key at the end of the string.
    // It could be 1 part (e.g. 'flex') or 2 parts (e.g. 'grid-cols', 'gap-x')

    const suffix1 = parts[parts.length - 1]; // e.g. 'cols'
    const suffix2 = parts.length > 1 ? parts.slice(-2).join('-') : null; // e.g. 'grid-cols'

    // Check Exact Match First (e.g. 'grid-cols')
    if (DICTIONARY[attributeName]) {
        propKey = attributeName;
    }
    // Check 2-part Suffix (e.g. 'md-grid-cols' -> matches 'grid-cols')
    else if (suffix2 && DICTIONARY[suffix2]) {
        propKey = suffix2;
        modifiers = parts.slice(0, parts.length - 2);
    }
    // Check 1-part Suffix (e.g. 'md-p' -> matches 'p')
    else if (DICTIONARY[suffix1]) {
        propKey = suffix1;
        modifiers = parts.slice(0, parts.length - 1);
    }
    else {
        return null;
    }

    // 2. BUILD WRAPPERS (Media Queries & States)
    let selectorSuffix = '';
    let wrapperStart = '';
    let wrapperEnd = '';

    const isDarkMode = modifiers.includes('dark');
    if (isDarkMode) wrapperStart += 'html.dark ';

    modifiers.forEach(mod => {
        if (BREAKPOINTS[mod]) {
            wrapperStart = `@media (min-width: ${BREAKPOINTS[mod]}) { ${wrapperStart}`;
            wrapperEnd += '}';
        } else if (PSEUDO_STATES.includes(mod)) {
            selectorSuffix += `:${mod}`;
        }
    });

    // 3. BUILD SELECTOR
    const escapedName = attributeName.replace(/:/g, '\\:');
    // Boolean vs Value Selector logic
    const attrSelector = (value === "" || value === "true")
        ? `[${escapedName}=""]` // Strict boolean match to avoid collisions
        : `[${escapedName}="${value}"]`;

    const selector = `${wrapperStart}${attrSelector}${selectorSuffix}`;

    return {
        selector, propKey, value, wrapperStart, wrapperEnd,
        cacheKey: `${attributeName}=${value}`
    };
}