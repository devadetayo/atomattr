import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import type { Anim, AnimCustom, Node } from '../document/types';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { ANIM_EASES, ANIM_PRESETS, CUSTOM_ID, LOOPING, animDefaults, animValue, customDefaults, ensureKeyframes } from '../document/animations';
import { Checkbox, EmptyState, NumField, SelectField, Seg } from '../components/ui';
import { Ic } from '../components/Icons';
import { T } from '../theme';
import { useCols } from '../components/useCols';
import { BACKGROUNDS, BEAMS, fxIds, type Fx } from '../document/ui-css-fx';
import { ensureUiCss } from '../document/ui-css';

ensureKeyframes(); ensureUiCss();

/* ---------- presets, grouped the way people look for them ---------- */
const TABS = [
  { id: 'in', label: 'In', groups: ['Entrance'] },
  { id: 'highlight', label: 'Highlight', groups: ['Attention'] },
  { id: 'loop', label: 'Loop', groups: ['Loop'] },
  { id: 'out', label: 'Out', groups: ['Exit'] },
  { id: 'custom', label: 'Custom', groups: [] },
  { id: 'fx', label: 'Effects', groups: [] },
] as const;
type TabId = (typeof TABS)[number]['id'];
const tabOf = (a?: Anim): TabId => {
  if (!a) return 'in'; if (a.preset === CUSTOM_ID) return 'custom';
  const g = ANIM_PRESETS.find(p => p.id === a.preset)?.group;
  return TABS.find(t => (t.groups as readonly string[]).includes(g || ''))?.id || 'in';
};
const SPEEDS = [['slow', 1100], ['medium', 700], ['fast', 350]] as const;
const speedOf = (ms: number) => (ms >= 900 ? 'slow' : ms <= 450 ? 'fast' : 'medium');

/* ---------- easing curve ---------- */
const NAMED: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1], ease: [.25, .1, .25, 1], 'ease-in': [.42, 0, 1, 1], 'ease-out': [0, 0, .58, 1], 'ease-in-out': [.42, 0, .58, 1],
};
const parseEase = (v: string): [number, number, number, number] => {
  if (NAMED[v]) return NAMED[v];
  const m = /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/.exec(v);
  return m ? [+m[1], +m[2], +m[3], +m[4]] : NAMED['ease-out'];
};
const fmt = (n: number) => String(Math.round(n * 100) / 100);
const bezier = (b: number[]) => `cubic-bezier(${b.map(fmt).join(',')})`;


const W = 200, H = 148, PAD = 20, YMIN = -0.5, YMAX = 1.5;
const px = (x: number) => PAD + x * (W - PAD * 2);
const py = (y: number) => H - PAD - ((y - YMIN) / (YMAX - YMIN)) * (H - PAD * 2);
const parseBezierText = (s: string): [number, number, number, number] | null => {
  const n = s.replace(/cubic-bezier|[()]/g, '').split(/[\s,]+/).filter(Boolean).map(Number);
  return n.length === 4 && n.every(Number.isFinite) && n[0] >= 0 && n[0] <= 1 && n[2] >= 0 && n[2] <= 1 ? [n[0], n[1], n[2], n[3]] : null;
};

/** Drag the two handles to shape the easing. The curve and the stored `cubic-bezier()` string stay in step. */
function CurveEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [x1, y1, x2, y2] = parseEase(value); const svg = useRef<SVGSVGElement | null>(null); const drag = useRef<0 | 1 | 2>(0);
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, ((e.clientX - r.left) / r.width * W - PAD) / (W - PAD * 2)));
    const y = Math.min(YMAX, Math.max(YMIN, YMIN + ((H - PAD - (e.clientY - r.top) / r.height * H) / (H - PAD * 2)) * (YMAX - YMIN)));
    onChange(bezier(drag.current === 1 ? [x, y, x2, y2] : [x1, y1, x, y]));
  };
  const handle = (n: 1 | 2, hx: number, hy: number, ax: number, ay: number) => <>
    <line x1={px(ax)} y1={py(ay)} x2={px(hx)} y2={py(hy)} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx={px(ax)} cy={py(ay)} r="5" fill="gray" fillOpacity="0.55" />
    <circle cx={px(hx)} cy={py(hy)} r="6.5" fill="currentColor" stroke="white" strokeWidth="2" cursor="grab" role="slider" aria-label={`Easing handle ${n}`}
      onPointerDown={(e: React.PointerEvent) => { drag.current = n; (e.currentTarget as Element).setPointerCapture(e.pointerId); }} />
  </>;
  return <Box w="100%" rounded="16px" bg="gray-900/5" dark-bg="white/6" text="primary" display="flex" justify="center" touch-action="none">
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} width="100%" height={H} onPointerMove={move} onPointerUp={() => { drag.current = 0; }} onPointerCancel={() => { drag.current = 0; }} aria-label="Easing curve">
      <rect x={px(0)} y={py(1)} width={px(1) - px(0)} height={py(0) - py(1)} fill="none" stroke="gray" strokeOpacity="0.28" strokeDasharray="3 4" />
      <path d={`M ${px(0)} ${py(0)} C ${px(x1)} ${py(y1)}, ${px(x2)} ${py(y2)}, ${px(1)} ${py(1)}`} fill="none" stroke="gray" strokeOpacity="0.8" strokeWidth="2.5" strokeLinecap="round" />
      {handle(1, x1, y1, 0, 0)}{handle(2, x2, y2, 1, 1)}
    </svg>
  </Box>;
}

/* ---------- rows in the panel's own voice: label, value pill, control ---------- */
const PILL = { h: '30px', px: '2', fontSize: 'sm', ...T.field } as const;

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <Row items="center" gap="3" min-h="32px"><Txt fontSize="sm" m="0" w="68px" shrink="0" {...T.label}>{label}</Txt>{children}</Row>;
}

/** Value pill and a slider: the shape every numeric row in this panel takes. */
function SliderRow({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (v: number) => void }) {
  return <PropRow label={label}>
    <Box w="64px" shrink="0"><NumField value={value} min={min} max={max} step={step} suffix={suffix} onCommit={v => onChange(Math.min(max, Math.max(min, v)))} title={label} /></Box>
    <Box as="input" type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e: any) => onChange(+e.target.value)} flex="1" min-w="0" accent-color="primary" cursor="pointer" />
  </PropRow>;
}

/** Value pill with minus and plus, for offsets where a slider range would be arbitrary. */
function StepRow({ label, value, step, suffix, onChange }: { label: string; value: number; step: number; suffix?: string; onChange: (v: number) => void }) {
  const b = (sign: 1 | -1, icon: string) => <Btn type="button" aria-label={`${sign > 0 ? 'Increase' : 'Decrease'} ${label}`} onClick={() => onChange(value + sign * step)} flex="1" h="30px" border="0" cursor="pointer" display="flex" items="center" justify="center" bg="transparent" {...T.hover} {...T.text}><Ic n={icon} size={14} /></Btn>;
  return <PropRow label={label}>
    <Box w="64px" shrink="0"><NumField value={value} step={step} suffix={suffix} onCommit={onChange} title={label} /></Box>
    <Row flex="1" min-w="0" items="center" {...T.field} overflow="hidden">{b(-1, 'minus')}<Box w="1px" h="14px" bg="gray-900/12" dark-bg="white/14" />{b(1, 'plus')}</Row>
  </PropRow>;
}

const Group = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <Box display="flex" flex-col gap="2" pt="3" border-t="1px solid" {...T.hairline}>
    <Row items="baseline" justify="between" gap="2"><Txt fontSize="sm" fontWeight="700" m="0" {...T.text}>{title}</Txt>{hint && <Txt fontSize="sm" m="0" {...T.muted}>{hint}</Txt>}</Row>
    {children}
  </Box>
);

/** Spring-like easing from one cubic bezier: the second control point overshoots 1 by `bounce`. */
const springBezier = (bounce: number) => bezier([0.34, bounce, 0.64, 1]);
const kindOf = (ease: string): 'linear' | 'ease' | 'spring' => {
  if (ease === 'linear') return 'linear';
  const b = parseEase(ease); return b[1] > 1.02 || b[3] > 1.02 ? 'spring' : 'ease';
};

/** A knob that travels a track with the chosen duration, delay and easing, so the curve is felt and not just drawn. */
function EasePreview({ a, run }: { a: Anim; run: number }) {
  return <Box position="relative" h="32px" rounded="full" bg="primary" overflow="hidden" aria-label="Easing preview" title="Preview of the easing and timing">
    <Box key={run} position="absolute" top="4px" left="4px" w="24px" h="24px" rounded="full" bg="white" shadow="md" animate={`ast-knob ${Math.max(100, a.duration)}ms ${a.ease} ${Math.min(a.delay, 1500)}ms 1 both`} />
  </Box>;
}

/**
 * The Animation docker. It edits the selected object: pick a preset (In / Highlight / Loop / Out) or build your own from starting values,
 * shape the transition (Linear, Ease with a draggable curve, or Spring) and watch it on the stage.
 */
/* One preset as a card: a small stage with a mini UI card that plays the animation on a shared loop. */
const GROUP_TINT: Record<string, string> = { Entrance: '#06b6d4', Exit: '#ef4444', Attention: '#f59e0b', Loop: '#8b5cf6' };
const tintFor = (g: string) => GROUP_TINT[g] || '#3b82f6';
function PresetCard({ id, label, group, on, tick, onPick }: { id: string; label: string; group: string; on: boolean; tick: number; onPick: () => void }) {
  const [hot, setHot] = useState(false); const [own, setOwn] = useState(0);
  const c = tintFor(group); const n = parseInt(c.slice(1), 16); const rgb = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  const anim = animValue({ ...animDefaults(id), duration: 800, delay: 0, repeat: 1 });
  return <Btn type="button" role="option" aria-selected={on} title={label} onClick={() => { setOwn(o => o + 1); onPick(); }}
    onMouseEnter={() => { setHot(true); setOwn(o => o + 1); }} onMouseLeave={() => setHot(false)} onFocus={() => setHot(true)} onBlur={() => setHot(false)}
    display="flex" flex-col gap="2" p="2" min-w="0" text-align="left" cursor="pointer" rounded="18px" border="2px solid" border-color={on ? 'primary' : 'transparent'}
    bg={`rgba(${rgb}, 0.09)`} dark-bg={`rgba(${rgb}, 0.18)`} hover-border-color={on ? 'primary' : `rgba(${rgb}, 0.5)`}>
    <Box h="76px" w="100%" rounded="12px" overflow="hidden" display="flex" items="center" justify="center" bg="white" dark-bg="gray-900/60" shadow="sm">
      <Box key={`${tick}-${own}`} w="58%" h="44px" rounded="8px" p="2" display="flex" flex-col gap="1" bg={`rgba(${rgb}, 0.14)`} border="1px solid" border-color={`rgba(${rgb}, 0.35)`} animate={anim}>
        <Box h="6px" w="60%" rounded="full" bg={c} />
        <Box h="4px" w="90%" rounded="full" bg={`rgba(${rgb}, 0.4)`} />
        <Box h="4px" w="70%" rounded="full" bg={`rgba(${rgb}, 0.4)`} />
      </Box>
    </Box>
    <Row items="center" gap="1" px="1" min-w="0">
      <Txt fontSize="sm" fontWeight={on ? '700' : '600'} m="0" flex="1" min-w="0" truncate {...(on ? { text: 'primary', 'dark-text': 'white' } : T.text)}>{label}</Txt>
      {on && <Box display="flex" shrink="0" text="primary" dark-text="white"><Ic n="check" size={13} /></Box>}
    </Row>
  </Btn>;
}

/** A glowing-border or animated-background tile. Click to put it on the selected objects, click again to take it off. */
function FxTile({ fx, kind, on, onPick }: { fx: Fx; kind: 'beam' | 'bg'; on: boolean; onPick: () => void }) {
  const [a, b] = fx.colors;
  return <Btn type="button" role="option" aria-selected={on} title={fx.label} onClick={onPick} display="flex" flex-col gap="2" p="2" min-w="0" text-align="left" cursor="pointer" rounded="16px"
    border="2px solid" border-color={on ? 'primary' : 'transparent'} bg="gray-900/5" dark-bg="white/6" hover-bg="gray-900/8" dark-hover-bg="white/10">
    <div data-ui={fx.id} aria-hidden="true" style={{ height: 72, width: '100%', borderRadius: 12, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: kind === 'beam' ? '#cbd5e1' : '#475569', background: kind === 'beam' ? '#0b1020' : `linear-gradient(135deg,${a}22,${b}22)`, border: kind === 'beam' ? '0' : '1px solid rgba(148,163,184,.35)' }}>{fx.label}</div>
    <Row items="center" gap="1" px="1" min-w="0">
      <Txt fontSize="sm" fontWeight={on ? '700' : '600'} m="0" flex="1" min-w="0" truncate {...T.text}>{fx.label}</Txt>
      {on && <Box display="flex" shrink="0" text="primary" dark-text="white"><Ic n="check" size={13} /></Box>}
    </Row>
  </Btn>;
}

export function AnimationDock() {
  const s = useStudio(); const nodes = S.selNodes(s); const node = nodes[0]; const ids = nodes.map(n => n.id);
  const a = node?.anim; const [tab, setTab] = useState<TabId>(tabOf(a)); const [hover, setHover] = useState(''); const [run, setRun] = useState(0); const [bez, setBez] = useState('');
  useEffect(() => { setTab(tabOf(node?.anim)); }, [node?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const sig = a ? animValue(a) : hover; // replay whenever what will be shown changes
  useEffect(() => { if (sig) setRun(r => r + 1); }, [sig]);
  useEffect(() => { if (!a) return; const t = window.setInterval(() => setRun(r => r + 1), Math.max(1400, a.duration + a.delay + 900)); return () => window.clearInterval(t); }, [a?.duration, a?.delay, !!a]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setBez(a ? parseEase(a.ease).map(fmt).join(', ') : ''); }, [a?.ease]); // eslint-disable-line react-hooks/exhaustive-deps
  const { ref: presetRef, cols: presetCols } = useCols(132, 1, 12);
  const [tick, setTick] = useState(0);
  useEffect(() => { if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return; const id = setInterval(() => setTick(x => x + 1), 2600); return () => clearInterval(id); }, []);
  if (!node || node.type === 'page') return <EmptyState icon="sliders" title="Select an object" hint="Pick something on the canvas to give it an entrance, a highlight or a loop." />;
  const nid = node.id;
  const set = (patch: Partial<Anim> | null) => S.patchNodeProps(ids, { anim: patch === null ? undefined : { ...(a || animDefaults('fade-up')), ...patch } });
  const custom = a?.custom || customDefaults();
  const setCustom = (patch: Partial<AnimCustom>) => set({ preset: CUSTOM_ID, repeat: 1, custom: { ...custom, ...patch } });
  const pick = (id: string) => set(a && a.preset !== CUSTOM_ID ? { preset: id, repeat: LOOPING.has(id) ? 0 : a.repeat === 0 ? 1 : a.repeat } : { ...animDefaults(id) });
  const total = a ? a.delay + a.duration * (a.repeat === 0 ? 2 : a.repeat) : 1500;
  const stage: Anim | null = hover ? { ...(a || animDefaults(hover)), preset: hover, custom: undefined, repeat: LOOPING.has(hover) ? 0 : 1, trigger: 'load', delay: 0 } : a ? { ...a, trigger: 'load', repeat: a.repeat === 0 ? 0 : 1, delay: Math.min(a.delay, 600) } : null;
  const label = hover ? ANIM_PRESETS.find(p => p.id === hover)?.label : a ? (a.preset === CUSTOM_ID ? 'Custom' : ANIM_PRESETS.find(p => p.id === a.preset)?.label) : '';
  const tabGroups = (TABS.find(t => t.id === tab)?.groups || []) as readonly string[];
  const list = ANIM_PRESETS.filter(p => tabGroups.includes(p.group));
  const kind = a ? kindOf(a.ease) : 'ease';
  const plainEases = ANIM_EASES.filter(([v]) => !v.startsWith('cubic-bezier(.34'));
  const named = a ? plainEases.some(([v]) => v === a.ease) : false;
  const sec = (ms: number) => Math.round(ms / 10) / 100;
  const bounce = a ? parseEase(a.ease)[1] : 1.56;

  return <Box display="flex" flex-col gap="3" p="3" pb="4">
    {/* Stage */}
    <Box h="120px" position="relative" overflow="hidden" display="flex" items="center" justify="center" rounded="16px" bg="gray-900/5" dark-bg="white/6" aria-label="Animation preview">
      {stage
        ? <Box key={run} animate={animValue(stage)} w="52px" h="52px" rounded="14px" bg="primary" shadow="md" display="flex" items="center" justify="center" text="white"><Ic n="star" size={22} /></Box>
        : <Txt fontSize="sm" m="0" {...T.muted}>Pick an animation to preview it.</Txt>}
      {stage && <Txt position="absolute" bottom="10px" left="12px" fontSize="sm" fontWeight="600" m="0" {...T.muted}>{label}{hover ? ' · preview' : ''}</Txt>}
      {stage && <Btn type="button" title="Replay preview" aria-label="Replay preview" onClick={() => setRun(r => r + 1)} position="absolute" top="8px" right="8px" w="26px" h="26px" rounded="full" border="0" cursor="pointer" display="flex" items="center" justify="center" bg="gray-900/6" dark-bg="white/10" hover-bg="gray-900/12" dark-hover-bg="white/18" text="gray-700" dark-text="gray-200"><Ic n="refresh" size={13} /></Btn>}
    </Box>

    <Seg value={tab} options={TABS.map(t => ({ v: t.id, label: t.label }))} onChange={v => { setTab(v); if (v === 'custom' && (!a || a.preset !== CUSTOM_ID)) set({ preset: CUSTOM_ID, repeat: 1, custom: customDefaults() }); }} />

    {tab === 'fx' && (() => {
      const cur = fxIds(node.attrs?.['data-ui']);
      const toggle = (id: string, pool: Fx[]) => {
        const base = typeof node.attrs?.['data-ui'] === 'string' ? (node.attrs['data-ui'] as string).split(/\s+/).filter(Boolean) : [];
        const poolIds = pool.map(p => p.id); const had = base.includes(id);
        const next = [...base.filter(x => !poolIds.includes(x)), ...(had ? [] : [id])];
        const attrs = { ...(node.attrs || {}) } as Record<string, string | boolean>;
        if (next.length) attrs['data-ui'] = next.join(' '); else delete attrs['data-ui'];
        S.patchNodeProps(ids, { attrs: Object.keys(attrs).length ? attrs : undefined });
      };
      return <>
        <Group title="Border beam" hint="a glowing light that travels around the edge">
          <Box display="grid" grid-cols={presetCols} gap="3" role="listbox" aria-label="Border beams">
            {BEAMS.map(f => <FxTile key={f.id} fx={f} kind="beam" on={cur.includes(f.id)} onPick={() => toggle(f.id, BEAMS)} />)}
          </Box>
        </Group>
        <Group title="Animated background" hint="moves behind the content">
          <Box display="grid" grid-cols={presetCols} gap="3" role="listbox" aria-label="Animated backgrounds">
            {BACKGROUNDS.map(f => <FxTile key={f.id} fx={f} kind="bg" on={cur.includes(f.id)} onPick={() => toggle(f.id, BACKGROUNDS)} />)}
          </Box>
        </Group>
        <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Click to add an effect to {nodes.length > 1 ? `${nodes.length} objects` : 'this object'}, click again to remove it. One beam and one background can be combined. Effects need no animation preset.</Txt>
      </>;
    })()}

    {tab !== 'custom' && tab !== 'fx' && <Box ref={presetRef} display="grid" grid-cols={presetCols} gap="3" role="listbox" aria-label="Animation presets">
      {list.map(p => <PresetCard key={p.id} id={p.id} label={p.label} group={p.group} on={a?.preset === p.id} tick={tick} onPick={() => pick(p.id)} />)}
    </Box>}

    {tab === 'custom' && <Group title="Start from" hint="then settles in place">
      <SliderRow label="Opacity" value={custom.opacity} min={0} max={1} step={0.05} onChange={v => setCustom({ opacity: v })} />
      <SliderRow label="Scale" value={custom.scale} min={0} max={2} step={0.05} suffix="x" onChange={v => setCustom({ scale: v })} />
      <SliderRow label="Blur" value={custom.blur} min={0} max={40} step={1} suffix="px" onChange={v => setCustom({ blur: v })} />
      <SliderRow label="Rotate" value={custom.rotate} min={-180} max={180} step={1} suffix="°" onChange={v => setCustom({ rotate: v })} />
      <StepRow label="Offset X" value={custom.x} step={10} suffix="px" onChange={v => setCustom({ x: v })} />
      <StepRow label="Offset Y" value={custom.y} step={10} suffix="px" onChange={v => setCustom({ y: v })} />
    </Group>}

    {tab !== 'fx' && (a
      ? <>
        <Group title="Transition">
          <Seg value={kind} options={[{ v: 'linear', label: 'Linear' }, { v: 'ease', label: 'Ease' }, { v: 'spring', label: 'Spring' }]}
            onChange={v => set({ ease: v === 'linear' ? 'linear' : v === 'spring' ? springBezier(1.56) : 'cubic-bezier(.2,0,0,1)' })} />
          {kind !== 'linear' && <CurveEditor value={a.ease} onChange={v => set({ ease: v })} />}
          {kind === 'ease' && <>
            <PropRow label="Ease"><Box flex="1" min-w="0"><SelectField value={named ? a.ease : 'custom'} options={[...plainEases, ...(named ? [] : [['custom', 'Custom']] as [string, string][])]} onChange={v => v !== 'custom' && set({ ease: v })} /></Box></PropRow>
            <PropRow label="Bezier"><Box as="input" value={bez} aria-label="Cubic bezier" spellCheck={false} onChange={(e: any) => setBez(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
              onBlur={() => { const b = parseBezierText(bez); if (b) set({ ease: bezier(b) }); else setBez(parseEase(a.ease).map(fmt).join(', ')); }} flex="1" min-w="0" font-mono {...PILL} /></PropRow>
          </>}
          {kind === 'spring' && <SliderRow label="Bounce" value={Math.round((bounce - 1) * 100) / 100} min={0.1} max={1.2} step={0.05} onChange={v => set({ ease: springBezier(1 + v) })} />}
          <SliderRow label="Time" value={sec(a.duration)} min={0.1} max={3} step={0.05} suffix="s" onChange={v => set({ duration: Math.round(v * 1000) })} />
          <SliderRow label="Delay" value={sec(a.delay)} min={0} max={3} step={0.05} suffix="s" onChange={v => set({ delay: Math.round(v * 1000) })} />
          <PropRow label="Preview"><Box flex="1" min-w="0"><EasePreview a={a} run={run} /></Box></PropRow>
        </Group>

        <Group title="Play">
          <Seg value={a.trigger} options={[{ v: 'load', label: 'Load' }, { v: 'scroll', label: 'Scroll' }, { v: 'hover', label: 'Hover' }, { v: 'click', label: 'Click' }]} onChange={v => set({ trigger: v })} />
          <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>{a.trigger === 'scroll' ? 'Starts when the object scrolls into view.' : a.trigger === 'hover' ? 'Plays each time the pointer enters the object.' : a.trigger === 'click' ? 'Plays each time the object is clicked.' : 'Starts when the page loads.'} Runs in exported pages and previews.</Txt>
          <Row gap="3" items="center">
            <Box w="96px" shrink="0"><NumField label="Repeat" value={a.repeat === 0 ? 1 : a.repeat} min={1} disabled={a.repeat === 0} onCommit={v => set({ repeat: Math.max(1, Math.round(v)) })} /></Box>
            <Box flex="1" pt="4"><Checkbox label="Loop forever" checked={a.repeat === 0} onChange={v => set({ repeat: v ? 0 : 1 })} /></Box>
          </Row>
        </Group>

        <Row gap="2">
          <Btn type="button" onClick={() => S.playAnim(nid, total)} flex="1" h="34px" rounded="12px" border="0" cursor="pointer" fontSize="sm" fontWeight="600" bg="primary" hover-bg="primary/90" text="white">Play on canvas</Btn>
          <Btn type="button" onClick={() => { S.stopAnim(); set(null); }} h="34px" px="4" cursor="pointer" fontSize="sm" fontWeight="500" border="0" rounded="12px" bg="gray-900/6" dark-bg="white/8" hover-bg="gray-900/10" dark-hover-bg="white/12" {...T.text}>Remove</Btn>
        </Row>
      </>
      : tab !== 'custom' && <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Hover a preset to see it on the stage, click to apply it to {nodes.length > 1 ? `${nodes.length} objects` : 'this object'}.</Txt>)}
  </Box>;
}

/** Kept for callers that still embed the fields inside another panel. */
export function AnimationFields({ node }: { node: Node; ids: string[] }) {
  return <Txt fontSize="sm" m="0" px="3" py="2" {...T.muted}>Open the Animation panel to edit {node.anim ? 'this animation' : 'animation for this object'}.</Txt>;
}
