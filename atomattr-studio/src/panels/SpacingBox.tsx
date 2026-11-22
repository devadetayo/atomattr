import { useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Row, Txt } from 'atomattr/react';
import type { Style } from '../document/types';
import { NumField } from '../components/ui';
import { T } from '../theme';

/* Padding or margin as a small box diagram: top above, bottom below, left and right at the sides, so there is never a
   doubt which side is which. Setting one side keeps the other three exactly as they were. */

type Side = 'T' | 'R' | 'B' | 'L';
const SIDES: Side[] = ['T', 'R', 'B', 'L'];
const NAME: Record<Side, string> = { T: 'top', R: 'right', B: 'bottom', L: 'left' };
const n = (v: unknown) => (typeof v === 'number' ? v : undefined);

export const readSpacing = (s: Style, kind: 'padding' | 'margin', side: Side): number => {
  const x = s as Record<string, unknown>; const vert = side === 'T' || side === 'B';
  if (kind === 'padding') return n(x[`pad${side}`]) ?? n(x[vert ? 'padY' : 'padX']) ?? n(x.pad) ?? 0;
  return n(x[`margin${side}`]) ?? n(x[`m${side.toLowerCase()}`]) ?? n(x[vert ? 'my' : 'mx']) ?? n(x.m) ?? 0;
};

/** Everything needed to write one side while keeping the other three. */
export function spacingPatch(style: Style, kind: 'padding' | 'margin', side: Side, v: number): Style {
  const all = Object.fromEntries(SIDES.map(sd => [sd, sd === side ? v : readSpacing(style, kind, sd)])) as Record<Side, number>;
  return (kind === 'padding'
    ? { padT: all.T, padR: all.R, padB: all.B, padL: all.L, pad: undefined, padX: undefined, padY: undefined }
    : { marginT: all.T, marginR: all.R, marginB: all.B, marginL: all.L, m: undefined, mx: undefined, my: undefined, mt: undefined, mr: undefined, mb: undefined, ml: undefined }) as Style;
}

export function SpacingBox({ kind, style, put }: { kind: 'padding' | 'margin'; style: Style; put: (p: Style) => void }) {
  const set = (side: Side, v: number) => put(spacingPatch(style, kind, side, v));
  const field = (side: Side) => <NumField title={`${kind === 'padding' ? 'Padding' : 'Margin'} ${NAME[side]}`} value={readSpacing(style, kind, side)} min={0} onCommit={v => set(side, v)} w="100%" />;
  const tint = kind === 'margin' ? { bg: 'orange-500/10', 'dark-bg': 'orange-500/15' } : { bg: 'primary/8', 'dark-bg': 'primary/15' };
  return (
    <Box display="flex" flex-col gap="1">
      <Txt fontSize="sm" fontWeight="600" m="0" {...T.label}>{kind === 'padding' ? 'Padding' : 'Margin'}</Txt>
      <Box p="2" rounded="14px" {...tint} display="grid" grid-cols="3" gap="2" items="center" role="group" aria-label={kind === 'padding' ? 'Padding on each side' : 'Margin on each side'}>
        <Box /><Box>{field('T')}</Box><Box />
        <Box>{field('L')}</Box>
        <Row items="center" justify="center" h="100%" min-h="30px" rounded="8px" bg="white" dark-bg="gray-900/60" shadow="sm"><Txt fontSize="sm" m="0" {...T.muted}>{kind === 'padding' ? 'content' : 'layer'}</Txt></Row>
        <Box>{field('R')}</Box>
        <Box /><Box>{field('B')}</Box><Box />
      </Box>
    </Box>
  );
}

/** The classic two-by-two fields: Top and Right, then Bottom and Left. */
export function SpacingFields({ kind, style, put }: { kind: 'padding' | 'margin'; style: Style; put: (p: Style) => void }) {
  const f = (side: Side, label: string) => <NumField label={label} value={readSpacing(style, kind, side)} min={0} onCommit={v => put(spacingPatch(style, kind, side, v))} />;
  return (
    <Box display="flex" flex-col gap="2">
      <Box><Txt fontSize="sm" fontWeight="600" m="0" {...T.label}>{kind === 'padding' ? 'Padding' : 'Margin'}</Txt></Box>
      <Row gap="2">{f('T', 'Top')}{f('R', 'Right')}</Row>
      <Row gap="2">{f('B', 'Bottom')}{f('L', 'Left')}</Row>
    </Box>
  );
}

/* ---------- Chrome-style box model for the Inspect panel ---------- */

const BORDER_KEYS: Record<Side, string> = { T: 'borderT', R: 'borderR', B: 'borderB', L: 'borderL' };
const readBorder = (s: Style, side: Side): number => {
  const x = s as Record<string, unknown>; if (!s.stroke && n(x.strokeWidth) === undefined && n(x[BORDER_KEYS[side]]) === undefined) return 0;
  const axis = side === 'T' || side === 'B' ? 'borderY' : 'borderX';
  return n(x[BORDER_KEYS[side]]) ?? n(x[axis]) ?? n(x.strokeWidth) ?? 0;
};

function Cell({ value, label, onCommit }: { value: number | string; label: string; onCommit?: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const done = () => { if (draft === null) return; const v = parseFloat(draft); setDraft(null); if (onCommit && Number.isFinite(v) && v >= 0 && v !== value) onCommit(Math.round(v * 100) / 100); };
  if (!onCommit) return <Txt display="block" fontSize="sm" m="0" text-align="center" min-w="28px" text="gray-800">{value}</Txt>;
  return <Box as="input" aria-label={label} title={label} value={draft ?? String(value)} inputMode="decimal" spellCheck={false}
    onFocus={(e: any) => e.target.select()} onChange={(e: any) => setDraft(e.target.value)} onBlur={done} onKeyDown={(e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter') (e.target as HTMLElement).blur(); if (e.key === 'Escape') { setDraft(null); (e.target as HTMLElement).blur(); } }}
    w="24px" h="20px" p="0" m="0" border="1px solid" border-color="transparent" bg="white/45" outline="none" text-align="center" fontSize="sm" fontWeight="600" text="gray-900" hover-bg="white/80" hover-border-color="black/15" focus-bg="white" focus-border-color="primary" rounded="6px" />;
}

/** Margin, border, padding and content as nested boxes, like the browser's inspector. Numbers are editable. */
export function BoxModel({ style, put }: { style: Style; put: (p: Style) => void }) {
  const layer = (name: string, bg: string, edge: string, cells: Record<Side, ReactNode>, inner: ReactNode, dashed = true) => (
    <Box p="4px" rounded="12px" bg={bg} border={dashed ? '1.5px dashed' : '1.5px solid'} border-color={edge}>
      <Txt display="block" fontSize="sm" fontWeight="700" m="0" mb="4px" tracking="0.08em" uppercase text="gray-800" leading="tight" style={{ fontSize: 10 }}>{name}</Txt>
      <Box display="grid" gap="2px" items="center" justify-items="center" {...{ 'grid-cols': '24px minmax(0,1fr) 24px' }}>
        <Box /><Box>{cells.T}</Box><Box />
        <Box>{cells.L}</Box><Box w="100%" min-w="0">{inner}</Box><Box>{cells.R}</Box>
        <Box /><Box>{cells.B}</Box><Box />
      </Box>
    </Box>
  );
  const sp = (kind: 'margin' | 'padding') => Object.fromEntries(SIDES.map(sd => [sd, <Cell key={sd} label={`${kind === 'margin' ? 'Margin' : 'Padding'} ${NAME[sd]}`} value={readSpacing(style, kind, sd)} onCommit={v => put(spacingPatch(style, kind, sd, v))} />])) as Record<Side, ReactNode>;
  const bd = Object.fromEntries(SIDES.map(sd => [sd, <Cell key={sd} label={`Border ${NAME[sd]}`} value={readBorder(style, sd)} onCommit={v => put({ [BORDER_KEYS[sd]]: v, ...(style.stroke ? {} : { stroke: '#111827' }) } as Style)} />])) as Record<Side, ReactNode>;
  const dim = (v: unknown) => (typeof v === 'number' ? Math.round(v) : v === 'fill' ? '100%' : 'auto');
  const content = <Box py="12px" px="4px" rounded="8px" w="100%" bg="rgba(120,176,196,0.95)" border="1.5px solid" border-color="rgba(70,120,140,0.9)" display="flex" items="center" justify="center" min-w="64px" overflow="hidden"><Box textAlign="center" leading="tight"><Txt display="block" fontSize="sm" fontWeight="700" m="0" text="gray-900">{dim(style.w)}</Txt><Txt display="block" fontSize="sm" m="0" text="gray-800" style={{ fontSize: 10 }}>×</Txt><Txt display="block" fontSize="sm" fontWeight="700" m="0" text="gray-900">{dim(style.h)}</Txt></Box></Box>;
  return (
    <Box role="group" aria-label="Box model" py="1" min-w="0" overflow="hidden">
      {layer('margin', 'rgba(247,200,150,0.9)', 'rgba(190,120,50,0.75)', sp('margin'),
        layer('border', 'rgba(250,224,150,0.95)', 'rgba(170,140,40,0.85)', bd,
          layer('padding', 'rgba(196,214,140,0.95)', 'rgba(105,135,50,0.8)', sp('padding'), content), false))}
    </Box>
  );
}
