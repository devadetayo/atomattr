import { useEffect, useId, useRef, useState } from 'react';
import { Box, Input, Row, Btn, Txt } from 'atomattr/react';
import { T } from '../theme';

/* ---------- custom colour picker ----------
   Saturation/brightness square, hue slider, alpha slider, hex + alpha fields, recent colours.
   Layout is Atomattr attributes. The gradients and the moving thumbs are SVG (gradients can't be written as attributes),
   so dragging never creates new attribute values. Output is #rrggbb, or #rrggbbaa when alpha < 1. */

export type HSVA = { h: number; s: number; v: number; a: number };

const clamp = (n: number, lo = 0, hi = 1) => Math.min(Math.max(n, lo), hi);
const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0');

export function toRgb({ h, s, v }: HSVA): [number, number, number] {
  const f = (n: number) => { const k = (n + h / 60) % 6; return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255; };
  return [Math.round(f(5)), Math.round(f(3)), Math.round(f(1))];
}

function fromRgb(r: number, g: number, b: number, a: number): HSVA {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b); const d = max - Math.min(r, g, b); let h = 0;
  if (d) { h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return { h, s: max ? d / max : 0, v: max, a };
}

/** Reads #rgb, #rgba, #rrggbb, #rrggbbaa and rgb()/rgba(). `loose` also accepts hex without the leading #. Anything else (gradients, names) gives null. */
export function parseColour(input?: string, loose = false): HSVA | null {
  if (!input) return null; const t = input.trim();
  let m = (loose ? /^#?([0-9a-f]{3,8})$/i : /^#([0-9a-f]{3,8})$/i).exec(t);
  if (m && [3, 4, 6, 8].includes(m[1].length)) {
    let x = m[1]; if (x.length <= 4) x = [...x].map(ch => ch + ch).join('');
    const n = (i: number) => parseInt(x.slice(i, i + 2), 16);
    return fromRgb(n(0), n(2), n(4), x.length === 8 ? n(6) / 255 : 1);
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+)(%?))?\s*\)$/i.exec(t);
  if (m) return fromRgb(+m[1], +m[2], +m[3], clamp(m[4] === undefined ? 1 : m[5] ? +m[4] / 100 : +m[4]));
  return null;
}

export function formatColour(c: HSVA): string {
  const [r, g, b] = toRgb(c);
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${c.a < 1 ? hex2(c.a * 255) : ''}`;
}

/** Same hue, stepped from light to dark: handy for building a tonal ramp from one brand colour. */
export function shadesOf(c: HSVA, n = 7): string[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return formatColour({ h: c.h, s: c.s > 0.05 ? clamp(0.12 + t * 0.78) : 0, v: clamp(1 - t * 0.78), a: 1 });
  });
}

/** Complement, the two neighbours on the wheel and the two triad colours. */
export function harmonyOf(c: HSVA): { label: string; colour: string }[] {
  const rot = (d: number) => formatColour({ ...c, h: (c.h + d + 360) % 360, a: 1 });
  return [
    { label: 'Analogous −30°', colour: rot(-30) }, { label: 'Analogous +30°', colour: rot(30) },
    { label: 'Complement', colour: rot(180) }, { label: 'Triad +120°', colour: rot(120) }, { label: 'Triad −120°', colour: rot(240) },
  ];
}

const W = 208;      // track width
const SVH = 148;    // saturation/brightness square height
const PAD = 8;      // room around the tracks so thumbs are not clipped at the edges
const OUTER = W + PAD * 2;

export function ColorPicker({ value, onChange, onCommit, recent = [] }: {
  value?: string;
  /** called continuously while dragging or typing */
  onChange: (colour: string) => void;
  /** called once when a drag ends or a typed value is accepted (use it for "recent colours") */
  onCommit?: (colour: string) => void;
  recent?: string[];
}) {
  const uid = useId().replace(/:/g, '');
  const [c, setC] = useState<HSVA>(() => parseColour(value) || { h: 0, s: 0, v: 0, a: 1 });
  const [hexTxt, setHexTxt] = useState(() => formatColour(c));
  const latest = useRef(c);                  // always the newest colour, even between renders
  const emitted = useRef(formatColour(c));   // the last value we sent out, so we can tell outside changes from our own
  const active = useRef(false);

  /* the selection changed from outside: follow it. Our own output coming back is ignored, which keeps the hue when saturation or brightness hits 0. */
  useEffect(() => {
    const p = parseColour(value); if (!p) return;
    const f = formatColour(p); if (f === emitted.current) return;
    emitted.current = f; latest.current = p; setC(p); setHexTxt(f);
  }, [value]);

  const set = (next: Partial<HSVA>) => {
    const n = { ...latest.current, ...next }; latest.current = n; setC(n);
    const out = formatColour(n); emitted.current = out; setHexTxt(out); onChange(out);
  };

  /* pointer dragging for the three tracks */
  const pointer = (apply: (x: number, y: number) => Partial<HSVA>) => {
    const go = (e: React.PointerEvent) => { const r = (e.currentTarget as Element).getBoundingClientRect(); set(apply(e.clientX - r.left - PAD, e.clientY - r.top - PAD)); };
    const end = (e: React.PointerEvent) => {
      if (!active.current) return; active.current = false;
      try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* already released */ }
      onCommit?.(emitted.current);
    };
    return {
      onPointerDown: (e: React.PointerEvent) => { if (e.button !== 0) return; (e.currentTarget as Element).setPointerCapture(e.pointerId); active.current = true; e.preventDefault(); go(e); },
      onPointerMove: (e: React.PointerEvent) => { if (active.current) go(e); },
      onPointerUp: end, onPointerCancel: end,
    };
  };

  const key = (e: React.KeyboardEvent, steps: Record<string, Partial<HSVA>>) => {
    const next = steps[e.key]; if (!next) return; e.preventDefault(); e.stopPropagation(); set(next); onCommit?.(emitted.current);
  };
  const st = (e: React.KeyboardEvent, small: number) => (e.shiftKey ? small * 5 : small);

  const [r, g, b] = toRgb(c);
  const solid = `rgb(${r},${g},${b})`;
  const hueColour = `hsl(${Math.round(c.h)},100%,50%)`;
  const thumb = (cx: number, cy: number, fill: string) => (
    <>
      <circle cx={cx} cy={cy} r="8.5" fill="none" stroke="#000" strokeOpacity=".3" />
      <circle cx={cx} cy={cy} r="7" fill={fill} stroke="#fff" strokeWidth="2.5" />
    </>
  );
  const checker = (
    <pattern id={`${uid}c`} width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#fff" /><rect width="4" height="4" fill="#d4d4d8" /><rect x="4" y="4" width="4" height="4" fill="#d4d4d8" />
    </pattern>
  );

  const commitHex = () => {
    const p = parseColour(hexTxt, true);
    if (p) { set(p); onCommit?.(emitted.current); } else setHexTxt(formatColour(latest.current));
  };

  return (
    <Box display="flex" flex-col gap="3" w={`${OUTER}px`}>

      {/* saturation (left to right) and brightness (bottom to top) */}
      <Box touch-action="none" lh="0">
        <svg width={OUTER} height={SVH + PAD * 2} viewBox={`${-PAD} ${-PAD} ${OUTER} ${SVH + PAD * 2}`} role="slider" tabIndex={0} aria-label="Saturation and brightness"
          aria-valuetext={`${Math.round(c.s * 100)}% saturation, ${Math.round(c.v * 100)}% brightness`}
          {...pointer((x, y) => ({ s: clamp(x / W), v: 1 - clamp(y / SVH) }))}
          onKeyDown={e => key(e, { ArrowLeft: { s: clamp(c.s - st(e, 0.02)) }, ArrowRight: { s: clamp(c.s + st(e, 0.02)) }, ArrowUp: { v: clamp(c.v + st(e, 0.02)) }, ArrowDown: { v: clamp(c.v - st(e, 0.02)) } })}>
          <defs>
            <linearGradient id={`${uid}w`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
            <linearGradient id={`${uid}k`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" /></linearGradient>
          </defs>
          <rect width={W} height={SVH} rx="8" fill={hueColour} />
          <rect width={W} height={SVH} rx="8" fill={`url(#${uid}w)`} />
          <rect width={W} height={SVH} rx="8" fill={`url(#${uid}k)`} />
          {thumb(c.s * W, (1 - c.v) * SVH, solid)}
        </svg>
      </Box>

      {/* hue */}
      <Box touch-action="none" lh="0">
        <svg width={OUTER} height="16" viewBox={`${-PAD} 0 ${OUTER} 16`} role="slider" tabIndex={0} aria-label="Hue" aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(c.h)}
          {...pointer(x => ({ h: clamp(x / W) * 360 }))}
          onKeyDown={e => key(e, { ArrowLeft: { h: clamp(c.h - st(e, 2), 0, 360) }, ArrowRight: { h: clamp(c.h + st(e, 2), 0, 360) } })}>
          <defs>
            <linearGradient id={`${uid}h`} x1="0" y1="0" x2="1" y2="0">
              {['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#f00'].map((col, i) => <stop key={i} offset={i / 6} stopColor={col} />)}
            </linearGradient>
          </defs>
          <rect y="2" width={W} height="12" rx="6" fill={`url(#${uid}h)`} />
          {thumb((c.h / 360) * W, 8, hueColour)}
        </svg>
      </Box>

      {/* alpha */}
      <Box touch-action="none" lh="0">
        <svg width={OUTER} height="16" viewBox={`${-PAD} 0 ${OUTER} 16`} role="slider" tabIndex={0} aria-label="Opacity" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(c.a * 100)}
          {...pointer(x => ({ a: clamp(x / W) }))}
          onKeyDown={e => key(e, { ArrowLeft: { a: clamp(c.a - st(e, 0.01)) }, ArrowRight: { a: clamp(c.a + st(e, 0.01)) } })}>
          <defs>
            {checker}
            <linearGradient id={`${uid}a`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={solid} stopOpacity="0" /><stop offset="1" stopColor={solid} /></linearGradient>
          </defs>
          <rect y="2" width={W} height="12" rx="6" fill={`url(#${uid}c)`} />
          <rect y="2" width={W} height="12" rx="6" fill={`url(#${uid}a)`} />
          {thumb(c.a * W, 8, solid)}
        </svg>
      </Box>

      {/* preview + typed values */}
      <Row items="center" gap="1" px="2">
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
          <defs>{checker}</defs>
          <rect width="32" height="32" rx="8" fill={`url(#${uid}c)`} />
          <rect width="32" height="32" rx="8" fill={solid} fillOpacity={c.a} />
          <rect x=".5" y=".5" width="31" height="31" rx="7.5" fill="none" stroke="#000" strokeOpacity=".15" />
        </svg>
        <Input type="text" value={hexTxt} aria-label="Hex colour" spellCheck={false}
          onChange={(e: any) => setHexTxt(e.target.value)} onBlur={commitHex}
          onKeyDown={(e: any) => { if (e.key === 'Enter') commitHex(); e.stopPropagation(); }}
          flex="1" min-w="0" h="30px" px="2" fontSize="sm" {...T.field} />
        <Input type="number" min="0" max="100" value={Math.round(c.a * 100)} aria-label="Opacity percent"
          onChange={(e: any) => { if (e.target.value !== '') set({ a: clamp(Number(e.target.value), 0, 100) / 100 }); }} onBlur={() => onCommit?.(emitted.current)}
          onKeyDown={(e: any) => e.stopPropagation()}
          w="42px" h="30px" px="1" fontSize="sm" {...T.field} />
        <Txt as="span" fontSize="sm" m="0" {...T.muted}>%</Txt>
        {typeof window !== 'undefined' && 'EyeDropper' in window ? (
          <Btn type="button" title="Pick a colour from the screen" aria-label="Pick a colour from the screen" w="26px" h="30px" p="0" shrink="0" display="flex" items="center" justify="center" border="0" rounded="lg" cursor="pointer" transition="all" duration="150" bg="transparent" {...T.hover} {...T.text}
            onClick={async () => { try { const r = await new (window as any).EyeDropper().open(); const p = parseColour(r.sRGBHex); if (p) { set({ ...p, a: latest.current.a }); onCommit?.(emitted.current); } } catch { /* cancelled */ } }}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.2a2 2 0 0 1 3.3 2.2l-1.1 1.1.5.5-1 1-.5-.5-5.6 5.6-2.8.7.7-2.8 5.6-5.6-.5-.5 1-1 .5.5 1.1-1.1z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
          </Btn>
        ) : null}
      </Row>

      {/* tonal ramp and harmony, both generated from the colour you are editing */}
      <Box px="2" display="flex" flex-col gap="2">
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Shades</Txt>
          <Row gap="1">
            {shadesOf(c).map((col, i) => (
              <Btn key={col + i} type="button" title={col} aria-label={`Shade ${col}`} onClick={() => { const p = parseColour(col); if (p) { set({ ...p, a: latest.current.a }); onCommit?.(emitted.current); } }}
                flex="1" h="22px" p="0" border="0" cursor="pointer" bg={col} rounded={i === 0 ? 'md' : 'sm'} transition="all" duration="150" hover-scale="1.10" hover-z="1" />
            ))}
          </Row>
        </Box>
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Harmony</Txt>
          <Row gap="1">
            {harmonyOf(c).map(h => (
              <Btn key={h.label} type="button" title={`${h.label} · ${h.colour}`} aria-label={`${h.label} ${h.colour}`} onClick={() => { const p = parseColour(h.colour); if (p) { set({ ...p, a: latest.current.a }); onCommit?.(emitted.current); } }}
                flex="1" h="22px" p="0" border="0" cursor="pointer" bg={h.colour} rounded="lg" transition="all" duration="150" hover-scale="1.10" hover-z="1" />
            ))}
          </Row>
        </Box>
      </Box>

      {recent.length > 0 ? (
        <Box px="2">
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Recent</Txt>
          <Row gap="2" wrap="wrap">
            {recent.slice(0, 10).map(col => (
              <Btn key={col} type="button" title={col} aria-label={`Use ${col}`} onClick={() => { const p = parseColour(col, true); if (p) { set(p); onCommit?.(emitted.current); } }}
                w="22px" h="22px" p="0" rounded="full" border="1px solid" border-color="gray-300" dark-border-color="gray-600" cursor="pointer" bg={col} transition="all" duration="150" hover-scale="1.15" />
            ))}
          </Row>
        </Box>
      ) : null}
    </Box>
  );
}