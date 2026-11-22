import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import type { DesignToken } from '../document/types';
import { T } from '../theme';
import { ColorPicker } from '../exporters/ColorPicker';
import { Ic } from './Icons';
import { ToolIcon, hasToolIcon } from './ToolIcons';

/** Uses the tool-rail icon set when the icon exists there, the old icon set otherwise. */
export function Glyph({ n, size = 16 }: { n: string; size?: number }) {
  const k = n === 'x' ? 'close' : n;
  return hasToolIcon(k) ? <ToolIcon n={k} size={size + 2} /> : <Ic n={n} size={size} />;
}

export function IconBtn({ icon, title, onClick, active, disabled, size = 28, iconSize = 16, danger, ...rest }: { icon: string; title: string; onClick?: (e: React.MouseEvent) => void; active?: boolean; disabled?: boolean; size?: number; iconSize?: number; danger?: boolean; [k: string]: unknown }) {
  return (
    <Btn type="button" title={title} aria-label={title} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onClick={disabled ? undefined : onClick} disabled={disabled} display="flex" items="center" justify="center" w={`${size}px`} h={`${size}px`} p="0" border="0" rounded="lg" cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? '0.35' : '1'}
      {...(active ? T.active : { bg: 'transparent', ...T.hover, text: danger ? 'danger' : 'gray-600', 'dark-text': danger ? 'danger' : 'gray-300' })} {...rest}>
      <Glyph n={icon} size={iconSize} />
    </Btn>
  );
}

export function Label({ children }: { children: ReactNode }) { return <Txt fontSize="sm" fontWeight="500" leading="tight" {...T.label} m="0" whitespace="nowrap">{children}</Txt>; }

export function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  // The whole row is a <label>, so clicking the text toggles it. The box is the only button inside, which makes the label forward its click to it.
  return (
    <Row as="label" items="center" gap="2" py="1" cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? '0.5' : '1'}>
      <Btn type="button" role="checkbox" aria-label={label || 'toggle'} aria-checked={checked} disabled={disabled} onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (!disabled) onChange(!checked); }}
        w="16px" h="16px" p="0" shrink="0" rounded="sm" display="flex" items="center" justify="center" border="1px solid" cursor="inherit" transition="all" duration="150"
        {...(checked ? { bg: 'primary', 'border-color': 'primary', text: 'white' } : { bg: 'white', 'dark-bg': 'gray-800', 'border-color': 'gray-300', 'dark-border-color': 'gray-600', 'hover-border-color': 'primary', text: 'transparent' })}>
        {checked && <Glyph n="check" size={12} />}
      </Btn>
      {label && <Txt fontSize="sm" leading="snug" m="0" {...T.text}>{label}</Txt>}
    </Row>
  );
}

/** Number input that commits on Enter or blur, steps with arrow keys, and shows "Mixed" for differing values. */
export function NumField({ label, value, onCommit, step = 1, min, max, suffix, disabled, mixed, w = '100%', title }: { label?: string; value: number | null | undefined; onCommit: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string; disabled?: boolean; mixed?: boolean; w?: string; title?: string }) {
  const shown = mixed ? '' : value === null || value === undefined || Number.isNaN(value) ? '' : String(Math.round(value * 100) / 100);
  const [draft, setDraft] = useState(shown); const editing = useRef(false);
  useEffect(() => { if (!editing.current) setDraft(shown); }, [shown]);
  const commit = () => {
    editing.current = false; const n = parseFloat(draft);
    if (!Number.isFinite(n)) { setDraft(shown); return; }
    const v = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)); onCommit(v); setDraft(String(Math.round(v * 100) / 100));
  };
  return (
    <Box w={w} title={title} display="flex" flex-col gap="1">
      {label && <Label>{label}</Label>}
      <Row items="center" gap="1" w="100%">
        <Input type="text" inputMode="decimal" value={draft} placeholder={mixed ? 'Mixed' : ''} disabled={disabled} aria-label={title || label || 'value'}
          onFocus={(e: React.FocusEvent<HTMLInputElement>) => { editing.current = true; e.target.select(); }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
            else if (e.key === 'Escape') { editing.current = false; setDraft(shown); (e.target as HTMLInputElement).blur(); }
            else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); const base = parseFloat(draft); const n = (Number.isFinite(base) ? base : 0) + (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1); const v = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)); setDraft(String(Math.round(v * 100) / 100)); onCommit(v); }
            e.stopPropagation();
          }}
          flex="1" min-w="0" w="100%" h="30px" px="2" fontSize="sm" outline="none" {...T.field} opacity={disabled ? '0.5' : '1'} />
        {suffix && <Txt fontSize="sm" {...T.label} m="0">{suffix}</Txt>}
      </Row>
    </Box>
  );
}

export function TextField({ label, value, onCommit, placeholder, multiline, disabled }: { label?: string; value: string; onCommit: (v: string) => void; placeholder?: string; multiline?: boolean; disabled?: boolean }) {
  const [draft, setDraft] = useState(value); const editing = useRef(false);
  useEffect(() => { if (!editing.current) setDraft(value); }, [value]);
  const done = () => { editing.current = false; if (draft !== value) onCommit(draft); };
  const common = { value: draft, placeholder, disabled, 'aria-label': label || placeholder || 'text', onFocus: () => { editing.current = true; }, onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setDraft(e.target.value), onBlur: done, w: '100%', px: '2', py: multiline ? '2' : '0', h: multiline ? undefined : '30px', fontSize: '12px', outline: 'none', ...T.field } as const;
  return (
    <Box w="100%" display="flex" flex-col gap="1">
      {label && <Label>{label}</Label>}
      {multiline
        ? <Box as="textarea" rows={3} {...common} resize="vertical" onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()} />
        : <Input type="text" {...common} onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); e.stopPropagation(); }} />}
    </Box>
  );
}

/** [value, label, icon?]. The icon is a ToolIcon key and is optional. */
export type Opt = [value: string, label: string, icon?: string];

/** Custom dropdown in the same row format as the tool flyouts: ToolIcon 20, md text. The list is fixed-position so docker bodies never clip it. */
export function SelectField({ label, value, options, onChange, disabled, w = '100%' }: { label?: string; value: string; options: Opt[]; onChange: (v: string) => void; disabled?: boolean; w?: string }) {
  const [pop, setPop] = useState<{ x: number; y: number; w: number } | null>(null); const btn = useRef<HTMLButtonElement | null>(null);
  const cur = options.find(o => o[0] === value) ?? options[0];
  const open = () => {
    const r = btn.current?.getBoundingClientRect(); if (!r) return;
    const h = Math.min(options.length * 30 + 8, 260);
    setPop({ x: r.left, y: Math.max(8, Math.min(r.bottom + 4, window.innerHeight - h - 8)), w: Math.max(r.width, 180) });
  };
  const step = (d: number) => { const i = options.findIndex(o => o[0] === value); const n = options[Math.max(0, Math.min(options.length - 1, i + d))]; if (n && n[0] !== value) onChange(n[0]); };
  return (
    <Box w={w} display="flex" flex-col gap="1">
      {label && <Label>{label}</Label>}
      <Btn ref={btn} type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={!!pop} aria-label={label || 'select'}
        onClick={() => (pop ? setPop(null) : open())}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'ArrowDown') { e.preventDefault(); step(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); } else if (e.key === 'Escape') setPop(null); e.stopPropagation(); }}
        w="100%" py="2.5" px="3" display="flex" items="center" gap="2" text-align="left" cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? '0.5' : '1'} outline="none" fontSize="sm" {...T.field}>
        {cur?.[2] && <ToolIcon n={cur[2]} size={18} />}
        <Txt fontSize="sm" m="0" flex="1" truncate>{cur?.[1]}</Txt>
        <Box display="flex" {...T.label}><ToolIcon n="chevron" size={14} /></Box>
      </Btn>
      {pop && <>
        <Box position="fixed" top="0" left="0" w="100%" h="100%" z="89" onPointerDown={() => setPop(null)} />
        <Box position="fixed" left={`${pop.x}px`} top={`${pop.y}px`} z="90" {...T.panel} p="1" w={`${pop.w}px`} max-h="260px" overflow-y="auto" role="listbox" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}>
          {options.map(o => (
            <Row key={o[0]} role="option" aria-selected={o[0] === value} items="center" gap="2" h="30px" px="2" rounded="lg" cursor="pointer" {...(o[0] === value ? T.active : T.hover)} onClick={() => { setPop(null); onChange(o[0]); }}>
              {o[2] && <ToolIcon n={o[2]} size={20} />}<Txt fontSize="sm" fontWeight={o[0] === value ? '600' : '400'} m="0" flex="1" truncate>{o[1]}</Txt>{o[0] === value && <ToolIcon n="check" size={14} />}
            </Row>
          ))}
        </Box>
      </>}
    </Box>
  );
}

type SegOpt<V extends string> = { v: V; label?: string; icon?: string; title?: string };
/** Rough width of one segment, so the row can decide how many fit before the rest move into a menu. */
const segWidth = (o: { label?: string; icon?: string }) => (o.icon && !o.label ? 34 : Math.max(48, Math.round((o.label?.length || 3) * 7.4 + 22)));
const MORE_W = 52;

/** A segmented control. When the options do not fit the width they never get squeezed: the ones that fit stay as segments,
    the rest move into a "More" menu, and the chosen option always stays visible. */
export function Seg<V extends string>({ value, options, onChange, label, disabled }: { value: V | undefined; options: SegOpt<V>[]; onChange: (v: V) => void; label?: string; disabled?: boolean }) {
  const box = useRef<HTMLDivElement | null>(null); const moreBtn = useRef<HTMLButtonElement | null>(null);
  const [w, setW] = useState(0); const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const el = box.current; if (!el) return; const read = () => setW(el.clientWidth); read();
    const ro = new ResizeObserver(read); ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!menu) return; const close = () => setMenu(null); const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('pointerdown', close); window.addEventListener('keydown', key); window.addEventListener('resize', close);
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', key); window.removeEventListener('resize', close); };
  }, [menu]);

  /* how many fit: all of them if they do, otherwise as many as leave room for the More button */
  const total = options.reduce((n, o) => n + segWidth(o), 0);
  let count = options.length;
  if (w > 0 && total > w - 4) { let used = MORE_W; count = 0; for (const o of options) { if (used + segWidth(o) > w - 4) break; used += segWidth(o); count++; } count = Math.max(1, count); }
  let shown = options.slice(0, count); let rest = options.slice(count);
  const sel = options.findIndex(o => o.v === value);
  if (rest.length && sel >= count) { shown = [...shown.slice(0, -1), options[sel]]; rest = options.filter(o => !shown.includes(o)); }

  const openMenu = () => { const r = moreBtn.current?.getBoundingClientRect(); if (!r) return; const h = rest.length * 32 + 8; setMenu(menu ? null : { x: Math.max(8, Math.min(r.right - 188, window.innerWidth - 196)), y: r.bottom + 6 + h > window.innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6 }); };
  const seg = (o: SegOpt<V>) => (
    <Btn key={o.v} type="button" title={o.title || o.label || o.v} aria-pressed={value === o.v} disabled={disabled} onClick={() => onChange(o.v)} flex="1" min-w="0" h="26px" display="flex" items="center" justify="center" border="0" rounded="lg" fontSize="sm" fontWeight="600" cursor="pointer" p="0" whitespace="nowrap" transition="all" duration="150"
      {...(value === o.v ? { bg: 'white', 'dark-bg': 'primary', text: 'primary', 'dark-text': 'white', shadow: 'sm' } : { bg: 'transparent', 'hover-text': 'gray-900', 'dark-hover-text': 'white', ...T.label })}>
      {o.icon ? <Glyph n={o.icon} size={14} /> : o.label}
    </Btn>
  );
  return (
    <Box w="100%" display="flex" flex-col gap="1">
      {label && <Label>{label}</Label>}
      <Row ref={box} bg="gray-900/5" dark-bg="white/6" rounded="lg" p="2px" gap="2px" w="100%" role="group" aria-label={label}>
        {shown.map(seg)}
        {rest.length > 0 && <Btn ref={moreBtn} type="button" aria-haspopup="menu" aria-expanded={!!menu} title={`${rest.length} more: ${rest.map(o => o.label || o.v).join(', ')}`} disabled={disabled} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onClick={openMenu}
          w={`${MORE_W - 4}px`} shrink="0" h="26px" display="flex" items="center" justify="center" gap="1" border="0" rounded="lg" fontSize="sm" fontWeight="600" cursor="pointer" p="0" bg={menu ? 'white' : 'transparent'} dark-bg={menu ? 'white/10' : 'transparent'} {...T.label}>
          <Glyph n="more" size={14} />
        </Btn>}
      </Row>
      {menu && createPortal(
        <Box position="fixed" left={`${menu.x}px`} top={`${menu.y}px`} w="188px" z="96" p="1" {...T.glassPop} role="menu" aria-label="More options" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
          {rest.map(o => <Row key={o.v} items="center" gap="2" h="32px" px="2" rounded="lg" cursor="pointer" role="menuitem" onClick={() => { onChange(o.v); setMenu(null); }} {...T.hover} {...T.text}>
            {o.icon && <Glyph n={o.icon} size={14} />}<Txt fontSize="sm" m="0" flex="1" truncate>{o.label || o.v}</Txt>
          </Row>)}
        </Box>, document.body)}
    </Box>
  );
}

const InSection = createContext(false);

/**
 * A collapsible group of fields. At the top level of a panel it is a card (white surface, hairline border, rounded corners)
 * whose header stays pinned while the panel scrolls; inside another section it becomes a quiet sub-heading with a divider.
 */
export function Section({ title, children, open: initial = true, action, hint }: { title: string; children: ReactNode; open?: boolean; action?: ReactNode; hint?: string }) {
  const [open, setOpen] = useState(initial); const nested = useContext(InSection);
  const chevron = <Box {...T.label} display="flex" transform={open ? 'none' : 'rotate(-90deg)'} transition="all" duration="150"><ToolIcon n="chevron" size={14} /></Box>;
  const head = (
    <Row items="center" justify="between" gap="2" px="3" h={nested ? '30px' : '38px'} cursor="pointer" role="button" aria-expanded={open} tabIndex={0}
      onClick={() => setOpen(!open)} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpen(!open); } }}
      {...(nested ? { 'hover-bg': 'gray-50', 'dark-hover-bg': 'gray-800/60', rounded: '4px' } : { position: 'sticky', top: '0', z: '2', bg: 'white', 'dark-bg': 'gray-900' })}>
      <Row items="center" gap="1" min-w="0">{chevron}<Txt fontSize="sm" fontWeight="600" leading="tight" tracking="wider" uppercase {...T.label} m="0" truncate>{title}</Txt></Row>
      {action && <Box onClick={(e: React.MouseEvent) => e.stopPropagation()}>{action}</Box>}
    </Row>
  );
  const body = open && <Box px="3" pb="3" pt={nested ? '1' : '0'} display="flex" flex-col gap="3">{hint && <Txt fontSize="sm" leading="snug" m="0" {...T.label}>{hint}</Txt>}{children}</Box>;
  return (
    <InSection.Provider value={true}>
      {nested
        ? <Box border-t="1px solid" {...T.hairline} mt="1" pt="1">{head}{body}</Box>
        : <Box border-t="1px solid" {...T.hairline}>{head}{body}</Box>}
    </InSection.Provider>
  );
}

/* ---------- Colour / fill field ---------- */
type FillMode = 'solid' | 'gradient' | 'token' | 'css';
type Stop = { id: string; color: string; pos: number };
type GradState = { kind: 'linear' | 'radial'; angle: number; stops: Stop[]; sel: string };

const isGrad = (v?: string) => !!v && /gradient\(/.test(v);
const sid = () => Math.random().toString(36).slice(2, 9);
const sortStops = (s: Stop[]) => [...s].sort((a, b) => a.pos - b.pos);
const stopList = (s: Stop[]) => sortStops(s).map(x => `${x.color} ${Math.round(x.pos * 10) / 10}%`).join(', ');
const buildGrad = (g: GradState) => g.kind === 'radial'
  ? `radial-gradient(circle at 50% 50%, ${stopList(g.stops)})`
  : `linear-gradient(${Math.round(g.angle)}deg, ${stopList(g.stops)})`;

const hexRgb = (h: string): [number, number, number] | null => {
  const m = h.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i); if (!m) return null;
  let x = m[1]; if (x.length === 3) x = x.split('').map(c => c + c).join('');
  const n = parseInt(x, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbHex = (r: number, g: number, b: number) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const asHex = (c: string) => (hexRgb(c) ? c : '#000000');

/** Colour of the gradient at a given position (0-100), used when a stop is added in the middle. */
const colorAt = (stops: Stop[], pos: number) => {
  const s = sortStops(stops); const last = s[s.length - 1];
  if (pos <= s[0].pos) return s[0].color; if (pos >= last.pos) return last.color;
  for (let i = 0; i < s.length - 1; i++) {
    const a = s[i], b = s[i + 1];
    if (pos >= a.pos && pos <= b.pos) {
      const ca = hexRgb(a.color), cb = hexRgb(b.color); if (!ca || !cb) return a.color;
      const t = (pos - a.pos) / Math.max(0.0001, b.pos - a.pos);
      return rgbHex(ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t);
    }
  }
  return last.color;
};

const splitTop = (s: string) => {
  const out: string[] = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++; if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim()); return out;
};

/** Reads a CSS linear/radial gradient back into editable stops. Returns null when it can't. */
const parseGrad = (v: string): GradState | null => {
  const m = v.trim().match(/^(linear|radial)-gradient\(([\s\S]*)\)$/); if (!m) return null;
  const kind = m[1] as 'linear' | 'radial'; const parts = splitTop(m[2]); let angle = 135;
  if (kind === 'linear') {
    const dir: Record<string, number> = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 };
    if (/^-?[\d.]+deg$/.test(parts[0])) angle = parseFloat(parts.shift()!);
    else if (parts[0] in dir) angle = dir[parts.shift()!];
    else if (/^to /.test(parts[0])) parts.shift();
    else angle = 180;
  } else if (/^(circle|ellipse|closest|farthest)/.test(parts[0])) parts.shift();
  if (parts.length < 2) return null;
  const stops: Stop[] = parts.map((p, i) => {
    const mm = p.match(/^(.*?)(?:\s+(-?[\d.]+)%)?$/);
    return { id: sid(), color: (mm?.[1] || p).trim(), pos: mm?.[2] !== undefined ? parseFloat(mm[2]) : (i / (parts.length - 1)) * 100 };
  });
  return { kind, angle: ((angle % 360) + 360) % 360, stops, sel: stops[0].id };
};

/** Default gradient: the present colour fading to white. */
const seedGrad = (value?: string): GradState => {
  const p = isGrad(value) ? parseGrad(value!) : null; if (p) return p;
  const a: Stop = { id: sid(), color: value || '#6366f1', pos: 0 }; const b: Stop = { id: sid(), color: '#ffffff', pos: 100 };
  return { kind: 'linear', angle: 135, stops: [a, b], sel: a.id };
};

/**
 * Colour box shown in the panels. Clicking it opens a modal with four fill modes:
 *  - Solid: the colour wheel / drag-to-pick picker
 *  - Gradient: CorelDraw-style editor. Rotate the square's handle to set the angle, click a stop to
 *    recolour it, drag stops along the bar, double-click the square or the bar to add a stop.
 *  - Token: semantic design tokens (pass `tokens`, and `onToken` to link instead of copy the value)
 *  - CSS: free-form CSS value (solid, gradient or fade)
 * `tokenOptions` is still accepted for older callers and is converted to tokens.
 */
export function ColorField({ label, value, onChange, allowNone, title, tokens, tokenOptions = [], activeToken, onToken, gradientOptions = [] }: {
  label?: string; value?: string; onChange: (v: string | undefined) => void; allowNone?: boolean; title?: string;
  tokens?: DesignToken[]; tokenOptions?: Opt[]; activeToken?: string; onToken?: (t: DesignToken) => void; gradientOptions?: string[];
}) {
  const SIZE = 240;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<FillMode>('solid');
  const [draft, setDraft] = useState(value || '');
  const [g, setG] = useState<GradState>(() => seedGrad(value));
  const squareRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => setDraft(value || ''), [value]);

  const tokenList: DesignToken[] = tokens ?? tokenOptions.map(([v, name]) => ({ id: v, name, light: v } as DesignToken));
  const swatch = value || '#000000';
  const solid = value && !isGrad(value) && value.startsWith('#') ? value : '#000000';
  const selStop = g.stops.find(s => s.id === g.sel) ?? g.stops[0];

  const apply = (next?: string) => {
    const clean = next && next.trim() ? next.trim() : undefined;
    setDraft(clean || ''); onChange(clean); setOpen(false);
  };
  const pushG = (next: GradState) => { setG(next); onChange(buildGrad(next)); };
  const openModal = () => {
    if (isGrad(value)) { setG(seedGrad(value)); setMode('gradient'); } else setMode('solid');
    setOpen(true);
  };
  const changeMode = (m: FillMode) => {
    setMode(m);
    if (m === 'gradient') { const ng = seedGrad(value); setG(ng); if (!isGrad(value)) onChange(buildGrad(ng)); }
  };

  /* --- stops --- */
  const addStop = (pos: number) => {
    const p = Math.max(0, Math.min(100, pos)); const n: Stop = { id: sid(), color: colorAt(g.stops, p), pos: p };
    pushG({ ...g, stops: [...g.stops, n], sel: n.id });
  };
  const removeStop = () => {
    if (g.stops.length <= 2) return;
    const rest = g.stops.filter(s => s.id !== g.sel); pushG({ ...g, stops: rest, sel: rest[0].id });
  };
  const setStop = (id: string, patch: Partial<Stop>) => pushG({ ...g, sel: id, stops: g.stops.map(s => (s.id === id ? { ...s, ...patch } : s)) });
  const posFromTrack = (clientX: number) => { const r = trackRef.current!.getBoundingClientRect(); return Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)); };

  /* --- rotation handle --- */
  const rotate = (e: React.PointerEvent) => {
    if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
    const r = squareRef.current!.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    let a = (Math.atan2(dx, -dy) * 180) / Math.PI; if (a < 0) a += 360;
    a = e.shiftKey ? Math.round(a / 15) * 15 : Math.round(a);
    pushG({ ...g, angle: a % 360 });
  };

  /* --- double-click on the square: project the click onto the gradient axis --- */
  const squareDouble = (e: React.MouseEvent) => {
    const r = squareRef.current!.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (g.kind === 'radial') { addStop((Math.hypot(dx, dy) / ((SIZE * Math.SQRT2) / 2)) * 100); return; }
    const a = (g.angle * Math.PI) / 180; const L = SIZE * (Math.abs(Math.sin(a)) + Math.abs(Math.cos(a)));
    addStop((0.5 + (dx * Math.sin(a) - dy * Math.cos(a)) / L) * 100);
  };

  const hr = (g.angle * Math.PI) / 180; const hR = SIZE / 2 - 16;
  const hx = SIZE / 2 + hR * Math.sin(hr), hy = SIZE / 2 - hR * Math.cos(hr);

  const modes: { v: FillMode; label: string }[] = [
    { v: 'solid', label: 'Solid' },
    { v: 'gradient', label: 'Gradient' },
    ...(tokenList.length ? [{ v: 'token' as FillMode, label: 'Token' }] : []),
    { v: 'css', label: 'CSS' },
  ];

  return (
    <Box w="100%" display="flex" flex-col gap="1">
      {label && <Label>{label}</Label>}
      {/* Compact field: swatch, value, clear. Clicking anywhere on it opens the picker. */}
      <Row items="center" gap="2" h="30px" pl="1" pr="1" {...T.field} cursor="pointer" role="button" tabIndex={0} aria-label={title || label || 'colour'}
        onClick={openModal} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); } e.stopPropagation(); }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)', background: value ? swatch : 'repeating-conic-gradient(rgba(148,163,184,0.35) 0% 25%, transparent 0% 50%) 50% / 8px 8px' }} />
        <Txt fontSize="sm" m="0" flex="1" min-w="0" truncate {...(value ? T.text : T.label)}>{value ? (isGrad(value) ? 'Gradient' : value.toUpperCase()) : 'None'}</Txt>
        {allowNone && value && <IconBtn icon="x" title="Remove" size={22} iconSize={12} onClick={(e: React.MouseEvent) => { e.stopPropagation(); apply(undefined); }} />}
      </Row>

      {open && (
        <Box position="fixed" inset="0" z="90" bg="rgba(15, 23, 42, 0.45)" onClick={() => setOpen(false)}>
          <Box position="absolute" left="50%" top="50%" transform="translate(-50%, -50%)" z="91" p="4" {...T.panel} rounded="lg"
            style={{ width: 600, maxWidth: '94vw', maxHeight: '78vh', overflowY: 'auto' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            onKeyDown={(e: React.KeyboardEvent) => {
              const tag = (e.target as HTMLElement).tagName;
              if (mode === 'gradient' && (e.key === 'Delete' || e.key === 'Backspace') && tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); removeStop(); }
            }}>
            <Box display="flex" flex-col gap="3">
              <Seg label="Fill" value={mode} options={modes} onChange={changeMode} />

              {mode === 'solid' && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ColorPicker value={solid} recent={[]} onChange={v => { setDraft(v); onChange(v); }} onCommit={v => { setDraft(v); onChange(v); setOpen(false); }} />
                </div>
              )}

              {mode === 'gradient' && (
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {/* Left: rotatable square + stop bar */}
                  <div style={{ width: SIZE, flexShrink: 0 }}>
                    <div ref={squareRef} onDoubleClick={squareDouble} title="Double-click to add a colour"
                      style={{ position: 'relative', width: SIZE, height: SIZE, borderRadius: 20, backgroundImage: buildGrad(g), userSelect: 'none', touchAction: 'none' }}>
                      {g.kind === 'linear' && <>
                        <svg width={SIZE} height={SIZE} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                          <line x1={SIZE / 2} y1={SIZE / 2} x2={hx} y2={hy} stroke="rgba(0,0,0,0.35)" strokeWidth={3} strokeLinecap="round" />
                          <line x1={SIZE / 2} y1={SIZE / 2} x2={hx} y2={hy} stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
                          <circle cx={SIZE / 2} cy={SIZE / 2} r={3.5} fill="#fff" />
                        </svg>
                        <div title="Drag to rotate (hold Shift to snap to 15°)"
                          onPointerDown={e => { e.stopPropagation(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
                          onPointerMove={rotate} onDoubleClick={e => e.stopPropagation()}
                          style={{ position: 'absolute', left: hx - 9, top: hy - 9, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 5px rgba(0,0,0,0.45)', cursor: 'grab', touchAction: 'none' }} />
                      </>}
                    </div>

                    <div style={{ padding: '0 9px', marginTop: 14 }}>
                      <div ref={trackRef} onDoubleClick={e => addStop(posFromTrack(e.clientX))} title="Double-click to add a colour"
                        style={{ position: 'relative', height: 28, borderRadius: 10, backgroundImage: `linear-gradient(90deg, ${stopList(g.stops)})`, marginBottom: 16 }}>
                        {g.stops.map(s => {
                          const on = s.id === g.sel;
                          return <div key={s.id}
                            onPointerDown={e => { e.stopPropagation(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setG(p => ({ ...p, sel: s.id })); }}
                            onPointerMove={e => { if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) setStop(s.id, { pos: posFromTrack(e.clientX) }); }}
                            onDoubleClick={e => e.stopPropagation()}
                            style={{ position: 'absolute', left: `${s.pos}%`, top: 19, width: on ? 20 : 16, height: on ? 20 : 16, transform: 'translateX(-50%)', borderRadius: '50%', background: s.color, border: '2px solid #fff', boxShadow: on ? '0 0 0 2px #6366f1, 0 1px 4px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.4)', cursor: 'grab', touchAction: 'none', zIndex: on ? 2 : 1 }} />;
                        })}
                      </div>
                    </div>
                    <Txt fontSize="sm" m="0" {...T.muted}>Double-click the square or the bar to add a colour. Select a dot to recolour it, drag to move it.</Txt>
                  </div>

                  {/* Right: controls */}
                  <Box flex="1" display="flex" flex-col gap="2" style={{ minWidth: 220 }}>
                    <Seg value={g.kind} options={[{ v: 'linear', label: 'Linear' }, { v: 'radial', label: 'Radial' }]} onChange={v => pushG({ ...g, kind: v })} />
                    <Row gap="2">
                      <NumField label="Angle" value={Math.round(g.angle)} min={0} max={360} suffix="deg" disabled={g.kind === 'radial'} onCommit={v => pushG({ ...g, angle: v % 360 })} />
                      <NumField label="Position" value={Math.round(selStop.pos)} min={0} max={100} suffix="%" onCommit={v => setStop(selStop.id, { pos: v })} />
                    </Row>
                    <Label>Selected colour</Label>
                    <ColorPicker value={asHex(selStop.color)} recent={[]} onChange={v => setStop(selStop.id, { color: v })} onCommit={v => setStop(selStop.id, { color: v })} />
                    <Btn type="button" onClick={removeStop} disabled={g.stops.length <= 2} h="28px" {...T.card} fontSize="sm" cursor="pointer">Remove selected colour</Btn>
                    {gradientOptions.length > 0 && (
                      <Box display="grid" grid-cols="4" gap="2">
                        {gradientOptions.map(p => <Btn key={p} type="button" onClick={() => { const ng = parseGrad(p); if (ng) pushG(ng); else apply(p); }} h="28px" border="0" cursor="pointer" style={{ backgroundImage: p, borderRadius: 8 }} title={p} />)}
                      </Box>
                    )}
                    <Btn type="button" onClick={() => setOpen(false)} h="30px" rounded="lg" border="0" bg="primary" text="white" fontSize="sm" fontWeight="600" cursor="pointer">Done</Btn>
                  </Box>
                </div>
              )}

              {mode === 'token' && (
                <Box display="flex" flex-col gap="1">
                  {tokenList.map(t => (
                    <Btn key={t.id} type="button" onClick={() => { if (onToken) { onToken(t); setOpen(false); } else apply(t.light); }} w="100%" h="32px" px="2" display="flex" items="center" justify="between" rounded="lg" border="0" cursor="pointer" {...(activeToken === t.id ? T.active : T.hover)}>
                      <Txt fontSize="sm" m="0" {...T.text}>{t.name}</Txt>
                      <Box w="16px" h="16px" rounded="sm" bg={t.light} />
                    </Btn>
                  ))}
                </Box>
              )}

              {mode === 'css' && (
                <Box display="flex" flex-col gap="2">
                  <Label>CSS fill (solid, gradient, or fade)</Label>
                  <Box as="textarea" rows={3} value={draft} placeholder="linear-gradient(135deg, #6366f1, #ec4899)" onChange={(e: any) => setDraft(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()} w="100%" p="2" fontSize="sm" outline="none" resize="vertical" {...T.field} />
                  <Btn type="button" onClick={() => apply(draft)} h="30px" rounded="lg" border="0" bg="primary" text="white" fontSize="sm" fontWeight="600" cursor="pointer">Apply</Btn>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <Box display="flex" flex-col items="center" justify="center" gap="1" p="6" text-align="center" {...T.muted}>
      <Glyph n={icon} size={22} /><Txt fontSize="sm" fontWeight="600" m="0" {...T.text}>{title}</Txt>{hint && <Txt fontSize="sm" m="0" {...T.muted}>{hint}</Txt>}
    </Box>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <Box as="kbd" px="1" fontSize="sm" fontWeight="600" {...T.card} {...T.muted} font-mono>{children}</Box>;
}

/** Brand mark, shared by the header and the welcome screen. */
export function Logo({ size = 36 }: { size?: number }) {
  return <img src="/logo-studio.png" alt="AtomAttr Studio logo" width={size} height={size} style={{ display: 'block', borderRadius: 8, objectFit: 'contain' }} />;
}