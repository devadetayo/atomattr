import { Box } from 'atomattr/react';
import type { View } from '../state/store';

const STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
export const RULER = 20;

/** Rulers in page units. Ticks are chosen from the zoom so labels never crowd; drag from a ruler to make a guide. */
export function Rulers({ w, h, view, cursor, dark, onStart }: { w: number; h: number; view: View; cursor: { x: number; y: number } | null; dark: boolean; onStart: (axis: 'x' | 'y', e: React.PointerEvent) => void }) {
  const step = STEPS.find(s => s * view.zoom >= 60) ?? 5000; const minor = step / 5;
  const bg = dark ? '#111827' : '#f9fafb'; const fg = dark ? '#9ca3af' : '#6b7280'; const line = dark ? '#374151' : '#d1d5db';
  const ticks = (len: number, offset: number) => {
    const out: { p: number; major: boolean; label: number }[] = [];
    const start = Math.floor(-offset / view.zoom / minor) * minor; const end = (len - offset) / view.zoom;
    for (let v = start; v <= end; v += minor) out.push({ p: offset + v * view.zoom, major: Math.abs(v % step) < 0.001, label: v });
    return out;
  };
  const xt = ticks(w, view.px); const yt = ticks(h, view.py);
  return (
    <>
      <Box position="absolute" top="0" left={`${RULER}px`} w={`${Math.max(0, w - RULER)}px`} h={`${RULER}px`} z="20" cursor="s-resize" title="Drag down to create a guide" onPointerDown={(e: React.PointerEvent) => onStart('y', e)}>
        <svg width={Math.max(0, w - RULER)} height={RULER}>
          <rect width="100%" height={RULER} fill={bg} /><line x1="0" y1={RULER - 0.5} x2={w} y2={RULER - 0.5} stroke={line} />
          {xt.filter(t => t.p >= RULER).map(t => <g key={t.label}><line x1={t.p - RULER} y1={t.major ? 8 : 14} x2={t.p - RULER} y2={RULER} stroke={fg} strokeWidth="0.8" />{t.major && <text x={t.p - RULER + 3} y="10" fontSize="9" fontFamily="system-ui" fill={fg}>{Math.round(t.label)}</text>}</g>)}
          {cursor && <line x1={cursor.x - RULER} y1="0" x2={cursor.x - RULER} y2={RULER} stroke="#6366f1" strokeWidth="1.5" />}
        </svg>
      </Box>
      <Box position="absolute" top={`${RULER}px`} left="0" w={`${RULER}px`} h={`${Math.max(0, h - RULER)}px`} z="20" cursor="e-resize" title="Drag right to create a guide" onPointerDown={(e: React.PointerEvent) => onStart('x', e)}>
        <svg width={RULER} height={Math.max(0, h - RULER)}>
          <rect width={RULER} height="100%" fill={bg} /><line x1={RULER - 0.5} y1="0" x2={RULER - 0.5} y2={h} stroke={line} />
          {yt.filter(t => t.p >= RULER).map(t => <g key={t.label}><line x1={t.major ? 8 : 14} y1={t.p - RULER} x2={RULER} y2={t.p - RULER} stroke={fg} strokeWidth="0.8" />{t.major && <text x="3" y={t.p - RULER - 3} fontSize="9" fontFamily="system-ui" fill={fg} transform={`rotate(-90 3 ${t.p - RULER - 3})`}>{Math.round(t.label)}</text>}</g>)}
          {cursor && <line x1="0" y1={cursor.y - RULER} x2={RULER} y2={cursor.y - RULER} stroke="#6366f1" strokeWidth="1.5" />}
        </svg>
      </Box>
      <Box position="absolute" top="0" left="0" w={`${RULER}px`} h={`${RULER}px`} z="21" bg="gray-50" dark-bg="gray-900" border-r="1px solid" border-b="1px solid" border-color="gray-300" dark-border-color="gray-700" />
    </>
  );
}
