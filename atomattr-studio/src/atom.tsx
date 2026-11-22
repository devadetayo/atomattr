/**
 * Studio-local AtomAttr React adapter.
 *
 * Replaces the stock `atomattr/react` adapter inside the Studio (see the alias in vite.config.ts).
 * Two differences from the stock adapter:
 *
 *  1. Attributes are written to the DOM as plain attributes (`bg="white"`), not `data-atom-bg`.
 *  2. Modifier-prefixed props (`dark-bg`, `hover-bg`, `dark-hover-bg`, `md-grid-cols`, `before-content`, ...)
 *     are kept. The stock adapter only accepted base dictionary keys, so every `dark-` / `hover-` / breakpoint
 *     prop was silently dropped before it reached the DOM and the engine never saw it.
 *
 * The engine (started by importing 'atomattr') already reads plain attributes and turns `dark-*` into
 * `html.dark [dark-bg="..."]` rules, so nothing else needs to change.
 */
import { createElement, forwardRef } from 'react';
import type { ReactNode } from 'react';
import 'atomattr';
import { ATOM_ALIASES, ATOM_KEYS, ATOM_MODIFIERS } from './atom-keys';

type P = { [k: string]: any; children?: ReactNode; ref?: any };

const KEYS_LONGEST_FIRST = [...ATOM_KEYS].sort((a, b) => b.length - a.length);
const PSEUDO_ELEMENTS = ['before', 'after'];

/** Props that belong to the DOM element itself, never to AtomAttr. */
const DOM_PROPS = new Set([
  'alt', 'checked', 'disabled', 'download', 'href', 'id', 'lang', 'max', 'min', 'name', 'placeholder', 'readOnly', 'rel', 'role',
  'src', 'step', 'tabIndex', 'target', 'title', 'type', 'value', 'htmlFor', 'draggable', 'contentEditable', 'spellCheck',
  'srcDoc', 'sandbox', 'autoFocus', 'autoComplete', 'defaultValue', 'defaultChecked', 'multiple', 'selected', 'rows', 'cols', 'accept', 'maxLength',
]);
const NEVER_FORWARD = new Set(['as', 'attrs', 'children', 'className', 'class', 'style', 'key', 'ref', 'dangerouslySetInnerHTML', 'horizontal']);

const isEventProp = (k: string) => k.length > 2 && k.startsWith('on') && k[2] === k[2].toUpperCase();
const camelToKebab = (s: string) => s.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);

/** True when `prefix` is made only of known modifiers joined by dashes (`dark`, `dark-hover`, `md-focus-visible`...). */
function onlyModifiers(prefix: string): boolean {
  let rest = prefix;
  while (rest) {
    const m = ATOM_MODIFIERS.find(x => rest === x || rest.startsWith(`${x}-`));
    if (!m) return false;
    rest = rest === m ? '' : rest.slice(m.length + 1);
  }
  return true;
}

const cache = new Map<string, string | null>();

/** Returns the attribute name to write for a prop, or null when the prop is not an AtomAttr attribute. */
export function atomName(key: string): string | null {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let kebab = camelToKebab(key);
  // Aliases only apply to unprefixed names, e.g. a React-style alias for a dictionary key.
  if (!ATOM_KEYS.has(kebab) && ATOM_ALIASES[key]) kebab = ATOM_ALIASES[key];
  let body = kebab;
  let pseudo = '';
  for (const p of PSEUDO_ELEMENTS) if (body.startsWith(`${p}-`)) { pseudo = `${p}-`; body = body.slice(p.length + 1); break; }
  const base = KEYS_LONGEST_FIRST.find(k => body === k || body.endsWith(`-${k}`));
  let out: string | null = null;
  if (base) {
    const prefix = body === base ? '' : body.slice(0, body.length - base.length - 1);
    if (onlyModifiers(prefix)) out = `${pseudo}${body}`;
  }
  cache.set(key, out);
  return out;
}

const toValue = (v: unknown) => (v === true || v === '' ? '' : String(v));

export function splitAtomProps(props: P) {
  const atom: Record<string, string> = {};
  const rest: P = {};
  const { attrs, ...input } = props;
  for (const [key, value] of Object.entries(input)) {
    if (isEventProp(key) || key.startsWith('aria-') || key.startsWith('data-') || DOM_PROPS.has(key)) { rest[key] = value; continue; }
    if (NEVER_FORWARD.has(key)) continue;
    const name = atomName(key);
    if (!name) continue;
    if (value === false || value === null || value === undefined) continue;
    atom[name] = toValue(value);
  }
  if (attrs && typeof attrs === 'object') {
    for (const [key, value] of Object.entries(attrs as Record<string, unknown>)) {
      const name = atomName(key);
      if (!name || value === false || value === null || value === undefined) continue;
      atom[name] = toValue(value);
    }
  }
  return { atom, rest };
}

function make(defaultTag: string, defaults: Record<string, string> = {}) {
  return forwardRef<any, P>(function AtomComponent({ as: Tag = defaultTag, children, attrs, ...props }, ref) {
    const { atom: given, rest } = splitAtomProps({ ...props, attrs });
    const atom = { ...defaults, ...given }; // explicit props always beat component defaults
    if (typeof rest.onPress === 'function' && rest.onClick === undefined) rest.onClick = rest.onPress;
    delete rest.onPress;
    if (typeof rest.onChangeText === 'function' && rest.onChange === undefined) { const f = rest.onChangeText; rest.onChange = (e: any) => f(e.target.value); }
    delete rest.onChangeText;
    return createElement(Tag, { ...rest, ...atom, ref }, children);
  });
}

export const Box = make('div');
export const Row = make('div', { display: 'flex', 'flex-row': '' });
export const Stack = make('div', { display: 'flex', 'flex-col': '' });
export const Txt = make('span');
export const Badge = make('span', { 'inline-flex': '', items: 'center', rounded: 'full', px: '3', py: '1', 'font-size': 'xs', weight: 'semibold' });
export const Btn = make('button');
export const Input = make('input');
export const Select = make('select');
export const Option = make('option');
export const H1 = make('h1');
export const H2 = make('h2');
