/**
 * AtomAttr variant prefixes (dark-, hover-, md-, ...). The React adapter only forwards base property names and
 * silently drops anything with a variant prefix, so `dark-bg` never reached the DOM. Variant props are instead
 * written as `data-atom-<kebab-name>` attributes, which the runtime reads directly.
 */
const STATE = ['active', 'hover', 'focus', 'focus-visible', 'focus-within', 'disabled', 'checked', 'selected', 'pressed', 'open', 'valid', 'invalid', 'required', 'read-only', 'optional', 'read-write', 'indeterminate', 'placeholder-shown', 'empty', 'only', 'first-of-type', 'last-of-type', 'first', 'last', 'odd', 'even'];
const VARIANTS = ['dark', 'group-hover', 'before', 'after', 'sm', 'md', 'lg', 'xl', '2xl', ...STATE].sort((a, b) => b.length - a.length);

export const kebab = (k: string) => k.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);

/** True for `dark-bg`, `darkBg`, `md-w`, `hover-dark-bg` ... — at least one variant prefix followed by a property. */
export function isVariantKey(key: string): boolean {
  let rest = kebab(key); let stripped = 0;
  for (;;) {
    const v = VARIANTS.find(x => rest.startsWith(`${x}-`) && rest.length > x.length + 1);
    if (!v) break;
    rest = rest.slice(v.length + 1); stripped += 1;
  }
  return stripped > 0;
}

export const variantAttrName = (key: string) => `data-atom-${kebab(key)}`;
