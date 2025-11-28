import { DICTIONARY } from '../style-data/dictionary.js';
import { VAR_PREFIXES, DEFAULT_UNIT, VALUE_ALIASES } from '../style-data/variables.js';

const sheet = document.createElement('style');
sheet.id = 'atomattr-generated';
document.head.appendChild(sheet);
const ruleCache = new Set();

const UNITLESS_PROPS = [
    'z', 'opacity', 'weight', 'order', 'grow', 'shrink', 'line-height', 'leading', 'scale', 'flex',
    'grid-cols', 'grid-rows', 'col-span', 'row-span'
];

export function generateAndInjectRule(parsed) {
    if (!parsed || ruleCache.has(parsed.cacheKey)) return;

    const { selector, propKey, value, wrapperStart, wrapperEnd } = parsed;
    const propMap = DICTIONARY[propKey];

    let cssValue = value;

    // 1. Check Aliases
    if (VALUE_ALIASES[value]) {
        cssValue = VALUE_ALIASES[value];
    }
    // 2. Handle Transforms
    else if (propKey.startsWith('rotate') || propKey.startsWith('scale') || propKey.startsWith('translate')) {
        const funcName = propMap.split(':')[1].trim();
        if (propKey.includes('rotate') && !isNaN(value)) cssValue = `${funcName}(${value}deg)`;
        else if (propKey.includes('translate') && !isNaN(value)) cssValue = `${funcName}(${value}${DEFAULT_UNIT})`;
        else cssValue = `${funcName}(${value})`;
    }
    // 3. Handle Boolean Attributes
    else if (value === "" || value === "true") {
        if (propMap.includes(':')) cssValue = propMap.split(':')[1];
    }
    // 4. Handle Grid
    else if ((propKey === 'grid-cols' || propKey === 'grid-rows') && !isNaN(value)) {
        cssValue = `repeat(${value}, minmax(0, 1fr))`;
    }
    else if ((propKey === 'col-span' || propKey === 'row-span') && !isNaN(value)) {
        cssValue = `span ${value} / span ${value}`;
    }
    // 5. Standard Value Resolution
    else {
        const prefix = VAR_PREFIXES[propKey];

        // --- CRITICAL FIX HERE ---
        // Added: linear, radial, conic, repeating (for gradients)
        const isRawCSS = /^(-?[\d.]+(px|rem|em|%|vh|vw|ch|ex|cm|mm|in|pt|pc|vmin|vmax)|calc\(|var\(|clamp\(|min\(|max\(|#|rgb|hsl|linear|radial|conic|repeating|gradient|url|image|fit-content|min-content|max-content|auto|none|inherit|initial|unset|hidden|visible|scroll|clip|cover|contain|collapse|nowrap|pre|pre-wrap|pointer|zoom)/.test(value);
        const isNumeric = /^-?\d+(\.\d+)?$/.test(value);

        if (isRawCSS) {
            cssValue = value;
        } else if (prefix) {
            cssValue = `var(${prefix}${value.startsWith('--') ? value : value})`;
        } else if (isNumeric && !UNITLESS_PROPS.includes(propKey)) {
            cssValue = `${value}${DEFAULT_UNIT}`;
        }
    }

    const rawProps = Array.isArray(propMap) ? propMap : [propMap];
    let ruleBody = rawProps.map(prop => {
        if (propKey === 'flex' && value && value !== "true") return `flex: ${cssValue} !important;`;

        if (prop.includes(':')) {
            if (prop.includes('--aa-')) {
                const [varName] = prop.split(':');
                return `${varName.trim()}: ${cssValue} !important;`;
            }
            return `${prop} !important;`;
        }
        return `${prop}: ${cssValue} !important;`;
    }).join(' ');

    const fullRule = wrapperStart.startsWith('@media')
        ? `${wrapperStart}${selector} { ${ruleBody} }${wrapperEnd}`
        : `${wrapperStart}${selector} { ${ruleBody} }${wrapperEnd}`;

    try {
        sheet.sheet.insertRule(fullRule, sheet.sheet.cssRules.length);
        ruleCache.add(parsed.cacheKey);
    } catch (e) { }
}