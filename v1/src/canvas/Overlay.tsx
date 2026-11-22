import type { Rect } from '../document/types';
import type { ScreenBox, SnapLine } from './geom';
import { boxRect } from './geom';

export type Anchor = { i: number; x: number; y: number; h1?: { x: number; y: number }; h2?: { x: number; y: number }; selected: boolean; corner: boolean };
export type PenPreview = { pts: { x: number; y: number; h1?: { x: number; y: number }; h2?: { x: number; y: number } }[]; cursor: { x: number; y: number } | null; closeHot: boolean };
export type OverlayProps = {
  w: number; h: number; accent: string;
  boxes: ScreenBox[]; union: Rect | null; showHandles: boolean; canRotate: boolean; canResize: boolean;
  hover: ScreenBox | null; marquee: Rect | null; draft: Rect | null; draftKind: string | null;
  altMeasure?: boolean;
  snap: SnapLine[]; guides: { axis: 'x' | 'y'; pos: number; index: number }[]; showGuides: boolean;
  grid: { step: number; ox: number; oy: number } | null;
  anchors: Anchor[]; pen: PenPreview | null; pencil: { x: number; y: number }[] | null;
  enterBox: ScreenBox | null; sizeLabel: string | null; page: Rect | null;
  onHandle: (handle: string, e: React.PointerEvent) => void; onAnchor: (i: number, which: 'a' | 'h1' | 'h2', e: React.PointerEvent) => void;
  onGuide: (index: number, e: React.PointerEvent) => void;
};

const HANDLES: { id: string; fx: number; fy: number; cursor: string }[] = [
  { id: 'nw', fx: 0, fy: 0, cursor: 'nwse-resize' }, { id: 'n', fx: 0.5, fy: 0, cursor: 'ns-resize' }, { id: 'ne', fx: 1, fy: 0, cursor: 'nesw-resize' },
  { id: 'e', fx: 1, fy: 0.5, cursor: 'ew-resize' }, { id: 'se', fx: 1, fy: 1, cursor: 'nwse-resize' }, { id: 's', fx: 0.5, fy: 1, cursor: 'ns-resize' },
  { id: 'sw', fx: 0, fy: 1, cursor: 'nesw-resize' }, { id: 'w', fx: 0, fy: 0.5, cursor: 'ew-resize' },
];

export function Overlay(p: OverlayProps) {
  const single = p.boxes.length === 1 ? p.boxes[0] : null;
  const frame = single ? boxRect(single) : p.union;
  const A = p.accent;
  const handleBox = (r: Rect) => (
    <>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={A} strokeWidth="1.5" pointerEvents="none" />
      {p.showHandles && p.canResize && HANDLES.map(h => (
        <rect key={h.id} x={r.x + r.w * h.fx - 5} y={r.y + r.h * h.fy - 5} width="10" height="10" rx="2" fill="#ffffff" stroke={A} strokeWidth="1.5" cursor={h.cursor} pointerEvents="all" onPointerDown={e => p.onHandle(h.id, e)} />
      ))}
      {p.showHandles && p.canRotate && (
        <>
          <line x1={r.x + r.w / 2} y1={r.y} x2={r.x + r.w / 2} y2={r.y - 22} stroke={A} strokeWidth="1.5" pointerEvents="none" />
          <circle cx={r.x + r.w / 2} cy={r.y - 28} r="6" fill="#ffffff" stroke={A} strokeWidth="1.5" cursor="grab" pointerEvents="all" onPointerDown={e => p.onHandle('rotate', e)} />
        </>
      )}
    </>
  );
  return (
    <svg width={p.w} height={p.h} viewBox={`0 0 ${p.w} ${p.h}`} pointerEvents="none" aria-hidden="true">
      {p.grid && (
        <>
          <defs><pattern id="aa-grid" width={p.grid.step} height={p.grid.step} patternUnits="userSpaceOnUse" x={p.grid.ox} y={p.grid.oy}><path d={`M ${p.grid.step} 0 L 0 0 0 ${p.grid.step}`} fill="none" stroke={A} strokeWidth="0.5" opacity="0.35" /></pattern></defs>
          {p.page && <rect x={p.page.x} y={p.page.y} width={p.page.w} height={p.page.h} fill="url(#aa-grid)" />}
        </>
      )}
      {p.showGuides && p.guides.map(g => (
        <g key={g.index}>
          {g.axis === 'x' ? <line x1={g.pos} y1="0" x2={g.pos} y2={p.h} stroke="#06b6d4" strokeWidth="1" /> : <line x1="0" y1={g.pos} x2={p.w} y2={g.pos} stroke="#06b6d4" strokeWidth="1" />}
          {g.axis === 'x' ? <rect x={g.pos - 3} y="0" width="6" height={p.h} fill="transparent" cursor="ew-resize" pointerEvents="all" onPointerDown={e => p.onGuide(g.index, e)} /> : <rect x="0" y={g.pos - 3} width={p.w} height="6" fill="transparent" cursor="ns-resize" pointerEvents="all" onPointerDown={e => p.onGuide(g.index, e)} />}
        </g>
      ))}
      {p.enterBox && <g transform={`rotate(${p.enterBox.rot} ${p.enterBox.cx} ${p.enterBox.cy})`}><rect x={p.enterBox.cx - p.enterBox.w / 2} y={p.enterBox.cy - p.enterBox.h / 2} width={p.enterBox.w} height={p.enterBox.h} fill="none" stroke={A} strokeWidth="1" strokeDasharray="6 4" opacity="0.7" /></g>}
      {p.hover && !p.boxes.some(b => Math.abs(b.cx - p.hover!.cx) < 0.5 && Math.abs(b.cy - p.hover!.cy) < 0.5 && Math.abs(b.w - p.hover!.w) < 0.5) && (
        <g transform={`rotate(${p.hover.rot} ${p.hover.cx} ${p.hover.cy})`}><rect x={p.hover.cx - p.hover.w / 2} y={p.hover.cy - p.hover.h / 2} width={p.hover.w} height={p.hover.h} fill="none" stroke={A} strokeWidth="1.5" opacity="0.6" /></g>
      )}
      {p.altMeasure && p.hover && p.boxes[0] && <AltDistances a={boxRect(p.hover)} b={boxRect(p.boxes[0])} accent={A} />}
      {p.boxes.length > 1 && p.boxes.map((b, i) => <g key={i} transform={`rotate(${b.rot} ${b.cx} ${b.cy})`}><rect x={b.cx - b.w / 2} y={b.cy - b.h / 2} width={b.w} height={b.h} fill="none" stroke={A} strokeWidth="1" strokeDasharray="4 3" /></g>)}
      {frame && (single ? <g transform={`rotate(${single.rot} ${single.cx} ${single.cy})`}>{handleBox(frame)}</g> : handleBox(frame))}
      {frame && p.sizeLabel && <g pointerEvents="none"><rect x={frame.x + frame.w / 2 - 38} y={frame.y + frame.h + 10} width="76" height="18" rx="4" fill={A} /><text x={frame.x + frame.w / 2} y={frame.y + frame.h + 23} textAnchor="middle" fontSize="11" fontFamily="system-ui" fill="#fff">{p.sizeLabel}</text></g>}
      {p.snap.map((l, i) => l.axis === 'x' ? <line key={i} x1={l.pos} y1={l.from} x2={l.pos} y2={l.to} stroke="#f43f5e" strokeWidth="1" /> : <line key={i} x1={l.from} y1={l.pos} x2={l.to} y2={l.pos} stroke="#f43f5e" strokeWidth="1" />)}
      {p.anchors.map(a => (
        <g key={a.i}>
          {a.h1 && <><line x1={a.x} y1={a.y} x2={a.h1.x} y2={a.h1.y} stroke={A} strokeWidth="1" pointerEvents="none" /><circle cx={a.h1.x} cy={a.h1.y} r="4" fill="#fff" stroke={A} strokeWidth="1.5" cursor="move" pointerEvents="all" onPointerDown={e => p.onAnchor(a.i, 'h1', e)} /></>}
          {a.h2 && <><line x1={a.x} y1={a.y} x2={a.h2.x} y2={a.h2.y} stroke={A} strokeWidth="1" pointerEvents="none" /><circle cx={a.h2.x} cy={a.h2.y} r="4" fill="#fff" stroke={A} strokeWidth="1.5" cursor="move" pointerEvents="all" onPointerDown={e => p.onAnchor(a.i, 'h2', e)} /></>}
          {a.corner
            ? <rect x={a.x - 5} y={a.y - 5} width="10" height="10" fill={a.selected ? A : '#fff'} stroke={A} strokeWidth="1.5" cursor="move" pointerEvents="all" onPointerDown={e => p.onAnchor(a.i, 'a', e)} />
            : <circle cx={a.x} cy={a.y} r="5.5" fill={a.selected ? A : '#fff'} stroke={A} strokeWidth="1.5" cursor="move" pointerEvents="all" onPointerDown={e => p.onAnchor(a.i, 'a', e)} />}
        </g>
      ))}
      {p.pen && (
        <g pointerEvents="none">
          {p.pen.pts.length > 0 && <path d={penD(p.pen)} fill="none" stroke={A} strokeWidth="2" />}
          {p.pen.pts.map((q, i) => <g key={i}>{q.h2 && <line x1={q.x} y1={q.y} x2={q.h2.x} y2={q.h2.y} stroke={A} strokeWidth="1" />}{q.h1 && <line x1={q.x} y1={q.y} x2={q.h1.x} y2={q.h1.y} stroke={A} strokeWidth="1" />}<rect x={q.x - 4} y={q.y - 4} width="8" height="8" fill={i === 0 && p.pen!.closeHot ? A : '#fff'} stroke={A} strokeWidth="1.5" /></g>)}
        </g>
      )}
      {p.pencil && p.pencil.length > 1 && <polyline points={p.pencil.map(q => `${q.x},${q.y}`).join(' ')} fill="none" stroke={A} strokeWidth="2" pointerEvents="none" />}
      {p.draft && (p.draftKind === 'ellipse'
        ? <ellipse cx={p.draft.x + p.draft.w / 2} cy={p.draft.y + p.draft.h / 2} rx={p.draft.w / 2} ry={p.draft.h / 2} fill={A} fillOpacity="0.12" stroke={A} strokeWidth="1.5" />
        : p.draftKind === 'line'
          ? null
          : <rect x={p.draft.x} y={p.draft.y} width={p.draft.w} height={p.draft.h} fill={A} fillOpacity="0.12" stroke={A} strokeWidth="1.5" strokeDasharray={p.draftKind === 'marquee' ? '4 3' : undefined} />)}
      {p.marquee && <rect x={p.marquee.x} y={p.marquee.y} width={p.marquee.w} height={p.marquee.h} fill={A} fillOpacity="0.08" stroke={A} strokeWidth="1" strokeDasharray="4 3" />}
    </svg>
  );
}

function AltDistances({a,b,accent}:{a:Rect;b:Rect;accent:string}) {
  if(Math.abs(a.x-b.x)<1&&Math.abs(a.y-b.y)<1)return null;
  const ax=a.x+a.w/2,ay=a.y+a.h/2,bx=b.x+b.w/2,by=b.y+b.h/2;
  const x1=a.x+a.w<b.x?a.x+a.w:a.x>b.x+b.w?a.x:b.x+(Math.max(a.y,b.y)+Math.min(a.y+a.h,b.y+b.h))/2;
  const x2=a.x+a.w<b.x?b.x:a.x>b.x+b.w?b.x+b.w:x1;
  const gy=Math.max(0,Math.max(a.y,b.y)-Math.min(a.y+a.h,b.y+b.h));
  const gx=Math.max(0,Math.max(a.x,b.x)-Math.min(a.x+a.w,b.x+b.w));
  const y1=a.y+a.h<b.y?a.y+a.h:a.y>b.y+b.h?a.y:b.y+(Math.max(a.x,b.x)+Math.min(a.x+a.w,b.x+b.w))/2;
  const y2=a.y+a.h<b.y?b.y:a.y>b.y+b.h?b.y+b.h:y1;
  const label=(x:number,y:number,value:number,key:string)=><g key={key} pointerEvents="none"><rect x={x-29} y={y-9} width="58" height="18" rx="4" fill={accent}/><text x={x} y={y+4} textAnchor="middle" fontSize="10" fontFamily="system-ui" fill="#fff">{Math.round(value)} px</text></g>;
  return <g pointerEvents="none"><line x1={x1} y1={ay} x2={x2} y2={ay} stroke={accent} strokeWidth="1" strokeDasharray="3 2"/><line x1={ax} y1={y1} x2={ax} y2={y2} stroke={accent} strokeWidth="1" strokeDasharray="3 2"/>{label((x1+x2)/2,ay-11,gx,'x')}{label(ax+32,(y1+y2)/2,gy,'y')}</g>;
}

function penD(pen: PenPreview): string {
  const pts = pen.pts; if (!pts.length) return '';
  let d = `M${pts[0].x} ${pts[0].y}`;
  const seg = (a: typeof pts[0], b: { x: number; y: number; h1?: { x: number; y: number } }) => (a.h2 || b.h1 ? ` C${(a.h2 || a).x} ${(a.h2 || a).y} ${(b.h1 || b).x} ${(b.h1 || b).y} ${b.x} ${b.y}` : ` L${b.x} ${b.y}`);
  for (let i = 1; i < pts.length; i += 1) d += seg(pts[i - 1], pts[i]);
  if (pen.cursor) d += seg(pts[pts.length - 1], pen.cursor);
  return d;
}
