import { useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import type { DesignToken, Node } from '../document/types';
import * as S from '../state/store';
import { Glyph, IconBtn, TextField } from '../components/ui';
import { ColorPicker } from '../exporters/ColorPicker';
import { parseColor } from '../document/fx';
import { T } from '../theme';
import { ToolIcon } from '../components/ToolIcons';

/* ---------- Styles panel: appearance switch, live theme preview and colour token cards ---------- */

const lum = (c: string) => {
  const p = parseColor(c); if (!p) return null;
  const f = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(p.r) + 0.7152 * f(p.g) + 0.0722 * f(p.b);
};
export const contrast = (a: string, b: string): number | null => {
  const x = lum(a); const y = lum(b); if (x === null || y === null) return null;
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const readable = (bg: string) => { const l = lum(bg); return l !== null && l > 0.45 ? '#111827' : '#ffffff'; };
const grade = (r: number) => (r >= 7 ? { t: 'AAA', ok: true } : r >= 4.5 ? { t: 'AA', ok: true } : r >= 3 ? { t: 'Large only', ok: false } : { t: 'Low', ok: false });

/** Which token each role is read against. */
const PARTNER: Record<string, string> = { text: 'background', muted: 'background', primary: 'background', accent: 'background', success: 'background', warning: 'background', danger: 'background', 'on-primary': 'primary' };

const val = (t: DesignToken, mode: 'light' | 'dark') => (mode === 'dark' ? t.dark || t.light : t.light);
const byRole = (tokens: DesignToken[], role: string) => tokens.find(t => t.role === role || t.name === role);

/** Segmented Light / Dark switch with a sliding pill. */
export function AppearanceSwitch({ value, onChange }: { value: 'light' | 'dark'; onChange: (v: 'light' | 'dark') => void }) {
  return (
    <Box position="relative" display="grid" grid-cols="2" p="3px" rounded="lg" bg="gray-900/5" dark-bg="white/6" role="group" aria-label="Page appearance">
      <Box position="absolute" top="3px" bottom="3px" left="3px" w="calc(50% - 3px)" rounded="lg" bg="white" dark-bg="gray-600" shadow="md" transition="all" duration="260" ease="out" transform={value === 'dark' ? 'translateX(100%)' : 'translateX(0)'} />
      {(['light', 'dark'] as const).map(m => (
        <Btn key={m} type="button" aria-pressed={value === m} onClick={() => onChange(m)} position="relative" z="1" h="32px" border="0" bg="transparent" cursor="pointer" display="flex" items="center" justify="center" gap="2" fontSize="sm" fontWeight="600" transition="all" duration="200"
          {...(value === m ? { text: 'gray-900', 'dark-text': 'white' } : T.label)}>
          <Glyph n={m === 'light' ? 'sun' : 'moon'} size={14} />{m === 'light' ? 'Light' : 'Dark'}
        </Btn>
      ))}
    </Box>
  );
}

/** Two small cards that show the real token values as a page would use them, light next to dark. */
export function ThemePreview({ tokens, active }: { tokens: DesignToken[]; active: 'light' | 'dark' }) {
  const pick = (role: string, mode: 'light' | 'dark', fb: string) => { const t = byRole(tokens, role); return t ? val(t, mode) : fb; };
  return (
    <Box display="grid" grid-cols="2" gap="2">
      {(['light', 'dark'] as const).map(m => {
        const bg = pick('background', m, m === 'light' ? '#ffffff' : '#0b1020'); const surface = pick('surface', m, bg); const text = pick('text', m, readable(bg));
        const muted = pick('muted', m, text); const primary = pick('primary', m, '#6366f1'); const onP = pick('on-primary', m, readable(primary)); const border = pick('border', m, muted);
        const on = active === m;
        return (
          <Box key={m} p="3" rounded="lg" border="1px solid" transition="all" duration="250" bg={bg} border-color={on ? 'primary' : border} shadow={on ? 'md' : 'none'} animate="studio-fade 250ms ease-out both">
            <Txt display="block" fontSize="sm" fontWeight="700" tracking="wider" uppercase m="0" mb="2" text={muted}>{m}</Txt>
            <Txt display="block" fontSize="sm" fontWeight="700" m="0" text={text}>Aa Heading</Txt>
            <Txt display="block" fontSize="sm" m="0" mb="2" text={muted}>Body copy sits here.</Txt>
            <Box p="2" rounded="lg" bg={surface} border="1px solid" border-color={border} mb="2"><Box h="4px" w="60%" rounded="full" bg={border} /></Box>
            <Box display="inline-flex" px="3" py="1" rounded="lg" bg={primary} text={onP} fontSize="sm" fontWeight="600">Button</Box>
          </Box>
        );
      })}
    </Box>
  );
}

function Tile({ t, mode, open, onToggle, onCopy }: { t: DesignToken; mode: 'light' | 'dark'; open: boolean; onToggle: () => void; onCopy: () => void }) {
  const c = val(t, mode); const fg = readable(c);
  return (
    <Box position="relative" flex="1" min-w="0">
      <Btn type="button" aria-expanded={open} aria-label={`${mode} value ${c}`} title={`Edit the ${mode} value`} onClick={onToggle} w="100%" h="58px" p="0" px="2" rounded="lg" border="2px solid" cursor="pointer" bg={c} display="flex" flex-col justify="between" items="start" text-align="left" transition="all" duration="180"
        {...(open ? { 'border-color': 'primary', shadow: 'md' } : { 'border-color': 'gray-200', 'dark-border-color': 'gray-700', 'hover-scale': '1.02' })}>
        <Row items="center" gap="1" py="1" text={fg} opacity="85"><Glyph n={mode === 'light' ? 'sun' : 'moon'} size={11} /><Txt as="span" fontSize="sm" fontWeight="700" tracking="wider" uppercase m="0" text={fg}>{mode}</Txt></Row>
        <Txt as="span" fontSize="sm" fontWeight="600" m="0" pb="1" text={fg}>{c.toUpperCase()}</Txt>
      </Btn>
      <Btn type="button" title="Copy value" aria-label={`Copy ${c}`} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onCopy(); }} position="absolute" top="1" right="1" w="20px" h="20px" p="0" rounded="lg" border="0" cursor="pointer" bg="transparent" display="flex" items="center" justify="center" text={fg} opacity="0" hover-opacity="100" focus-visible-opacity="100" transition="all" duration="150"><Glyph n="copy" size={12} /></Btn>
    </Box>
  );
}

export function TokenCard({ t, tokens, node }: { t: DesignToken; tokens: DesignToken[]; node?: Node }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<null | 'light' | 'dark'>(null);
  const update = (n: DesignToken) => S.setToken(n);
  const partner = PARTNER[t.role || t.name]; const other = partner ? byRole(tokens, partner) : undefined;
  const ratios = other ? (['light', 'dark'] as const).map(m => ({ m, r: contrast(val(t, m), val(other, m)) })) : [];
  const worst = ratios.map(x => x.r).filter((r): r is number => r !== null).sort((a, b) => a - b)[0];
  const copy = (v: string) => { try { navigator.clipboard?.writeText(v); S.toast(`Copied ${v.toUpperCase()}`); } catch { /* clipboard blocked */ } };
  const dot = (c: string) => <Box w="22px" h="22px" rounded="full" shrink="0" bg={c} border="1px solid" border-color="gray-900/15" dark-border-color="white/20" />;
  return (
    <Box {...T.section} display="flex" flex-col transition="all" duration="200">
      <Row items="center" gap="2" px="3" h="44px" cursor="pointer" role="button" tabIndex={0} aria-expanded={open} aria-label={`${t.name} token, ${open ? 'collapse' : 'expand'}`} onClick={() => setOpen(!open)} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}>
        <Row shrink="0" gap="0">{dot(t.light)}<Box ml="-6px">{dot(t.dark || t.light)}</Box></Row>
        <Txt fontSize="sm" fontWeight="600" m="0" flex="1" min-w="0" truncate {...T.text}>{t.name}</Txt>
        {worst !== undefined && (() => { const g = grade(worst); return <Box px="2" rounded="full" fontSize="sm" fontWeight="700" title={`Lowest contrast against ${other!.name}: ${worst.toFixed(2)}:1`} bg={g.ok ? 'green-500/15' : 'red-500/15'} text={g.ok ? 'green-700' : 'red-600'} dark-text={g.ok ? 'green-400' : 'red-400'}>{g.t}</Box>; })()}
        <Box display="flex" shrink="0" {...T.muted} transform={open ? 'rotate(90deg)' : 'none'} transition="all" duration="150"><ToolIcon n="chevron" size={14} /></Box>
      </Row>
      {open && <Box display="flex" flex-col gap="2" px="3" pb="3" animate="studio-pop-down 200ms cubic-bezier(0.2, 0.8, 0.2, 1) both">
        <Row items="center" gap="2">
          <Box flex="1" min-w="0"><TextField value={t.name} onCommit={v => update({ ...t, name: v || t.name })} /></Box>
          {t.role && t.role !== 'custom' ? <Box px="2" py="1" rounded="lg" fontSize="sm" fontWeight="700" tracking="wider" uppercase bg="gray-900/5" dark-bg="white/6" {...T.label}>{t.role}</Box> : null}
          {node ? <IconBtn icon="check" title="Apply as fill token" size={24} iconSize={13} onClick={() => S.replaceNode(node.id, n => ({ ...n, style: { ...n.style, fillToken: t.id } }))} /> : null}
          <IconBtn icon="trash" title="Delete token" size={24} iconSize={13} danger onClick={() => S.deleteToken(t.id)} />
        </Row>
        <Row gap="2">
          <Tile t={t} mode="light" open={edit === 'light'} onToggle={() => setEdit(edit === 'light' ? null : 'light')} onCopy={() => copy(t.light)} />
          <Tile t={t} mode="dark" open={edit === 'dark'} onToggle={() => setEdit(edit === 'dark' ? null : 'dark')} onCopy={() => copy(t.dark || t.light)} />
        </Row>
        {ratios.length > 0 && <Row gap="2" wrap="wrap">
          {ratios.map(({ m, r }) => { if (r === null) return null; const g = grade(r);
            return <Row key={m} items="center" gap="1" px="2" py="1" rounded="lg" fontSize="sm" fontWeight="700" title={`${m} contrast against ${other!.name}: ${r.toFixed(2)}:1`} bg={g.ok ? 'green-500/15' : 'red-500/15'} text={g.ok ? 'green-700' : 'red-600'} dark-text={g.ok ? 'green-400' : 'red-400'}><Glyph n={m === 'light' ? 'sun' : 'moon'} size={10} />{r.toFixed(1)}:1 · {g.t}</Row>; })}
          <Txt as="span" fontSize="sm" m="0" {...T.muted}>vs {other!.name}</Txt>
        </Row>}
        {edit && <Box key={edit} display="flex" justify="center" pt="1" animate="studio-pop-down 200ms cubic-bezier(0.2, 0.8, 0.2, 1) both">
          <ColorPicker value={val(t, edit)} recent={S.getState().recentColors} onChange={v => update(edit === 'light' ? { ...t, light: v } : { ...t, dark: v })} onCommit={v => S.pushRecentColor(v)} />
        </Box>}
      </Box>}
    </Box>
  );
}
