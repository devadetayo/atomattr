import type { Node } from '../document/types';
/** The library block being dragged onto the canvas (the drag event can only carry text, so the builder waits here). */
let pending: (() => Node) | null = null;
export const setKitDrag = (fn: (() => Node) | null) => { pending = fn; };
export const takeKitDrag = () => { const f = pending; pending = null; return f; };
