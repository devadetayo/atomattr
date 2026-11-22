import type { Project } from '../document/types';

/**
 * Snapshot history. Project objects are immutable and share unchanged branches, so keeping 200 of them is cheap.
 * A transaction (drag, resize, typing burst) records one entry no matter how many intermediate updates it made.
 */
export type History = { past: Project[]; future: Project[]; open: boolean };
export const emptyHistory = (): History => ({ past: [], future: [], open: false });
const LIMIT = 200;

export function commit(h: History, before: Project): History {
  if (h.open) return h;
  return { past: [...h.past, before].slice(-LIMIT), future: [], open: false };
}
export function begin(h: History, before: Project): History {
  return h.open ? h : { past: [...h.past, before].slice(-LIMIT), future: [], open: true };
}
export const end = (h: History): History => (h.open ? { ...h, open: false } : h);

export function undo(h: History, current: Project): { h: History; project: Project } | null {
  if (!h.past.length) return null;
  const project = h.past[h.past.length - 1];
  return { h: { past: h.past.slice(0, -1), future: [current, ...h.future], open: false }, project };
}
export function redo(h: History, current: Project): { h: History; project: Project } | null {
  if (!h.future.length) return null;
  const [project, ...rest] = h.future;
  return { h: { past: [...h.past, current], future: rest, open: false }, project };
}
