import type { Node, Project, ScaleKind, ScaleToken, StyleClass } from '../document/types';
import { applyClass, applyToken, captureClass, defaultScale, detachClass, dropClass, dropToken, syncClass, syncToken, unlinkToken, mapTree, kindOfField } from '../document/scales';
import { uid } from '../document/tree';
import { getState, setProject, toast, selNodes } from './store';

type Field = Parameters<typeof applyToken>[1];
const proj = (): Project | null => getState().project;
/** Applies a tree rewrite to every page and component master as one undoable change. */
const rewrite = (p: Project, fn: (root: Node) => Node, patch: Partial<Project>) =>
  setProject({ ...p, ...patch, pages: p.pages.map(pg => ({ ...pg, root: fn(pg.root) })), components: p.components.map(c => ({ ...c, node: fn(c.node) })) });
const onSelection = (fn: (n: Node) => Node) => { const p = proj(); if (!p) return; const ids = new Set(getState().sel); rewrite(p, r => mapTree(r, n => (ids.has(n.id) ? fn(n) : n)), {}); };

/* ---------- spacing, radius, shadow tokens ---------- */
export const scaleOf = (p: Project) => p.scale || [];
export function addDefaultScale() { const p = proj(); if (p && !scaleOf(p).length) setProject({ ...p, scale: defaultScale() }); }
export function addScaleToken(kind: ScaleKind) {
  const p = proj(); if (!p) return; const list = scaleOf(p);
  const t: ScaleToken = { id: uid(), kind, name: `custom-${list.filter(x => x.kind === kind).length + 1}`, value: kind === 'shadow' ? '0px 4px 12px rgba(0,0,0,0.15)' : kind === 'radius' ? 8 : 16 };
  setProject({ ...p, scale: [...list, t] });
}
export function updateScaleToken(t: ScaleToken) { const p = proj(); if (!p) return; rewrite(p, r => syncToken(r, t), { scale: scaleOf(p).map(x => (x.id === t.id ? t : x)) }); }
export function deleteScaleToken(id: string) { const p = proj(); if (!p) return; rewrite(p, r => dropToken(r, id), { scale: scaleOf(p).filter(x => x.id !== id) }); }
export function applyScaleToken(field: Field, tokenId: string) {
  const p = proj(); if (!p) return;
  if (!tokenId) { onSelection(n => unlinkToken(n, field)); return; }
  const t = scaleOf(p).find(x => x.id === tokenId); if (!t || t.kind !== kindOfField(field)) return;
  onSelection(n => applyToken(n, field, t));
}

/* ---------- style classes ---------- */
export const classesOf = (p: Project) => p.classes || [];
export function createClassFromSelection(name: string) {
  const p = proj(); const n = selNodes()[0]; if (!p || !n) { toast('Select an object first.'); return; }
  const c = captureClass(n, name.trim() || 'Style', uid());
  setProject({ ...p, classes: [...classesOf(p), c], pages: p.pages.map(pg => ({ ...pg, root: mapTree(pg.root, x => (x.id === n.id ? applyClass(x, c) : x)) })) });
}
export function applyStyleClass(id: string) {
  const p = proj(); if (!p) return; const c = classesOf(p).find(x => x.id === id);
  onSelection(n => (c ? applyClass(n, c) : detachClass(n)));
}
export const renameClass = (id: string, name: string) => { const p = proj(); if (p) setProject({ ...p, classes: classesOf(p).map(c => (c.id === id ? { ...c, name: name.trim() || c.name } : c)) }); };
/** Rewrites a class from the look of the selected object and pushes it to everything that follows it. */
export function updateClassFromSelection(id: string) {
  const p = proj(); const n = selNodes()[0]; if (!p || !n) { toast('Select an object first.'); return; }
  const old = classesOf(p).find(c => c.id === id); if (!old) return;
  const c: StyleClass = captureClass(n, old.name, id);
  rewrite(p, r => syncClass(r, c), { classes: classesOf(p).map(x => (x.id === id ? c : x)) });
}
export function deleteClass(id: string) { const p = proj(); if (p) rewrite(p, r => dropClass(r, id), { classes: classesOf(p).filter(c => c.id !== id) }); }
