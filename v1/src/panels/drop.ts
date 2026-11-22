import type { Node } from '../document/types';
import { makeImage } from '../document/factory';
import * as S from '../state/store';
import { SHAPES, shapeNode } from './shapes';

export function dropPayload(p: { asset: string; shape: string; comp: string }, cx: number, cy: number, containerAt: (x: number, y: number) => Node, toLocal: (n: Node, x: number, y: number) => { x: number; y: number; k: number }) {
  const parent = containerAt(cx, cy); const at = toLocal(parent, cx, cy); let node: Node | null = null;
  if (p.comp) { S.insertComponent(p.comp,parent.id,at.x,at.y,at.k); return; }
  if (p.asset) { const a = S.getState().project?.assets.find(x => x.id === p.asset); if (a) { node = makeImage(0, 0, 320, 220, a.dataUrl, a.id); node.name = a.name; } }
  if (p.shape) { const d = SHAPES.find(x => x.id === p.shape); if (d) node = shapeNode(d); }
  if (!node) return; node.style.x = at.x; node.style.y = at.y; if (typeof node.style.w === 'number') node.style.w *= at.k; S.addNode(node, parent.id);
}
