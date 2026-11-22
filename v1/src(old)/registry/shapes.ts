import type { DesignKind } from '../types/project';

/**
 * Shape library. Every shape is built from the vector kinds the project model already has
 * (rect, ellipse, polygon, star, line), so it saves, exports and generates code like any other object.
 * For rect, `radius` is the corner radius; for star, `radius` is the inner/outer ratio.
 */
export type ShapeDef = { id: string; label: string; kind: DesignKind; w: number; h: number; points?: number; radius?: number };

export const SHAPE_PREFIX = 'shape:';

export const SHAPES: ShapeDef[] = [
  { id: 'square', label: 'Square', kind: 'rect', w: 140, h: 140 },
  { id: 'rounded', label: 'Rounded', kind: 'rect', w: 180, h: 120, radius: 24 },
  { id: 'pill', label: 'Pill', kind: 'rect', w: 200, h: 72, radius: 36 },
  { id: 'circle', label: 'Circle', kind: 'ellipse', w: 140, h: 140 },
  { id: 'ellipse', label: 'Ellipse', kind: 'ellipse', w: 200, h: 120 },
  { id: 'triangle', label: 'Triangle', kind: 'polygon', w: 160, h: 160, points: 3 },
  { id: 'diamond', label: 'Diamond', kind: 'polygon', w: 160, h: 160, points: 4 },
  { id: 'pentagon', label: 'Pentagon', kind: 'polygon', w: 160, h: 160, points: 5 },
  { id: 'hexagon', label: 'Hexagon', kind: 'polygon', w: 160, h: 160, points: 6 },
  { id: 'octagon', label: 'Octagon', kind: 'polygon', w: 160, h: 160, points: 8 },
  { id: 'star4', label: '4-point star', kind: 'star', w: 160, h: 160, points: 4, radius: 0.38 },
  { id: 'star5', label: '5-point star', kind: 'star', w: 160, h: 160, points: 5, radius: 0.46 },
  { id: 'star6', label: '6-point star', kind: 'star', w: 160, h: 160, points: 6, radius: 0.55 },
  { id: 'star8', label: '8-point star', kind: 'star', w: 160, h: 160, points: 8, radius: 0.62 },
  { id: 'burst', label: 'Burst', kind: 'star', w: 180, h: 180, points: 14, radius: 0.8 },
  { id: 'line', label: 'Line', kind: 'line', w: 200, h: 1 },
];

/** Points of a regular polygon or star, apex up, as an SVG `points` string. */
export function ngon(count: number, star: boolean, inner: number, cx: number, cy: number, r: number) {
  const total = star ? Math.max(3, count) * 2 : Math.max(3, count);
  return Array.from({ length: total }, (_, i) => {
    const radius = star && i % 2 ? r * inner : r;
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    return `${Math.round((cx + Math.cos(angle) * radius) * 100) / 100},${Math.round((cy + Math.sin(angle) * radius) * 100) / 100}`;
  }).join(' ');
}
