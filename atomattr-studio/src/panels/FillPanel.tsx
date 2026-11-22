import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import type { Node, Style } from '../document/types';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { explicitStyle } from '../document/style';
import { Checkbox, ColorField, EmptyState, Glyph, IconBtn, Label, NumField, Section, Seg } from '../components/ui';
import { T, SWATCHES } from '../theme';
import { ColorPicker } from '../exporters/ColorPicker';
import { defaultGradient, firstColor, gradientCss, isGradient, mixColor, parseColor, parseGradient, toHex, type Grad, type GradKind } from '../document/fx';
import { pickFile, readImage, registerAsset } from '../state/assets';
import { STOCK_BACKGROUNDS } from '../document/stock';
import { uid } from '../document/tree';

/* ---------- Fill panel ----------
   Layout: a live preview, five fill-type tiles, then the editor for that type. Gradients get draggable stops on the bar,
   a dial for the angle, a drag pad for the centre and a built-in colour picker for the selected stop. */

/** What the panels show: the box at this size, with the state being edited (hover, focus ...) laid over it. */
const sty = (n: Node, bp: any): Style => { const st = S.getState().attrState; return st === 'base' ? explicitStyle(n, bp) : { ...explicitStyle(n, bp), ...(n.states?.[st] || {}) }; };
const same = <V,>(vals: V[]) => (vals.every(v => v === vals[0]) ? vals[0] : undefined);
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** Transparent-colour checkerboard, drawn as a background image so it needs no CSS. */
const CHECKER = 'repeating-conic-gradient(rgba(148,163,184,0.38) 0% 25%, transparent 0% 50%)';
const Checker = () => <Box position="absolute" inset="0" bg-image={CHECKER} bg-size="10px 10px" pointer-events="none" />;

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', 'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)', 'linear-gradient(180deg, #0f172a 0%, #334155 100%)',
  'linear-gradient(90deg, #22c55e 0%, #a3e635 100%)', 'linear-gradient(135deg, #fde68a 0%, #f472b6 50%, #818cf8 100%)', 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%)', 'linear-gradient(160deg, #1e1b4b 0%, #7c3aed 55%, #fb7185 100%)',
  'linear-gradient(135deg, #ffedd5 0%, #fed7aa 45%, #fdba74 100%)', 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)', 'radial-gradient(circle at 50% 50%, #ffffff 0%, #6366f1 100%)', 'conic-gradient(from 0deg at 50% 50%, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)',
];

const KINDS: { v: 'none' | 'solid' | GradKind; label: string }[] = [
  { v: 'none', label: 'None' }, { v: 'solid', label: 'Solid' }, { v: 'linear', label: 'Linear' }, { v: 'radial', label: 'Radial' }, { v: 'conic', label: 'Conic' },
];

/** What each type tile shows inside it. */
function tilePreview(v: string, colour: string): string | undefined {
  const c2 = '#ec4899';
  if (v === 'solid') return `linear-gradient(${colour}, ${colour})`;
  if (v === 'linear') return `linear-gradient(135deg, ${colour}, ${c2})`;
  if (v === 'radial') return `radial-gradient(circle at 50% 50%, ${colour}, ${c2})`;
  if (v === 'conic') return `conic-gradient(from 0deg at 50% 50%, ${colour}, ${c2}, ${colour})`;
  return undefined;
}

function TypeTiles({ value, colour, onChange }: { value: string; colour: string; onChange: (v: string) => void }) {
  return (
    <Box display="grid" grid-cols="5" gap="2" role="radiogroup" aria-label="Fill type">
      {KINDS.map(k => {
        const on = value === k.v; const img = tilePreview(k.v, colour);
        return (
          <Btn key={k.v} type="button" role="radio" aria-checked={on} onClick={() => onChange(k.v)} p="0" border="0" bg="transparent" cursor="pointer" display="flex" flex-col items="center" gap="1" transition="all" duration="180" {...(on ? {} : { 'hover-translate-y': '-1px' })}>
            <Box position="relative" w="100%" h="38px" overflow="hidden" rounded="lg" border="2px solid" transition="all" duration="180" shadow={on ? 'md' : 'none'}
              {...(on ? { 'border-color': 'primary' } : { 'border-color': 'gray-200', 'dark-border-color': 'gray-700', 'hover-border-color': 'gray-400' })}>
              <Checker />
              {img ? <Box position="absolute" inset="0" bg-image={img} /> : (
                <Box position="absolute" inset="0" display="flex" items="center" justify="center" {...T.muted}><Glyph n="x" size={14} /></Box>
              )}
            </Box>
            <Txt fontSize="sm" fontWeight={on ? '700' : '500'} m="0" transition="all" duration="180" {...(on ? { text: 'primary', 'dark-text': 'white' } : T.label)}>{k.label}</Txt>
          </Btn>
        );
      })}
    </Box>
  );
}

/** Big read-only look at the fill as it is right now, with a one-line summary of what it is. */
function Preview({ css, summary }: { css?: string; summary: string }) {
  return (
    <Box position="relative" w="100%" h="84px" overflow="hidden" rounded="lg" border="1px solid" {...T.hairline} animate="studio-fade 220ms ease-out both">
      <Checker />
      {css ? <Box position="absolute" inset="0" bg-image={isGradient(css) ? css : `linear-gradient(${css}, ${css})`} transition="all" duration="200" /> : null}
      <Box position="absolute" left="2" bottom="2" px="2" py="1" rounded="lg" bg="black/55" text="white" fontSize="sm" fontWeight="600" backdrop-blur="md">{summary}</Box>
    </Box>
  );
}

/** Rotary control for gradient angles. Drag anywhere on the dial; hold Shift to snap to 15°. */
function Dial({ value, onChange, size = 60 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const drag = useRef(false);
  const set = (e: React.PointerEvent) => {
    const r = (e.currentTarget as Element).getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2); const dy = e.clientY - (r.top + r.height / 2);
    let a = (Math.atan2(dx, -dy) * 180) / Math.PI; if (a < 0) a += 360; a = e.shiftKey ? Math.round(a / 15) * 15 : Math.round(a);
    onChange(a % 360);
  };
  const rad = (value * Math.PI) / 180; const c = size / 2; const r = c - 9;
  return (
    <Box touch-action="none" lh="0" cursor="grab" shrink="0" title="Drag to set the angle · Shift snaps to 15°"
      onPointerDown={(e: React.PointerEvent) => { if (e.button !== 0) return; drag.current = true; (e.currentTarget as Element).setPointerCapture(e.pointerId); e.preventDefault(); set(e); }}
      onPointerMove={(e: React.PointerEvent) => { if (drag.current) set(e); }}
      onPointerUp={(e: React.PointerEvent) => { drag.current = false; try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* released */ } }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="slider" aria-label="Angle" aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(value)}>
        <circle cx={c} cy={c} r={c - 2} fill="currentColor" fillOpacity=".06" stroke="currentColor" strokeOpacity=".22" />
        {[0, 90, 180, 270].map(a => <line key={a} x1={c + (c - 5) * Math.sin((a * Math.PI) / 180)} y1={c - (c - 5) * Math.cos((a * Math.PI) / 180)} x2={c + (c - 9) * Math.sin((a * Math.PI) / 180)} y2={c - (c - 9) * Math.cos((a * Math.PI) / 180)} stroke="currentColor" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round" />)}
        <line x1={c} y1={c} x2={c + r * Math.sin(rad)} y2={c - r * Math.cos(rad)} stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={c} cy={c} r="3" fill="#6366f1" />
        <circle cx={c + r * Math.sin(rad)} cy={c - r * Math.cos(rad)} r="6" fill="#fff" stroke="#6366f1" strokeWidth="2.5" />
      </svg>
    </Box>
  );
}

/** Drag a dot inside a small pad to place the centre of a radial or conic gradient. */
function CenterPad({ cx, cy, onChange }: { cx: number; cy: number; onChange: (x: number, y: number) => void }) {
  const drag = useRef(false);
  const set = (e: React.PointerEvent) => { const r = (e.currentTarget as Element).getBoundingClientRect(); onChange(Math.round(clamp(((e.clientX - r.left) / r.width) * 100, 0, 100)), Math.round(clamp(((e.clientY - r.top) / r.height) * 100, 0, 100))); };
  return (
    <Box position="relative" w="104px" h="68px" shrink="0" rounded="lg" cursor="crosshair" touch-action="none" overflow="hidden" border="1px solid" {...T.hairline} bg="gray-900/5" dark-bg="white/6" title="Drag to move the centre"
      onPointerDown={(e: React.PointerEvent) => { if (e.button !== 0) return; drag.current = true; (e.currentTarget as Element).setPointerCapture(e.pointerId); e.preventDefault(); set(e); }}
      onPointerMove={(e: React.PointerEvent) => { if (drag.current) set(e); }}
      onPointerUp={(e: React.PointerEvent) => { drag.current = false; try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* released */ } }}>
      <Box position="absolute" left="50%" top="0" w="1px" h="100%" bg="gray-300" dark-bg="gray-600" />
      <Box position="absolute" top="50%" left="0" h="1px" w="100%" bg="gray-300" dark-bg="gray-600" />
      <Box position="absolute" left={`${cx}%`} top={`${cy}%`} w="14px" h="14px" rounded="full" bg="white" border="2.5px solid" border-color="primary" shadow="md" transform="translate(-50%, -50%)" />
    </Box>
  );
}

/** Gradient editor: stops live on the bar. Click the bar to add one, drag to move, Delete to remove, then recolour it below. */
function GradientEditor({ g, onChange }: { g: Grad; onChange: (g: Grad) => void }) {
  const [sel, setSel] = useState(0); const bar = useRef<HTMLDivElement | null>(null); const moving = useRef<number | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const stops = g.stops; const i = clamp(sel, 0, stops.length - 1); const cur = stops[i];
  useEffect(() => { if (sel > stops.length - 1) setSel(stops.length - 1); }, [stops.length, sel]);
  const upd = (k: number, patch: Partial<Grad['stops'][number]>) => onChange({ ...g, stops: stops.map((x, n) => (n === k ? { ...x, ...patch } : x)) });
  const posAt = (clientX: number) => { const r = bar.current!.getBoundingClientRect(); return clamp(Math.round(((clientX - r.left) / r.width) * 100), 0, 100); };
  const addAt = (pos: number) => {
    const sorted = [...stops].sort((a, b) => a.pos - b.pos); let lo = sorted[0]; let hi = sorted[sorted.length - 1];
    for (let k = 0; k < sorted.length - 1; k += 1) if (pos >= sorted[k].pos && pos <= sorted[k + 1].pos) { lo = sorted[k]; hi = sorted[k + 1]; }
    const t = hi.pos === lo.pos ? 0 : clamp((pos - lo.pos) / (hi.pos - lo.pos), 0, 1);
    onChange({ ...g, stops: [...stops, { pos, color: mixColor(lo.color, hi.color, t) }] }); setSel(stops.length);
  };
  const remove = (k: number) => { if (stops.length <= 2) return; onChange({ ...g, stops: stops.filter((_, n) => n !== k) }); setSel(0); };
  const preview = gradientCss({ ...g, kind: 'linear', angle: 90 });
  const c = parseColor(cur.color); const hex = c ? toHex(c) : '#000000';

  return (
    <Box display="flex" flex-col gap="3">
      {/* the bar: gradient with a handle per stop */}
      <Box px="2" pt="1" pb="5">
        <Box ref={bar} position="relative" h="30px" rounded="full" cursor="copy" title="Click to add a stop" border="1px solid" {...T.hairline}
          onPointerDown={(e: React.PointerEvent) => { if (e.button === 0) addAt(posAt(e.clientX)); }}>
          <Box position="absolute" inset="0" rounded="full" overflow="hidden" pointer-events="none"><Checker /><Box position="absolute" inset="0" bg-image={preview} /></Box>
          {stops.map((st, k) => {
            const on = k === i; const col = parseColor(st.color);
            return (
              <Btn key={k} type="button" role="slider" aria-label={`Stop ${k + 1}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(st.pos)} title={`${Math.round(st.pos)}% · Delete removes`}
                onPointerDown={(e: React.PointerEvent) => { if (e.button !== 0) return; e.stopPropagation(); (e.currentTarget as Element).setPointerCapture(e.pointerId); moving.current = k; setSel(k); e.preventDefault(); }}
                onPointerMove={(e: React.PointerEvent) => { if (moving.current === k) upd(k, { pos: posAt(e.clientX) }); }}
                onPointerUp={(e: React.PointerEvent) => { moving.current = null; try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* released */ } }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(k); }
                  else if (e.key === 'ArrowLeft') { e.preventDefault(); upd(k, { pos: clamp(st.pos - (e.shiftKey ? 10 : 1), 0, 100) }); }
                  else if (e.key === 'ArrowRight') { e.preventDefault(); upd(k, { pos: clamp(st.pos + (e.shiftKey ? 10 : 1), 0, 100) }); }
                  e.stopPropagation();
                }}
                position="absolute" top="50%" left={`${st.pos}%`} w={on ? '22px' : '18px'} h={on ? '22px' : '18px'} p="0" rounded="full" border={on ? '3px solid' : '2.5px solid'} border-color="white" cursor="grab" touch-action="none" outline="none"
                transform="translate(-50%, -50%)" transition="all" duration="140" z={on ? '3' : '2'} shadow={on ? 'lg' : 'md'} bg={col ? toHex(col) : st.color}
                animate="studio-pop 200ms cubic-bezier(0.2, 0.8, 0.2, 1) both">
              </Btn>
            );
          })}
        </Box>
      </Box>

      {/* selected stop: swatch, position, remove */}
      <Row items="end" gap="2">
        <Box flex="1" min-w="0"><NumField label={`Stop ${i + 1} position`} value={Math.round(cur.pos)} min={0} max={100} suffix="%" onCommit={v => upd(i, { pos: v })} /></Box>
        <Box w="72px" shrink="0"><NumField label="Opacity" value={Math.round((c?.a ?? 1) * 100)} min={0} max={100} suffix="%" onCommit={v => c && upd(i, { color: `rgba(${c.r},${c.g},${c.b},${v / 100})` })} /></Box>
        <IconBtn icon="trash" title="Remove this stop" size={30} danger disabled={stops.length <= 2} onClick={() => remove(i)} />
      </Row>

      <Btn type="button" onClick={() => setShowPicker(!showPicker)} aria-expanded={showPicker} display="flex" items="center" gap="2" h="30px" px="2" rounded="lg" border="0" cursor="pointer" bg="transparent" {...T.hover} {...T.text} fontSize="sm" fontWeight="600" transition="all" duration="150">
        <Box w="16px" h="16px" rounded="lg" shrink="0" border="1px solid" border-color="gray-300" dark-border-color="gray-600" bg={hex} />
        <Txt as="span" fontSize="sm" m="0" flex="1" text-align="left">Edit stop colour</Txt>
        <Box display="flex" transform={showPicker ? 'rotate(0deg)' : 'rotate(-90deg)'} transition="all" duration="180" {...T.label}><Glyph n="chevron" size={14} /></Box>
      </Btn>
      {showPicker ? (
        <Box key={i} display="flex" justify="center" animate="studio-pop-down 200ms cubic-bezier(0.2, 0.8, 0.2, 1) both">
          <ColorPicker value={cur.color} onChange={v => upd(i, { color: v })} onCommit={v => S.pushRecentColor(v)} />
        </Box>
      ) : null}

      {/* angle / centre */}
      {g.kind !== 'radial' && (
        <Row items="center" gap="3">
          <Dial value={g.angle} onChange={a => onChange({ ...g, angle: a })} />
          <Box flex="1" display="flex" flex-col gap="2" min-w="0">
            <NumField label={g.kind === 'conic' ? 'Start angle' : 'Angle'} value={Math.round(g.angle)} min={0} max={360} suffix="°" onCommit={v => onChange({ ...g, angle: v % 360 })} />
            <Row gap="1">
              {[0, 45, 90, 135, 180, 270].map(a => (
                <Btn key={a} type="button" title={`${a}°`} aria-label={`${a} degrees`} onClick={() => onChange({ ...g, angle: a })} flex="1" h="24px" p="0" rounded="lg" border="0" cursor="pointer" fontSize="sm" fontWeight="600" transition="all" duration="150"
                  {...(Math.round(g.angle) === a ? T.active : { bg: 'gray-100', 'dark-bg': 'gray-800', ...T.label, 'hover-bg': 'gray-200', 'dark-hover-bg': 'gray-700' })}>{a}</Btn>
              ))}
            </Row>
          </Box>
        </Row>
      )}
      {g.kind !== 'linear' && (
        <Row items="center" gap="3">
          <CenterPad cx={g.cx} cy={g.cy} onChange={(x, y) => onChange({ ...g, cx: x, cy: y })} />
          <Box flex="1" display="flex" flex-col gap="2" min-w="0">
            <Row gap="2"><NumField label="X" value={Math.round(g.cx)} suffix="%" onCommit={v => onChange({ ...g, cx: v })} /><NumField label="Y" value={Math.round(g.cy)} suffix="%" onCommit={v => onChange({ ...g, cy: v })} /></Row>
            {g.kind === 'radial' && <Seg value={g.shape} options={[{ v: 'ellipse', label: 'Ellipse' }, { v: 'circle', label: 'Circle' }]} onChange={v => onChange({ ...g, shape: v })} />}
          </Box>
        </Row>
      )}

      <Row gap="2">
        <ActionBtn label="Reverse" onClick={() => onChange({ ...g, stops: stops.map(x => ({ ...x, pos: 100 - x.pos })) })} />
        <ActionBtn label="Space evenly" onClick={() => { const sorted = [...stops].sort((a, b) => a.pos - b.pos); onChange({ ...g, stops: sorted.map((x, k) => ({ ...x, pos: Math.round((k / (sorted.length - 1)) * 100) })) }); setSel(0); }} />
      </Row>
    </Box>
  );
}

function ActionBtn({ label, onClick, primary, disabled, title }: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean; title?: string }) {
  return (
    <Btn type="button" title={title} onClick={disabled ? undefined : onClick} flex="1" h="30px" px="3" rounded="lg" border="0" fontSize="sm" fontWeight="600" cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? '40' : '100'} transition="all" duration="150"
      {...(primary ? { bg: 'primary', text: 'white', 'hover-bg': 'primary/90', 'active-scale': '0.97' } : { bg: 'gray-100', 'dark-bg': 'gray-800', ...T.text, 'hover-bg': 'gray-200', 'dark-hover-bg': 'gray-700', 'active-scale': '0.97' })}>{label}</Btn>
  );
}

const POSITIONS: [string, string][] = [['top left', '↖'], ['top', '↑'], ['top right', '↗'], ['left', '←'], ['center', '•'], ['right', '→'], ['bottom left', '↙'], ['bottom', '↓'], ['bottom right', '↘']];

/* ======================================================================== Fill */
export function FillPanel() {
  const s = useStudio(); const nodes = S.selNodes(s); const bp = s.bp; const p = s.project!;
  const [dropping, setDropping] = useState(false);
  if (!nodes.length) return <EmptyState icon="palette" title="Nothing selected" hint="Select an object to edit its fill, gradient or background image." />;
  const ids = nodes.map(n => n.id); const n0 = nodes[0]; const st0 = sty(n0, bp); const put = (patch: Style) => S.patchNodes(ids, patch);
  const fill = same(nodes.map(n => sty(n, bp).fill)); const grad = parseGradient(fill);
  const kind: 'none' | 'solid' | GradKind = !fill ? 'none' : grad ? grad.kind : isGradient(fill) ? 'linear' : 'solid';
  const setKind = (k: string) => {
    if (k === 'none') { put({ fill: undefined }); return; }
    if (k === 'solid') { put({ fill: firstColor(fill) || '#6366f1' }); return; }
    const base = grad || defaultGradient(firstColor(fill), '#ec4899'); put({ fill: gradientCss({ ...base, kind: k as GradKind, angle: k === 'radial' ? 0 : base.angle || 135 }) });
  };
  const setGrad = (g: Grad) => put({ fill: gradientCss(g) });
  const isText = nodes.every(n => n.type === 'text' || n.type === 'heading' || n.type === 'button');
  const asset = p.assets.find(a => a.id === st0.fillImg);
  const sizeMode = st0.bgSize === 'contain' ? 'contain' : st0.bgSize === '100% 100%' ? 'stretch' : st0.bgRepeat === 'repeat' ? 'tile' : 'cover';
  const setSize = (m: string) => put(m === 'cover' ? { bgSize: 'cover', bgRepeat: 'no-repeat' } : m === 'contain' ? { bgSize: 'contain', bgRepeat: 'no-repeat' } : m === 'stretch' ? { bgSize: '100% 100%', bgRepeat: 'no-repeat' } : { bgSize: 'auto', bgRepeat: 'repeat' });
  const useImage = (id: string) => put({ fillImg: id, bgSize: st0.bgSize || 'cover', bgPos: st0.bgPos || 'center', bgRepeat: st0.bgRepeat || 'no-repeat' });
  const ingest = async (f: File | null) => { if (!f) return; const r = await readImage(f); if (!r) return; useImage(registerAsset(r.asset).id); };
  const upload = async () => ingest(await pickFile('image/*'));
  const tint = parseColor(st0.bgTint); const tintHex = tint ? toHex(tint) : '#0f172a';
  const colour = firstColor(fill);
  const swatches = [...SWATCHES, ...p.colors];
  const imgSrc = asset?.dataUrl;
  const summary = kind === 'none' ? 'No fill' : kind === 'solid' ? String(fill).toUpperCase() : grad ? `${kind[0].toUpperCase()}${kind.slice(1)} · ${grad.stops.length} stops${kind === 'radial' ? '' : ` · ${Math.round(grad.angle)}°`}` : 'CSS gradient';

  return (
    <Box>
      <Section title="Fill">
        <Preview css={fill} summary={summary} />
        <TypeTiles value={kind} colour={colour} onChange={setKind} />

        {kind === 'solid' && (
          <Box key="solid" display="flex" flex-col gap="3" animate="studio-fade 200ms ease-out both">
            <Box display="flex" justify="center"><ColorPicker value={fill} recent={s.recentColors} onChange={v => put({ fill: v })} onCommit={v => S.pushRecentColor(v)} /></Box>
            <Box>
              <Label>Document colours</Label>
              <Row gap="2" wrap="wrap" mt="1">
                {swatches.map((c, k) => (
                  <Btn key={`${c}-${k}`} type="button" title={c} aria-label={`Use ${c}`} onClick={() => { put({ fill: c }); S.pushRecentColor(c); }} w="22px" h="22px" p="0" rounded="full" cursor="pointer" bg={c} border="2px solid" transition="all" duration="150"
                    {...(String(fill).toLowerCase() === c.toLowerCase() ? { 'border-color': 'primary', scale: '1.12' } : { 'border-color': 'gray-200', 'dark-border-color': 'gray-700', 'hover-scale': '1.18' })} />
                ))}
              </Row>
            </Box>
          </Box>
        )}

        {grad && <Box key={grad.kind} animate="studio-fade 200ms ease-out both"><GradientEditor g={grad} onChange={setGrad} /></Box>}
        {kind === 'linear' && !grad && <ColorField label="CSS gradient" value={fill} onChange={v => put({ fill: v })} />}

        <Box>
          <Label>Gradient presets</Label>
          <Box display="grid" grid-cols="4" gap="2" mt="1">
            {GRADIENT_PRESETS.map(gp => (
              <Btn key={gp} type="button" title="Apply gradient" aria-label="Apply gradient preset" onClick={() => put({ fill: gp })} h="34px" p="0" rounded="lg" cursor="pointer" bg-image={gp} border="1px solid" {...T.hairline} transition="all" duration="160" hover-scale="1.07" hover-shadow="md" active-scale="0.97" />
            ))}
          </Box>
        </Box>
        <Txt fontSize="sm" m="0" {...T.muted}>Tip: press F for the Interactive fill tool and drag across the object to aim the gradient. Hold Alt for radial.</Txt>
      </Section>

      <Section title="Background image">
        {imgSrc ? (
          <Box position="relative" w="100%" h="120px" overflow="hidden" rounded="lg" border="1px solid" {...T.hairline} animate="studio-pop 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both">
            <Checker />
            <Box as="img" src={imgSrc} alt={asset?.name || 'Background'} position="absolute" inset="0" w="100%" h="100%" object-fit={sizeMode === 'contain' ? 'contain' : sizeMode === 'stretch' ? 'fill' : 'cover'} />
            <Row position="absolute" left="2" bottom="2" gap="2">
              <Btn type="button" onClick={upload} h="26px" px="3" rounded="lg" border="0" fontSize="sm" fontWeight="700" cursor="pointer" bg="white/90" text="gray-900" backdrop-blur="md" transition="all" duration="150" hover-scale="1.05">Replace</Btn>
              <Btn type="button" onClick={() => put({ fillImg: undefined })} h="26px" px="3" rounded="lg" border="0" fontSize="sm" fontWeight="700" cursor="pointer" bg="black/60" text="white" backdrop-blur="md" transition="all" duration="150" hover-scale="1.05">Remove</Btn>
            </Row>
          </Box>
        ) : (
          <Box role="button" tabIndex={0} aria-label="Upload a background image" onClick={upload} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); upload(); } e.stopPropagation(); }}
            onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDropping(true); }} onDragLeave={() => setDropping(false)} onDrop={(e: React.DragEvent) => { e.preventDefault(); setDropping(false); ingest(e.dataTransfer.files?.[0] || null); }}
            w="100%" h="96px" rounded="lg" border="2px dashed" cursor="pointer" display="flex" flex-col items="center" justify="center" gap="1" transition="all" duration="180"
            {...(dropping ? { 'border-color': 'primary', bg: 'primary/10', text: 'primary', scale: '1.015' } : { 'border-color': 'gray-300', 'dark-border-color': 'gray-600', bg: 'transparent', 'hover-border-color': 'primary', 'hover-bg': 'primary/5', ...T.label })}>
            <Glyph n="upload" size={20} />
            <Txt fontSize="sm" fontWeight="600" m="0" {...T.text}>{dropping ? 'Drop to use' : 'Upload or drop an image'}</Txt>
            <Txt fontSize="sm" m="0" {...T.muted}>PNG, JPG, SVG or WebP · up to 6 MB</Txt>
          </Box>
        )}

        {STOCK_BACKGROUNDS.length > 0 && (
          <Box>
            <Label>Built-in library</Label>
            <Box display="grid" grid-cols="4" gap="2" mt="1">
              {STOCK_BACKGROUNDS.map(b => (
                <Btn key={b.id} type="button" title={b.name} aria-label={`Use ${b.name}`} aria-pressed={asset?.dataUrl === b.src} onClick={() => useImage(registerAsset({ id: uid(), name: `${b.name}.svg`, mime: 'image/svg+xml', dataUrl: b.src }).id)} h="44px" p="0" rounded="lg" cursor="pointer" overflow="hidden" border="2px solid" transition="all" duration="160" bg-image={`url("${b.src}")`} bg-size="cover" bg-position="center"
                  {...(asset?.dataUrl === b.src ? { 'border-color': 'primary', scale: '1.04' } : { 'border-color': 'transparent', 'hover-scale': '1.06', 'hover-shadow': 'md' })} />
              ))}
            </Box>
          </Box>
        )}

        {p.assets.length > 0 && (
          <Box>
            <Label>Your images</Label>
            <Box display="grid" grid-cols="4" gap="2" mt="1">
              {p.assets.map(a => (
                <Btn key={a.id} type="button" title={a.name} aria-label={`Use ${a.name}`} aria-pressed={st0.fillImg === a.id} onClick={() => useImage(a.id)} h="44px" p="0" rounded="lg" cursor="pointer" overflow="hidden" border="2px solid" transition="all" duration="160" bg-image={`url("${a.dataUrl}")`} bg-size="cover" bg-position="center"
                  {...(st0.fillImg === a.id ? { 'border-color': 'primary', scale: '1.04' } : { 'border-color': 'transparent', 'hover-scale': '1.06', 'hover-shadow': 'md' })} />
              ))}
            </Box>
          </Box>
        )}

        {imgSrc && (
          <Box display="flex" flex-col gap="3" animate="studio-fade 220ms ease-out both">
            <Seg label="Size" value={sizeMode} options={[{ v: 'cover', label: 'Cover' }, { v: 'contain', label: 'Fit' }, { v: 'stretch', label: 'Stretch' }, { v: 'tile', label: 'Tile' }]} onChange={setSize} />
            <Row gap="3" items="center">
              <Box display="grid" grid-cols="3" gap="1" shrink="0" role="group" aria-label="Image position">
                {POSITIONS.map(([v, glyph]) => {
                  const on = (st0.bgPos || 'center') === v;
                  return <Btn key={v} type="button" title={v} aria-pressed={on} onClick={() => put({ bgPos: v })} w="26px" h="26px" p="0" rounded="lg" border="0" cursor="pointer" fontSize="sm" fontWeight="700" transition="all" duration="150"
                    {...(on ? { bg: 'primary', text: 'white', scale: '1.08' } : { bg: 'gray-100', 'dark-bg': 'gray-800', 'hover-bg': 'gray-200', 'dark-hover-bg': 'gray-700', ...T.label })}>{glyph}</Btn>;
                })}
              </Box>
              <Box flex="1" min-w="0"><Label>Position</Label><Txt fontSize="sm" m="0" {...T.text}>{st0.bgPos || 'center'}</Txt></Box>
            </Row>
            <Checkbox checked={!!st0.bgFixed} onChange={v => put({ bgFixed: v })} label="Fixed on scroll (parallax)" />
            <Row gap="2" items="end"><ColorField label="Tint over image" value={st0.bgTint ? tintHex : undefined} allowNone onChange={v => put({ bgTint: v ? `rgba(${parseColor(v)!.r},${parseColor(v)!.g},${parseColor(v)!.b},${tint ? tint.a : 0.35})` : undefined })} />
              {st0.bgTint && <NumField label="%" title="Tint opacity" value={Math.round((tint?.a ?? 0.35) * 100)} min={0} max={100} onCommit={v => put({ bgTint: `rgba(${tint?.r ?? 15},${tint?.g ?? 23},${tint?.b ?? 42},${v / 100})` })} />}</Row>
          </Box>
        )}
        {n0.type === 'image' && <ActionBtn label="Use this image as its section background" onClick={S.useImageAsBackground} title="Moves the picture into the parent section’s background" />}
      </Section>

      {isText && <Section title="Fill the letters">
        <Checkbox checked={!!st0.clipText} onChange={v => put({ clipText: v })} label="Clip fill, gradient or image to the text" />
        <Txt fontSize="sm" m="0" {...T.muted}>The letters become a window onto the fill above and the background image. Exports as background-clip: text.</Txt>
        {!st0.clipText && <ActionBtn primary label="Make gradient text" onClick={() => { S.begin0(); put({ clipText: true, fill: fill && isGradient(fill) ? fill : gradientCss(defaultGradient('#6366f1', '#ec4899')) }); S.end0(); }} />}
      </Section>}
    </Box>
  );
}
