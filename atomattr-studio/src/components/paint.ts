import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { Theme } from './highlight';

/* Does atomattr understand raw hex colours (text="#123456")? Tested once by SyntaxCode; null = not known yet. */
let hexOk: boolean | null = null;
const subs = new Set<() => void>();
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export function reportHex(ok: boolean) {
  if (hexOk !== null) return;
  hexOk = ok;
  if (!ok) console.warn('[Studio code panel] atomattr did not apply a hex colour (text="#123456"), so token colours use inline style instead.');
  subs.forEach(f => f());
}
export const useHexOk = () => useSyncExternalStore(subscribe, () => hexOk, () => null);

const readDark = () => {
  const h = document.documentElement;
  const s = `${h.className} ${h.getAttribute('data-theme') ?? ''} ${h.getAttribute('data-mode') ?? ''} ${h.getAttribute('theme') ?? ''}`.toLowerCase();
  if (/\bdark\b/.test(s)) return true;
  if (/\blight\b/.test(s)) return false;
  return !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
};

function useIsDark(on: boolean) {
  const [d, setD] = useState(() => (typeof document === 'undefined' ? false : readDark()));
  useEffect(() => {
    if (!on) return;
    const upd = () => setD(readDark()); upd();
    const mo = new MutationObserver(upd); mo.observe(document.documentElement, { attributes: true });
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)'); mq?.addEventListener?.('change', upd);
    return () => { mo.disconnect(); mq?.removeEventListener?.('change', upd); };
  }, [on]);
  return d;
}

type P = Record<string, unknown>;
export type Paint = { text: (l: string, d?: string) => P; bg: (l: string, d?: string) => P; surface: (t: Theme) => P };

/** Props that colour an element: atomattr attributes when hex works, inline style when it does not. */
export function usePaint(): Paint {
  const ok = useHexOk();
  const inline = ok === false;
  const dark = useIsDark(inline);
  return useMemo<Paint>(() => {
    const pick = (l: string, d: string) => (dark ? d : l);
    return {
      text: (l, d = l) => (inline ? { style: { color: pick(l, d) } } : { text: l, 'dark-text': d }),
      bg: (l, d = l) => (inline ? { style: { background: pick(l, d) } } : { bg: l, 'dark-bg': d }),
      surface: t => (inline
        ? { style: { background: pick(t.light.bg, t.dark.bg), color: pick(t.light.fg, t.dark.fg) } }
        : { bg: t.light.bg, 'dark-bg': t.dark.bg, text: t.light.fg, 'dark-text': t.dark.fg }),
    };
  }, [inline, dark]);
}