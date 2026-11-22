import { createElement, forwardRef } from 'react';
// 'atomattr-real-react' is an alias for the AtomAttr React adapter (see vite.config.ts).
import * as Real from 'atomattr-real-react';
import { isVariantKey, variantAttrName } from './variants';

export * from 'atomattr-real-react';

/** Wraps an AtomAttr component so variant-prefixed props (dark-*, hover-*, md-* ...) reach the DOM. */
function withVariants(Component: any) {
  const Wrapped = forwardRef<unknown, Record<string, unknown>>((props, ref) => {
    const rest: Record<string, unknown> = {}; const variants: Record<string, string> = {};
    for (const [key, value] of Object.entries(props)) {
      if (!isVariantKey(key)) { rest[key] = value; continue; }
      if (value === false || value === null || value === undefined) continue;
      variants[variantAttrName(key)] = value === true ? '' : String(value);
    }
    return createElement(Component, { ...rest, ...variants, ref });
  });
  Wrapped.displayName = `Atom(${Component?.displayName || Component?.name || 'Component'})`;
  return Wrapped;
}

const R = Real as unknown as Record<string, any>;
export const Box = withVariants(R.Box);
export const Row = withVariants(R.Row);
export const Btn = withVariants(R.Btn);
export const Txt = withVariants(R.Txt);
export const H1 = withVariants(R.H1);
export const H2 = withVariants(R.H2);
export const Input = withVariants(R.Input);
export const Select = withVariants(R.Select);
export const Option = withVariants(R.Option);
