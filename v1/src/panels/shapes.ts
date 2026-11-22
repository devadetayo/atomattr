import type { Node } from '../document/types';
import { makePath, makeShape } from '../document/factory';

export type ShapeDef = { id: string; name: string; kind?: 'rect' | 'rounded' | 'ellipse'; pts?: [number, number][] };
const reg = (n: number, rot = -90, r = 0.5): [number, number][] => Array.from({ length: n }, (_, i) => { const a = ((rot + (360 / n) * i) * Math.PI) / 180; return [0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]; });
const star = (n: number, inner: number): [number, number][] => Array.from({ length: n * 2 }, (_, i) => { const a = (-90 + (180 / n) * i) * Math.PI / 180; const r = i % 2 ? 0.5 * inner : 0.5; return [0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]; });
export const SHAPES: ShapeDef[] = [
  { id: 'rect', name: 'Rectangle', kind: 'rect' }, { id: 'rounded', name: 'Rounded', kind: 'rounded' }, { id: 'ellipse', name: 'Ellipse', kind: 'ellipse' },
  { id: 'tri', name: 'Triangle', pts: [[0.5, 0], [1, 1], [0, 1]] }, { id: 'right', name: 'Right triangle', pts: [[0, 0], [1, 1], [0, 1]] }, { id: 'diamond', name: 'Diamond', pts: reg(4) },
  { id: 'pent', name: 'Pentagon', pts: reg(5) }, { id: 'hex', name: 'Hexagon', pts: reg(6, 0) }, { id: 'oct', name: 'Octagon', pts: reg(8, -67.5) },
  { id: 'star4', name: '4-point star', pts: star(4, 0.4) }, { id: 'star5', name: '5-point star', pts: star(5, 0.45) }, { id: 'star6', name: '6-point star', pts: star(6, 0.55) }, { id: 'star8', name: '8-point star', pts: star(8, 0.7) },
  { id: 'arrow', name: 'Arrow', pts: [[0, 0.35], [0.6, 0.35], [0.6, 0.1], [1, 0.5], [0.6, 0.9], [0.6, 0.65], [0, 0.65]] },
  { id: 'chev', name: 'Chevron', pts: [[0, 0], [0.6, 0], [1, 0.5], [0.6, 1], [0, 1], [0.4, 0.5]] },
  { id: 'cross', name: 'Cross', pts: [[0.35, 0], [0.65, 0], [0.65, 0.35], [1, 0.35], [1, 0.65], [0.65, 0.65], [0.65, 1], [0.35, 1], [0.35, 0.65], [0, 0.65], [0, 0.35], [0.35, 0.35]] },
  { id: 'para', name: 'Parallelogram', pts: [[0.25, 0], [1, 0], [0.75, 1], [0, 1]] }, { id: 'trap', name: 'Trapezoid', pts: [[0.2, 0], [0.8, 0], [1, 1], [0, 1]] },
  { id: 'bubble', name: 'Speech bubble', pts: [[0, 0], [1, 0], [1, 0.72], [0.45, 0.72], [0.2, 1], [0.25, 0.72], [0, 0.72]] },
];
export function shapeNode(def: ShapeDef, size = 140): Node {
  if (def.kind === 'ellipse') return makeShape('ellipse', 0, 0, size, size);
  if (def.kind) { const n = makeShape('rect', 0, 0, size, size * 0.75); if (def.kind === 'rounded') { n.style.radius = 20; n.name = 'Rounded rectangle'; } return n; }
  const n = makePath(def.pts!.map(([x, y]) => ({ x: x * size, y: y * size })), true, '#4338ca', '#6366f1', 0); n.name = def.name; n.style.strokeWidth = 0; return n;
}
