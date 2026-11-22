import { useEffect, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import type { Node, Style } from '../document/types';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { explicitStyle } from '../document/style';
import { IconBtn, NumField, Section, SelectField, Seg, TextField, ColorField, EmptyState, Label, Checkbox } from '../components/ui';
import { Ic } from '../components/Icons';
import { ToolIcon } from '../components/ToolIcons';
import { T } from '../theme';
import { CLIP_PRESETS, defaultGradient, fadeCss, fadeOff, firstColor, gradientCss, isGradient, mixColor, parseColor, parseFade, parseGradient, toHex, type Grad, type GradKind } from '../document/fx';
import { pickFile, readImage, registerAsset } from '../state/assets';
import { reversePts, simplifyPts, smoothAll, symmetric, toCurves, toLines } from '../document/vector';

/** What the panels show: the box at this size, with the state being edited (hover, focus ...) laid over it. */
const sty = (n: Node, bp: any): Style => { const st = S.getState().attrState; return st === 'base' ? explicitStyle(n, bp) : { ...explicitStyle(n, bp), ...(n.states?.[st] || {}) }; };
const same = <T,>(vals: T[]) => (vals.every(v => v === vals[0]) ? vals[0] : undefined);
const btn = (label: string, onClick: () => void, opts: { primary?: boolean; disabled?: boolean; title?: string } = {}) =>
  <Btn type="button" title={opts.title} onClick={opts.disabled ? undefined : onClick} h="28px" px="2" fontSize="sm" fontWeight="600" cursor={opts.disabled ? 'not-allowed' : 'pointer'} opacity={opts.disabled ? '0.4' : '1'} {...(opts.primary ? { border: '0', bg: 'primary', text: 'white' } : T.card)}>{label}</Btn>;

export { FillPanel } from './FillPanel';

/* ======================================================================== Effects */
const BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'soft-light', 'hard-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
function parseShadow(v?: string) { const m = /(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px(?:\s+(-?[\d.]+)px)?\s+(.+)$/.exec(v || ''); return m ? { x: +m[1], y: +m[2], blur: +m[3], spread: m[4] ? +m[4] : 0, color: m[5] } : { x: 0, y: 8, blur: 24, spread: 0, color: 'rgba(0,0,0,0.25)' }; }

export function EffectsPanel() {
  const s = useStudio(); const nodes = S.selNodes(s); const bp = s.bp;
  const [fxOpen, setFxOpen] = useState(0); useEffect(() => setFxOpen(0), [s.sel.join()]); void fxOpen;
  if (!nodes.length) return <EmptyState icon="sparkle" title="Nothing selected" hint="Select an object, then use these effects or the interactive tools (F, Y, K, W, Q)." />;
  const ids = nodes.map(n => n.id); const n0 = nodes[0]; const st0 = sty(n0, bp); const put = (patch: Style) => S.patchNodes(ids, patch);
  const fade = parseFade(st0.fade); const setFade = (f: Partial<typeof fade>) => put({ fade: fadeCss({ ...(fade.kind === 'none' ? { ...fadeOff, kind: 'linear' as const } : fade), ...f }) });
  const tkind = st0.fade ? fade.kind : (st0.opacity !== undefined && st0.opacity !== 1 ? 'uniform' : 'none');
  const sh = parseShadow(st0.shadowCss); const setShadow = (p: Partial<typeof sh>) => { const n = { ...sh, ...p }; put({ shadowCss: `${n.x}px ${n.y}px ${n.blur}px${n.spread ? ` ${n.spread}px` : ''} ${n.color}`, shadow: undefined }); };
  const shColor = parseColor(sh.color) || { r: 0, g: 0, b: 0, a: 0.25 };
  const fx = s.fx;
  return (
    <Box>
      <Section title="Transparency">
        <Seg value={tkind} options={[{ v: 'none', label: 'None' }, { v: 'uniform', label: 'Uniform' }, { v: 'linear', label: 'Linear' }, { v: 'radial', label: 'Radial' }]} onChange={v => { if (v === 'none') put({ fade: undefined, opacity: 1 }); else if (v === 'uniform') put({ fade: undefined, opacity: st0.opacity !== undefined && st0.opacity < 1 ? st0.opacity : 0.6 }); else setFade({ kind: v as 'linear' | 'radial' }); }} />
        {tkind === 'uniform' && <NumField label="%" title="Opacity" value={Math.round((st0.opacity ?? 1) * 100)} min={0} max={100} onCommit={v => put({ opacity: v / 100 })} />}
        {(tkind === 'linear' || tkind === 'radial') && <>
          <Row gap="2"><NumField label="Start" value={fade.start} min={0} max={100} suffix="%" onCommit={v => setFade({ start: v })} /><NumField label="End" value={fade.end} min={0} max={100} suffix="%" onCommit={v => setFade({ end: v })} /></Row>
          {tkind === 'linear' ? <NumField label="∠" title="Angle" value={Math.round(fade.angle)} min={0} max={360} suffix="deg" onCommit={v => setFade({ angle: v })} /> : <Row gap="2"><NumField label="X" value={Math.round(fade.cx)} suffix="%" onCommit={v => setFade({ cx: v })} /><NumField label="Y" value={Math.round(fade.cy)} suffix="%" onCommit={v => setFade({ cy: v })} /></Row>}
          <Txt fontSize="sm" m="0" {...T.muted}>Fades the whole object, including images and text. Exports as a CSS mask.</Txt>
        </>}
        <SelectField label="Merge mode" value={st0.blend || 'normal'} options={BLENDS.map(b => [b, b.replace(/-/g, ' ')] as [string, string])} onChange={v => put({ blend: v === 'normal' ? undefined : v })} />
      </Section>
      <Section title="Contour" open={false}>
        <Seg value={fx.inside ? 'in' : 'out'} options={[{ v: 'out', label: 'Outside' }, { v: 'in', label: 'Inside' }]} onChange={v => S.setFx({ inside: v === 'in' })} />
        <Row gap="2"><NumField label="Steps" value={fx.steps} min={1} max={40} onCommit={v => S.setFx({ steps: Math.round(v) })} /><NumField label="Offset" value={fx.offset} min={1} suffix="px" onCommit={v => S.setFx({ offset: v })} /></Row>
        <ColorField label="Colour at the last step" value={fx.to} onChange={v => v && S.setFx({ to: v })} />
        {btn('Apply contour', () => S.applyContour(), { primary: true })}
        <Txt fontSize="sm" m="0" {...T.muted}>Makes concentric copies in a group. Rectangles, ellipses and rounded shapes offset exactly; other shapes scale from the centre.</Txt>
      </Section>
      <Section title="Blend" open={false}>
        <NumField label="Steps" value={fx.blendSteps} min={1} max={40} onCommit={v => S.setFx({ blendSteps: Math.round(v) })} />
        {btn('Blend the two selected objects', () => S.applyBlend(), { primary: true, disabled: s.sel.length !== 2 })}
        <Txt fontSize="sm" m="0" {...T.muted}>Select two objects. Position, size, rotation and colour are interpolated.</Txt>
      </Section>
      <Section title="Shadow" open={false}>
        <Row gap="1">{btn('None', () => put({ shadowCss: undefined, shadow: 'none' }))}{btn('Soft', () => put({ shadowCss: '0px 12px 32px rgba(0,0,0,0.22)' }))}{btn('Hard', () => put({ shadowCss: '6px 6px 0px rgba(0,0,0,0.9)' }))}{btn('Glow', () => put({ shadowCss: `0px 0px 24px ${firstColor(st0.fill) || '#6366f1'}` }))}</Row>
        {st0.shadowCss && <>
          <Row gap="2"><NumField label="X" value={sh.x} onCommit={v => setShadow({ x: v })} /><NumField label="Y" value={sh.y} onCommit={v => setShadow({ y: v })} /></Row>
          <Row gap="2"><NumField label="Blur" value={sh.blur} min={0} onCommit={v => setShadow({ blur: v })} /><NumField label="Spread" value={sh.spread} onCommit={v => setShadow({ spread: v })} /></Row>
          <Row gap="2" items="end"><ColorField label="Colour" value={toHex(shColor)} onChange={v => { const c = parseColor(v); if (c) setShadow({ color: `rgba(${c.r},${c.g},${c.b},${shColor.a})` }); }} /><NumField label="%" title="Opacity" value={Math.round(shColor.a * 100)} min={0} max={100} onCommit={v => setShadow({ color: `rgba(${shColor.r},${shColor.g},${shColor.b},${v / 100})` })} /></Row>
        </>}
      </Section>
      <Section title="Blur" open={false}>
        <NumField label="Object" title="Blur the object" value={st0.blur ?? 0} min={0} max={80} suffix="px" onCommit={v => put({ blur: v || undefined })} />
        <NumField label="Behind" title="Frosted glass: blur what is behind" value={st0.bgBlur ?? 0} min={0} max={80} suffix="px" onCommit={v => put({ bgBlur: v || undefined })} />
      </Section>
      <Section title="Clip shape" open={false}>
        <Box display="grid" grid-cols="3" gap="1">{CLIP_PRESETS.map(c => <Btn key={c.id} type="button" onClick={() => put({ clipPath: c.css || undefined })} h="26px" rounded="lg" fontSize="sm" cursor="pointer" {...((st0.clipPath || '') === c.css ? T.active : T.card)}>{c.name}</Btn>)}</Box>
        <TextField label="Custom CSS clip-path" value={st0.clipPath || ''} placeholder="polygon(0 0, 100% 0, 50% 100%)" onCommit={v => put({ clipPath: v || undefined })} />
        <Txt fontSize="sm" m="0" {...T.muted}>Crops the object (an image, a section, anything) to the shape. Percentages keep it responsive.</Txt>
      </Section>
    </Box>
  );
}

/* ======================================================================== Vector */
export function VectorPanel() {
  const s = useStudio(); const nodes = S.selNodes(s); const [keep, setKeep] = useState(false); const [eps, setEps] = useState(1.5);
  const sole = nodes.length === 1 ? nodes[0] : null; const path = sole?.type === 'path' && sole.pts && sole.pts.length > 0 ? sole : null; const many = nodes.length >= 2;
  const edit = (fn: (pts: NonNullable<Node['pts']>, closed: boolean) => NonNullable<Node['pts']>) => { if (path) S.replaceNode(path.id, n => ({ ...n, pts: fn(n.pts!, !!n.closed) })); };
  const pick = s.pointPick && path && s.pointPick.id === path.id ? s.pointPick.index : -1;
  const actions = [
    { key: 'weld', label: 'Weld', icon: 'weld', action: () => S.booleanOp('weld', keep), disabled: !many },
    { key: 'intersect', label: 'Intersect', icon: 'intersect', action: () => S.booleanOp('intersect', keep), disabled: !many },
    { key: 'front-back', label: 'Trim front', icon: 'minusback', action: () => S.booleanOp('front-back', keep), disabled: !many },
    { key: 'back-front', label: 'Trim back', icon: 'minusfront', action: () => S.booleanOp('back-front', keep), disabled: !many },
    { key: 'exclude', label: 'Exclude', icon: 'exclude', action: () => S.booleanOp('exclude', keep), disabled: !many },
    { key: 'combine', label: 'Combine', icon: 'combine', action: S.combineSel, disabled: !many },
  ];
  return (
    <Box>
      <Section title="Shaping">
        <Checkbox checked={keep} onChange={setKeep} label="Keep original objects" />
        <Box {...T.card} p="1">
          <Row gap="1" wrap="wrap">
            {actions.map(a => (
              <Btn key={a.key} type="button" title={a.label} aria-label={a.label} onClick={a.disabled ? undefined : a.action} w="32px" h="32px" p="0" border="0" rounded="lg" cursor={a.disabled ? 'not-allowed' : 'pointer'} opacity={a.disabled ? '0.4' : '1'}
                {...(a.disabled ? { bg: 'transparent', ...T.muted } : { bg: 'transparent', ...T.hover, ...T.text })}>
                <ToolIcon n={a.icon} size={18} />
              </Btn>
            ))}
          </Row>
        </Box>
        {btn('Break apart', S.breakApartSel, { disabled: !(path?.svgD) })}
        <Txt fontSize="sm" m="0" {...T.muted}>Select two or more shapes. The result is an editable path with the colours of the lower object. Stacking order decides front and back.</Txt>
      </Section>
      <Section title="Shape → curves">
        {btn('Convert shape to editable path', S.convertToPath, { disabled: sole?.type !== 'shape' })}
      </Section>
      <Section title="Nodes" open>
        {!path && <Txt fontSize="sm" m="0" {...T.muted}>Select a path (or convert a shape) and use the Direct select tool (A) to move nodes. Double-click a segment to add a node.</Txt>}
        {path && <>
          <Box display="grid" grid-cols="2" gap="1">
            {btn('To lines', () => edit(p => toLines(p)))}
            {btn('To curves', () => edit((p, c) => toCurves(p, c)))}
            {btn('Smooth all', () => edit((p, c) => smoothAll(p, c)))}
            {btn('Reverse', () => edit(p => reversePts(p)))}
            {btn(path.closed ? 'Open path' : 'Close path', () => S.replaceNode(path.id, n => ({ ...n, closed: !n.closed })))}
            {btn('Symmetrical', () => edit(p => symmetric(p, pick)), { disabled: pick < 0, title: 'Select a node first' })}
          </Box>
          <Row gap="2" items="end"><NumField label="Tolerance" value={eps} step={0.5} min={0.5} max={20} onCommit={setEps} />{btn('Simplify', () => edit((p, c) => simplifyPts(p, c, eps)))}</Row>
          <Txt fontSize="sm" m="0" {...T.muted}>{path.pts!.length} nodes. Simplify removes nodes while following the same outline.</Txt>
        </>}
      </Section>
    </Box>
  );
}
void Ic;
