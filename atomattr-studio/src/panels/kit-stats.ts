import { useSyncExternalStore } from 'react';

/**
 * View and save counters for library cards.
 * These are per-browser for now (localStorage): "views" counts the times a card has been looked at (once per session),
 * "saves" counts saves. Everything goes through this one module, so a server-backed count can replace it later without touching the UI.
 */
type Stat = { v: number; s: number };
const KEY = 'atomattr.studio.kitStats';
const read = (): Record<string, Stat> => { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch { return {}; } };
let data = read(); let version = 0; const subs = new Set<() => void>(); const seen = new Set<string>();
const emit = () => { version++; subs.forEach(f => f()); };
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* counters last for this session */ } };
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

/** Re-render when any counter changes. */
export const useKitStats = () => useSyncExternalStore(subscribe, () => version, () => 0);
export const statOf = (name: string): Stat => data[name] || { v: 0, s: 0 };
/** Counts a card as viewed, at most once per session. */
export const noteView = (name: string) => { if (seen.has(name)) return; seen.add(name); const c = statOf(name); data = { ...data, [name]: { ...c, v: c.v + 1 } }; persist(); emit(); };
/** Saving adds one to the card's counter; un-saving takes it back. */
export const noteSave = (name: string, on: boolean) => { const c = statOf(name); data = { ...data, [name]: { ...c, s: Math.max(0, c.s + (on ? 1 : -1)) } }; persist(); emit(); };

/** 1,234 → 1.2K; 14,000 → 14K; 2,100,000 → 2.1M. */
export const compact = (n: number) => n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(n);
