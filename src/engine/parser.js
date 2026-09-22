import { DICTIONARY } from '../style-data/dictionary.js';
import { BREAKPOINTS, PSEUDO_STATES } from '../style-data/variables.js';

<<<<<<< HEAD
const MODIFIERS = ['group-hover', 'dark', ...Object.keys(BREAKPOINTS), ...PSEUDO_STATES].sort(
  (left, right) => right.length - left.length
);
const PROP_KEYS = Object.keys(DICTIONARY).sort((left, right) => right.length - left.length);
const PSEUDO_ELEMENT_PREFIXES = ['before', 'after'];
const PSEUDO_STATE_ALIASES = {
  active: 'active',
  hover: 'hover',
  focus: 'focus',
  'focus-visible': 'focus-visible',
  'focus-within': 'focus-within',
  disabled: 'disabled',
  checked: 'checked',
  selected: 'selected',
  pressed: 'active',
  open: 'open',
  valid: 'valid',
  invalid: 'invalid',
  required: 'required',
  'read-only': 'read-only',
};

function escapeAttribute(name) {
  return name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeAttributeValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function consumeModifiers(prefix) {
  if (!prefix) return [];

  const matches = [];
  let remainder = prefix;

  while (remainder) {
    const next = MODIFIERS.find(mod => remainder === mod || remainder.startsWith(`${mod}-`));
    if (!next) return null;

    matches.push(next);
    remainder = remainder === next ? '' : remainder.slice(next.length + 1);
  }

  return matches;
}

export function parseAttribute(attributeName, value) {
  let pseudoElement = null;
  let attributeKey = attributeName;

  for (const prefix of PSEUDO_ELEMENT_PREFIXES) {
    if (attributeName.startsWith(`${prefix}-`)) {
      pseudoElement = prefix;
      attributeKey = attributeName.slice(prefix.length + 1);
      break;
    }
  }

  const propKey = PROP_KEYS.find(
    key => attributeKey === key || attributeKey.endsWith(`-${key}`)
  );

  if (!propKey) return null;

  const prefix =
    attributeKey === propKey ? '' : attributeKey.slice(0, attributeKey.length - propKey.length - 1);
  const modifiers = consumeModifiers(prefix);

  if (modifiers === null) return null;

  let wrapperStart = '';
  let wrapperEnd = '';
  let selectorSuffix = '';
  let selectorPrefix = '';
  let isDark = false;

  for (const modifier of modifiers) {
    if (modifier === 'dark') {
      selectorPrefix += 'html.dark ';
      isDark = true;
      continue;
    }

    if (modifier === 'group-hover') {
      selectorPrefix += '[group]:hover ';
      continue;
    }

    if (BREAKPOINTS[modifier]) {
      wrapperStart += `@media (min-width: ${BREAKPOINTS[modifier]}) { `;
      wrapperEnd = ` }${wrapperEnd}`;
      continue;
    }

    const pseudoModifier = PSEUDO_STATE_ALIASES[modifier] || modifier;
    selectorSuffix += `:${pseudoModifier}`;
  }

  const name = escapeAttribute(attributeName);
  const selectorValue =
    value === '' || value === true || value === 'true'
      ? `[${name}]`
      : `[${name}="${escapeAttributeValue(value)}"]`;

  const selector = `${selectorPrefix}${selectorValue}${selectorSuffix}`;
  const selectorWithPseudoElement = pseudoElement ? `${selector}::${pseudoElement}` : selector;

  return {
    attributeName,
    propKey,
    value,
    selector: selectorWithPseudoElement,
    wrapperStart,
    wrapperEnd,
    cacheKey: `${attributeName}::${value === undefined ? '' : String(value)}`,
    pseudoElement,
    isDark,
  };
}
=======
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
>>>>>>> c8ec279c4d068a7424101ada2032f505b126f390
