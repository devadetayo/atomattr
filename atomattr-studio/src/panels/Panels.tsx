import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SpacingFields, BoxModel } from './SpacingBox';
import { WebFonts } from './WebFonts';
import { familyValue } from '../document/fonts';
import { ColorsPanel } from './ColorsPanel';
import { StatesPanel } from './StatesPanel';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import type { DockerId } from '../state/layout';
import type { DesignToken, Node, Style, TextStyle } from '../document/types';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { defaultPositionMode, explicitStyle, hasOverride } from '../document/style';
import { find, flatten, isContainer, uid } from '../document/tree';
import { IconBtn, NumField, Section, SelectField, Seg, TextField, ColorField, EmptyState, Label, Checkbox } from '../components/ui';
import { Ic } from '../components/Icons';
import { T, SWATCHES } from '../theme';
import { SHAPES, shapeNode, type ShapeDef } from './shapes';
import { dataUrlBytes, formatBytes } from '../document/image-opt';
import { openImportDialog } from '../components/ImportDialog';
import { pickImages, pickFile, readImage, registerAsset, removeAsset, optimizeAllAssets } from '../state/assets';
import { generate, TARGETS, TARGET_LABEL, assetNamesFor } from '../exporters/codegen';
import { buildSiteZip } from '../exporters/site';
import { download } from '../exporters/zip';
import { thumbSvg } from '../document/thumb';
import { buildGen, parseCsv, type Gen } from '../document/gen';
import { RenderTree } from '../canvas/Render';
import { cloneDeep } from '../document/tree';
import { Components } from './Library';
import { ScaleSections, TokenLinks } from './ScalePanels';
import { compareSnapshot } from '../state/snapshots';
import { FormSubmission } from './FormPanel';
import { AnalyticsPanel, EventTag } from './AnalyticsPanel';
import { AttrEditor } from './AttrEditor';
import { CommentsPanel } from './CommentsPanel';
import { BEHAVIOR_ROLES } from '../document/behavior';
import { AnimationDock } from './AnimationPanel';
import type { Behavior } from '../document/types';
import { makeHeading, makeText, makeButton, makeSection, makeShape, makeInput, makeForm, makeEmbed } from '../document/factory';
import { importSvg } from '../document/svg-import';
import { Checks } from './Checks';
import { CmsPanel, CustomCodePanel } from './DataPanels';
import { confirmRestoreSnapshot, promptSnapshotName } from '../state/confirm';
import { RepeaterSource } from './DataPanels';
import { AppearanceSwitch, ThemePreview, TokenCard } from './StylesColours';
import { FillPanel, EffectsPanel, VectorPanel } from './FxPanels';
import { buildReactProjectZip } from '../exporters/react-project';

/** What the panels show: the box at this size, with the state being edited (hover, focus ...) laid over it. */
const sty = (n: Node, bp: any): Style => { const st = S.getState().attrState; return st === 'base' ? explicitStyle(n, bp) : { ...explicitStyle(n, bp), ...(n.states?.[st] || {}) }; };
const same = <T,>(vals: T[]) => (vals.every(v => v === vals[0]) ? vals[0] : undefined);

/* ---------- Layers ---------- */
let layerDrag: string | null = null;
const LAYER_ICON: Record<string, string> = { text: 'text', heading: 'heading', image: 'image', button: 'button', group: 'group', section: 'section', container: 'container', path: 'pen', form: 'container' };
const layerIcon = (n: Node) => LAYER_ICON[n.type] || 'shapes';
function LayerRow({ n, depth, s }: { n: Node; depth: number; s: ReturnType<typeof useStudio> }) {
  const [open, setOpen] = useState(true); const [rename, setRename] = useState(false); const kids = n.children || []; const sel = s.sel.includes(n.id);
  const [hint, setHint] = useState<'above' | 'below' | 'into' | null>(null); const [dragging, setDragging] = useState(false); const [hover, setHover] = useState(false);
  /** Top quarter = in front of this layer, bottom quarter = behind it, middle = inside it (containers only). */
  const hintFor = (e: React.DragEvent): 'above' | 'below' | 'into' => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); const f = (e.clientY - r.top) / Math.max(1, r.height);
    return isContainer(n) ? (f < 0.25 ? 'above' : f > 0.75 ? 'below' : 'into') : (f < 0.5 ? 'above' : 'below');
  };
  const blocked = () => { if (!layerDrag || layerDrag === n.id) return true; const d = find(S.root(s), layerDrag); return !d || !!find(d, n.id); };
  const showTools = hover || sel; const real = n.type !== 'page';
  return (
    <Box>
      <Box position="relative" opacity={dragging ? '0.4' : '1'} px="2">
        <Row items="center" gap="1" h="30px" pl={`${4 + depth * 14}px`} pr="1" rounded="lg" cursor="pointer" draggable={real} 
          onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
          onDragStart={(e: React.DragEvent) => { layerDrag = n.id; setDragging(true); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('application/x-aa-layer', n.id); }}
          onDragEnd={() => { layerDrag = null; setDragging(false); setHint(null); }}
          onDragOver={(e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (blocked()) { setHint(null); return; } e.dataTransfer.dropEffect = 'move'; setHint(hintFor(e)); }}
          onDragLeave={() => setHint(null)}
          onDrop={(e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); const id = layerDrag || e.dataTransfer.getData('application/x-aa-layer'); const h = hintFor(e); setHint(null); if (id && !blocked()) S.moveRelative(id, n.id, h); layerDrag = null; }}
          onClick={(e: React.MouseEvent) => (e.shiftKey ? S.toggleSelect(n.id) : S.select([n.id]))} onDoubleClick={() => real && setRename(true)}
          aria-selected={sel} role="treeitem"
          {...(sel ? { bg: 'primary/10', 'dark-bg': 'primary/20', text: 'primary', 'dark-text': 'white' } : { ...T.hover, ...T.text })} opacity={n.hidden ? '0.5' : '1'}>
          <Box w="16px" h="16px" display="flex" items="center" justify="center" shrink="0" rounded="sm" {...T.label} hover-bg="gray-900/8" dark-hover-bg="white/9" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpen(!open); }}>{kids.length > 0 && <Ic n={open ? 'chevD' : 'chevR'} size={12} />}</Box>
          <Box display="flex" shrink="0" {...(sel ? { text: 'primary', 'dark-text': 'white' } : T.label)}><Ic n={layerIcon(n)} size={14} /></Box>
          {rename ? <Box as="input" autoFocus defaultValue={n.name} onBlur={(e: any) => { setRename(false); S.patchNodeProps([n.id], { name: e.target.value || n.name }); }} onKeyDown={(e: any) => { if (e.key === 'Enter') e.target.blur(); e.stopPropagation(); }} flex="1" min-w="0" h="22px" px="1" fontSize="sm" outline="none" {...T.field} />
            : <Txt fontSize="sm" fontWeight={sel ? '600' : '500'} m="0" flex="1" min-w="0" truncate>{n.name}</Txt>}
          {real && <>
            {showTools && depth > 0 && <IconBtn icon="ungroup" title="Move out of container" size={22} iconSize={13} onClick={(e) => { e.stopPropagation(); S.moveOut([n.id]); }} />}
            {(showTools || n.hidden) && <IconBtn icon={n.hidden ? 'eyeoff' : 'eye'} title="Show / hide" size={22} iconSize={13} onClick={(e) => { e.stopPropagation(); S.toggleFlag('hidden', [n.id]); }} />}
            {(showTools || n.locked) && <IconBtn icon={n.locked ? 'lock' : 'unlock'} title="Lock / unlock" size={22} iconSize={13} onClick={(e) => { e.stopPropagation(); S.patchNodeProps([n.id], { locked: !n.locked }); }} />}
          </>}
        </Row>
        {hint === 'above' && <Box position="absolute" left="8px" right="8px" top="0" h="2px" rounded="full" bg="primary" z="5" pointer-events="none" />}
        {hint === 'below' && <Box position="absolute" left="8px" right="8px" bottom="0" h="2px" rounded="full" bg="primary" z="5" pointer-events="none" />}
        {hint === 'into' && <Box position="absolute" left="8px" right="8px" top="0" bottom="0" rounded="lg" border="2px solid" border-color="primary" bg="primary/10" z="5" pointer-events="none" />}
      </Box>
      {open && [...kids].reverse().map(c => <LayerRow key={c.id} n={c} depth={depth + 1} s={s} />)}
    </Box>
  );
}
function Layers() {
  const s = useStudio(); const rootNode = S.root(s); const count = flatten(rootNode).length - 1;
  // Dropping on empty space below the list takes the layer out of any container, onto the page itself.
  return <Box pb="2" min-h="160px" role="tree" aria-label="Layers" onDragOver={(e: React.DragEvent) => { if (layerDrag) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } }}
    onDrop={(e: React.DragEvent) => { e.preventDefault(); const id = layerDrag || e.dataTransfer.getData('application/x-aa-layer'); layerDrag = null; if (id) S.moveInto(id, rootNode.id, (rootNode.children || []).length); }}>
    <Row items="center" justify="between" px="4" h="34px" position="sticky" top="0" z="2" {...T.well}>
      <Txt fontSize="sm" fontWeight="600" {...T.label} m="0" uppercase tracking="wide">{S.page(s).name}</Txt>
      <Txt fontSize="sm" {...T.label} m="0">{count} layer{count === 1 ? '' : 's'}</Txt>
    </Row>
    <Box>
      {[...(rootNode.children || [])].reverse().map(c => <LayerRow key={c.id} n={c} depth={0} s={s} />)}
      {!(rootNode.children || []).length && <EmptyState icon="layers" title="Nothing on this page yet" hint="Draw with the tool palette." />}
    </Box>
  </Box>;
}

/* ---------- Properties ---------- */
function Properties() {
  const s = useStudio(); const nodes = S.selNodes(s); const bp = s.bp;
  if (!nodes.length) return <EmptyState icon="sliders" title="Nothing selected" hint="Select an object to edit it." />;
  const ids = nodes.map(n => n.id); const n0 = nodes[0]; const st = nodes.map(n => sty(n, bp));
  const num = (k: keyof Style) => same(st.map(x => (typeof x[k] === 'number' ? (x[k] as number) : undefined)));
  const put = (patch: Style) => S.patchNodes(ids, patch);
  const sizeValue = (k: 'minW' | 'maxW' | 'minH' | 'maxH') => {
    const v = sty(n0, bp)[k];
    return typeof v === 'number' ? String(v) : v ?? '';
  };
  const commitSize = (k: 'minW' | 'maxW' | 'minH' | 'maxH', value: string) => {
    const next = value.trim();
    if (!next) { put({ [k]: undefined } as Style); return; }
    if (/^(?:-?[\d.]+)(?:px|rem|em|%|vw|vh|svw|svh|lvw|lvh|dvw|dvh|vmin|vmax)$/i.test(next)) {
      put({ [k]: next } as Style);
      return;
    }
    const parsed = Number(next);
    if (Number.isFinite(parsed)) put({ [k]: parsed } as Style); 
  };
  const only = nodes.length === 1; const container = only && isContainer(n0) && n0.type !== 'group'; const isText = nodes.every(n => n.type === 'text' || n.type === 'heading' || n.type === 'button');
  const free = nodes.every(n => (n.style.mode ?? 'abs') === 'abs');
  const ov = (k: keyof Style) => bp !== 'desktop' && nodes.some(n => hasOverride(n, bp, k));
  const setNodeAttr = (key: string, value: string) => { const attrs={...n0.attrs}; if(value) attrs[key]=value; else delete attrs[key]; S.patchNodeProps(ids,{attrs}); };
  const tokens = s.project?.tokens || [];
  return (
    <Box>
      {bp !== 'desktop' && <Row px="3" py="2" gap="2" items="center" {...T.card} mx="2" mt="2"><Txt fontSize="sm" m="0" flex="1" {...T.muted}>Editing {bp} overrides. Other sizes keep their own values.</Txt><Btn type="button" onClick={() => ids.forEach(id => S.resetKey(id))} fontSize="sm" px="2" h="24px" rounded="lg" border="0" bg="primary" text="white" cursor="pointer">Reset</Btn></Row>}
      <Row items="center" gap="3" px="3" py="3">
        <Box w="28px" h="28px" rounded="lg" display="flex" items="center" justify="center" shrink="0" bg="gray-900/5" dark-bg="white/6" {...T.label}><Ic n={only ? layerIcon(n0) : 'layers'} size={16} /></Box>
        <Box flex="1" min-w="0"><Txt fontSize="sm" fontWeight="600" leading="tight" display="block" m="0" truncate {...T.text}>{only ? n0.name : `${nodes.length} objects`}</Txt><Txt fontSize="sm" display="block" m="0" truncate {...T.label}>{only ? `${n0.type[0].toUpperCase()}${n0.type.slice(1)}${n0.tag ? ` · ${n0.tag}` : ''} · ${bp[0].toUpperCase()}${bp.slice(1)}` : 'Editing all selected objects'}</Txt></Box>
      </Row>
      <Section title="Position and size">
        {only && <TextField label="Name" value={n0.name} onCommit={v => S.patchNodeProps(ids, { name: v || n0.name })} />}
        {only && (() => {
          const tagDefaults: Record<string, [string, string][]> = {
            heading: [['h1', 'H1'], ['h2', 'H2'], ['h3', 'H3'], ['h4', 'H4'], ['h5', 'H5'], ['h6', 'H6']],
            text: [['p', 'Paragraph'], ['span', 'Span'], ['strong', 'Strong'], ['em', 'Emphasis'], ['small', 'Small'], ['label', 'Label'], ['code', 'Code'], ['blockquote', 'Quote']],
            button: [['button', 'Button'], ['a', 'Link']],
            section: [['section', 'Section'], ['main', 'Main'], ['article', 'Article'], ['aside', 'Aside'], ['header', 'Header'], ['footer', 'Footer'], ['nav', 'Nav'], ['div', 'Div']],
            container: [['div', 'Div'], ['section', 'Section'], ['article', 'Article'], ['aside', 'Aside'], ['header', 'Header'], ['footer', 'Footer'], ['nav', 'Nav']],
            form: [['form', 'Form'], ['div', 'Div']],
            group: [['div', 'Div'], ['section', 'Section'], ['article', 'Article'], ['aside', 'Aside']],
          };
          const options = tagDefaults[n0.type] || [];
          if (!options.length) return null;
          const value = (n0.tag || (n0.type === 'heading' ? 'h2' : n0.type === 'text' ? 'p' : n0.type === 'button' ? 'button' : n0.type === 'section' ? 'section' : 'div')) as string;
          return <SelectField label="Tag" value={value} options={options} onChange={v => S.patchNodeProps(ids, { tag: v })} />;
        })()}
        {only && n0.type !== 'page' && <BehaviorFields node={n0} ids={ids} />}
        <Row gap="2"><NumField label="X position" value={num('x') ?? 0} mixed={num('x') === undefined} disabled={!free} onCommit={v => put({ x: v })} /><NumField label="Y position" value={num('y') ?? 0} mixed={num('y') === undefined} disabled={!free} onCommit={v => put({ y: v })} /></Row>
        <Box display="flex" flex-col gap="2">
          <SelectField label="Position mode" value={same(st.map(x => defaultPositionMode(x))) ?? defaultPositionMode(st[0])} options={[['static','Static'],['relative','Relative'],['absolute','Absolute'],['fixed','Fixed'],['sticky','Sticky']]} onChange={v => put({ position: v as any })} />
          <NumField label="Inset" value={num('inset') ?? undefined} mixed={num('inset') === undefined} onCommit={v => put({ inset: v, left: undefined, right: undefined, top: undefined, bottom: undefined })} />
          <Row gap="2"><NumField label="Top" value={num('top') ?? 0} onCommit={v => put({ top: v, inset: undefined })} /><NumField label="Right" value={num('right') ?? 0} onCommit={v => put({ right: v, inset: undefined })} /></Row>
          <Row gap="2"><NumField label="Bottom" value={num('bottom') ?? 0} onCommit={v => put({ bottom: v, inset: undefined })} /><NumField label="Left" value={num('left') ?? 0} onCommit={v => put({ left: v, inset: undefined })} /></Row>
        </Box>
        <Section title="Box model">
          <Row gap="2"><NumField label="Width" value={typeof sty(n0, bp).w === 'number' ? (sty(n0, bp).w as number) : undefined} onCommit={v => put({ w: v })} min={1} /><NumField label="Height" value={typeof sty(n0, bp).h === 'number' ? (sty(n0, bp).h as number) : undefined} onCommit={v => put({ h: v })} min={1} /></Row>
          <Row gap="2"><TextField label="Min W" value={sizeValue('minW')} onCommit={v => commitSize('minW', v)} placeholder="100vw" /><TextField label="Max W" value={sizeValue('maxW')} onCommit={v => commitSize('maxW', v)} placeholder="100vw" /></Row>
          <Row gap="2"><TextField label="Min H" value={sizeValue('minH')} onCommit={v => commitSize('minH', v)} placeholder="100dvh" /><TextField label="Max H" value={sizeValue('maxH')} onCommit={v => commitSize('maxH', v)} placeholder="100dvh" /></Row>
          <SelectField label="Overflow" value={same(st.map(x => x.overflow ?? 'visible')) ?? 'visible'} options={[['visible', 'Visible'], ['hidden', 'Hidden'], ['clip', 'Clip'], ['scroll', 'Scroll'], ['auto', 'Auto']]} onChange={v => put({ overflow: v as any })} />
          <SpacingFields kind="padding" style={sty(n0, bp)} put={put} />
          <SpacingFields kind="margin" style={sty(n0, bp)} put={put} />
        </Section>
        {isText && only && <Section title="Text box" open>
          <Seg label="Sizing" value={(n0.style.w === 'auto' || n0.style.w === undefined) ? 'hug' : 'frame'} options={[{v:'hug',label:'Hug text'},{v:'frame',label:'Text frame'}]} onChange={v => S.patchNodeProps(ids,{style:{...n0.style,w:v==='hug'?'auto':(typeof n0.style.w==='number'?n0.style.w:320),h:'auto'}} as any)} />
          <Txt fontSize="sm" m="0" {...T.muted}>{(n0.style.w === 'auto' || n0.style.w === undefined) ? 'The object hugs its text. Drag the text tool to create a wrapping frame.' : 'Text wraps to this width and the height grows with the content.'}</Txt>
        </Section>}
        <Box display="flex" flex-col gap="2">
          {(() => {
            const widthMode = n0.style.w === 'fill' ? 'fill'
              : n0.style.w === 'auto' ? 'auto'
              : n0.style.w === 'fit-content' ? 'fit-content'
              : n0.style.w === 'max-content' ? 'max-content'
              : n0.style.w === 'min-content' ? 'min-content'
              : 'fixed';
            const heightMode = n0.style.h === 'auto' ? 'auto'
              : n0.style.h === 'fit-content' ? 'fit-content'
              : n0.style.h === 'max-content' ? 'max-content'
              : n0.style.h === 'min-content' ? 'min-content'
              : 'fixed';
            return <>
              <SelectField label="Width mode" value={widthMode} options={[['fixed', 'Fixed'], ['auto', 'Auto'], ['fit-content', 'Fit-content'], ['max-content', 'Max-content'], ['min-content', 'Min-content'], ['fill', 'Fill']]} onChange={v => {
                if (v === 'fixed') {
                  const current = typeof n0.style.w === 'number' ? n0.style.w : 320;
                  put({ w: current });
                } else if (v === 'auto') put({ w: 'auto' });
                else if (v === 'fit-content' || v === 'max-content' || v === 'min-content') put({ w: v });
                else put({ w: 'fill' });
              }} />
              <NumField label="Width" value={typeof n0.style.w === 'number' ? n0.style.w : undefined} onCommit={v => put({ w: v })} min={1} disabled={widthMode !== 'fixed'} />
              <SelectField label="Height mode" value={heightMode} options={[['fixed', 'Fixed'], ['auto', 'Auto'], ['fit-content', 'Fit-content'], ['max-content', 'Max-content'], ['min-content', 'Min-content']]} onChange={v => {
                if (v === 'fixed') put({ h: typeof n0.style.h === 'number' ? n0.style.h : 100 });
                else put({ h: v === 'auto' ? 'auto' : v as 'fit-content' | 'max-content' | 'min-content' });
              }} />
              <NumField label="Height" value={typeof n0.style.h === 'number' ? n0.style.h : undefined} onCommit={v => put({ h: v })} min={1} disabled={heightMode !== 'fixed' || isText} />
            </>;
          })()}
        </Box>
        <Row gap="2"><NumField label="Rotation" value={num('rotation') ?? 0} onCommit={v => put({ rotation: v })} suffix="deg" /><NumField label="Opacity" value={Math.round((num('opacity') ?? 1) * 100)} min={0} max={100} onCommit={v => put({ opacity: v / 100 })} /></Row>
        {ov('x') || ov('w') ? <Txt fontSize="sm" m="0" {...T.muted}>Position or size overridden at {bp}.</Txt> : null}
      </Section>
      {container && <Section title="Layout">
        <Seg label="Layout" value={sty(n0, bp).layout ?? 'free'} options={[{ v: 'free', label: 'Free' }, { v: 'flex', label: 'Flex' }, { v: 'grid', label: 'Grid' }]} onChange={v => put({ layout: v })} />
        {sty(n0, bp).layout === 'flex' && <><Seg label="Direction" value={sty(n0, bp).dir ?? 'column'} options={[{ v: 'column', label: 'Column' }, { v: 'row', label: 'Row' }]} onChange={v => put({ dir: v })} /><SelectField label="Align items" value={sty(n0, bp).items ?? 'stretch'} options={[['start', 'Start'], ['center', 'Center'], ['end', 'End'], ['stretch', 'Stretch']]} onChange={v => put({ items: v as any })} /><SelectField label="Justify" value={sty(n0, bp).justify ?? 'start'} options={[['start', 'Start'], ['center', 'Center'], ['end', 'End'], ['between', 'Space between']]} onChange={v => put({ justify: v as any })} /><Checkbox checked={!!sty(n0,bp).wrap} onChange={v => put({ wrap: v })} label="Wrap children" /></>}
        {sty(n0, bp).layout === 'grid' && <NumField label="Cols" value={sty(n0, bp).cols ?? 2} min={1} max={12} onCommit={v => put({ cols: Math.round(v) })} />}
        {sty(n0, bp).layout !== 'free' && <Row gap="2"><NumField label="Gap" value={sty(n0, bp).gap ?? 0} min={0} onCommit={v => put({ gap: v })} /></Row>}
        <SpacingFields kind="padding" style={sty(n0, bp)} put={put} />
        <SpacingFields kind="margin" style={sty(n0, bp)} put={put} />
        {sty(n0,bp).layout === 'flex' && <Box display="flex" flex-col gap="2"><Label>Selected child sizing</Label><SelectField value={sty(n0,bp).basis === 'fill' ? 'fill' : sty(n0,bp).basis === 'auto' ? 'hug' : 'fixed'} options={[['fixed','Fixed'],['hug','Hug'],['fill','Fill']]} onChange={v=>S.patchNodes(ids,{basis:v==='fill'?'fill':v==='hug'?'auto':(typeof n0.style.w==='number'?n0.style.w:160),grow:v==='fill'?1:0})} /><NumField label="Grow" value={num('grow') ?? 0} min={0} onCommit={v=>put({grow:v})} /><Row gap="2"><NumField label="Minimum width" value={num('minW')} min={0} onCommit={v=>put({minW:v})} /><NumField label="Maximum width" value={num('maxW')} min={0} onCommit={v=>put({maxW:v})} /></Row><SelectField label="Self" value={sty(n0,bp).self ?? 'auto'} options={[['auto','Auto'],['start','Start'],['center','Center'],['end','End'],['stretch','Stretch']]} onChange={v=>put({self:v as any})} /></Box>}
        {sty(n0,bp).layout !== 'free' && <Btn type="button" onClick={()=>put({layout:'free'})} h="28px" {...T.card} fontSize="sm" cursor="pointer">Back to free</Btn>}
      </Section>}
      <Section title="Appearance">
        {nodes.some(n => n.type !== 'image') && <ColorField label="Fill color" value={same(st.map(x => x.fill))} allowNone tokens={tokens} activeToken={n0.style.fillToken}
          gradientOptions={['linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', 'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)', 'radial-gradient(circle at 50% 50%, #ffffff 0%, #6366f1 100%)']}
          onToken={(t: DesignToken) => ids.forEach(id => S.replaceNode(id, n => ({ ...n, style: { ...n.style, fillToken: t.id, fill: t.light } })))}
          onChange={v => { put({ fill: v, fillToken: undefined } as Style); if (v) S.pushRecentColor(v); }} />}
        {isText && <>
          <ColorField label="Text color" value={same(st.map(x => x.color))} allowNone tokens={tokens} activeToken={n0.style.colorToken}
            gradientOptions={['linear-gradient(90deg, #6366f1 0%, #ec4899 100%)', 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)', 'linear-gradient(90deg, #22c55e 0%, #3b82f6 100%)']}
            onToken={(t: DesignToken) => { S.unlinkTextStyle(ids); ids.forEach(id => S.replaceNode(id, n => ({ ...n, style: { ...n.style, colorToken: t.id, color: t.light } }))); }}
            onChange={v => { S.unlinkTextStyle(ids); if (v) put({ color: v, colorToken: undefined } as Style); }} />
          <Checkbox checked={!!same(st.map(x => x.clipText))} onChange={v => { const current = same(st.map(x => x.fill)) || 'linear-gradient(135deg, #6366f1, #ec4899)'; put({ clipText: v, fill: v ? current : undefined }); }} label="Clip fill to text" />
        </>}
        <ColorField label="Border color" value={same(st.map(x => x.stroke))} allowNone tokens={tokens}
          gradientOptions={['linear-gradient(90deg, #0f172a 0%, #475569 100%)', 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)', 'linear-gradient(90deg, #22c55e 0%, #84cc16 100%)']}
          onChange={v => put({ stroke: v, strokeWidth: v ? (num('strokeWidth') || 2) : 0 })} />
        <Row gap="2"><NumField label="Border width" value={num('strokeWidth') ?? 0} min={0} onCommit={v => put({ strokeWidth: v })} /><NumField label="Corner radius" value={num('radius') ?? 0} min={0} onCommit={v => put({ radius: v })} /></Row>
        <Box display="flex" flex-col gap="2">
          <Box><Label>Border width</Label></Box>
          <Row gap="2"><NumField label="Top" value={num('borderT') ?? num('borderY') ?? num('strokeWidth') ?? 0} min={0} onCommit={v => put({ borderT: v, borderY: undefined, strokeWidth: undefined })} /><NumField label="Right" value={num('borderR') ?? num('borderX') ?? num('strokeWidth') ?? 0} min={0} onCommit={v => put({ borderR: v, borderX: undefined, strokeWidth: undefined })} /></Row>
          <Row gap="2"><NumField label="Bottom" value={num('borderB') ?? num('borderY') ?? num('strokeWidth') ?? 0} min={0} onCommit={v => put({ borderB: v, borderY: undefined, strokeWidth: undefined })} /><NumField label="Left" value={num('borderL') ?? num('borderX') ?? num('strokeWidth') ?? 0} min={0} onCommit={v => put({ borderL: v, borderX: undefined, strokeWidth: undefined })} /></Row>
        </Box>
        <Box display="flex" flex-col gap="2">
          <Box><Label>Corner radius</Label></Box>
          <Row gap="2"><NumField label="Top left" value={num('radiusTL') ?? num('radius') ?? 0} min={0} onCommit={v => put({ radiusTL: v, radius: undefined })} /><NumField label="Top right" value={num('radiusTR') ?? num('radius') ?? 0} min={0} onCommit={v => put({ radiusTR: v, radius: undefined })} /></Row>
          <Row gap="2"><NumField label="Bottom right" value={num('radiusBR') ?? num('radius') ?? 0} min={0} onCommit={v => put({ radiusBR: v, radius: undefined })} /><NumField label="Bottom left" value={num('radiusBL') ?? num('radius') ?? 0} min={0} onCommit={v => put({ radiusBL: v, radius: undefined })} /></Row>
        </Box>
        <SelectField label="Shadow" value={same(st.map(x => x.shadow ?? 'none')) ?? 'none'} options={[['none', 'None'], ['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']]} onChange={v => put({ shadow: v as any })} />
      </Section>
      {only && (isText || n0.type === 'image') && <Section title={n0.type === 'image' ? 'Image' : 'Content'}>
        {isText && <TextField label="Text" multiline value={n0.text || ''} onCommit={v => S.patchNodeProps(ids, { text: v })} />}
        {(n0.type === 'button'||n0.type==='text'||n0.type==='heading') && <TextField label="Link (URL, #anchor, page:id)" value={n0.href || ''} onCommit={v => S.patchNodeProps(ids, { href: v })} />}
        {(n0.type === 'button'||n0.type==='text'||n0.type==='heading') && <SelectField label="Link to page" value={n0.href?.startsWith('page:')?n0.href.slice(5):''} options={[['','No page link'],...(s.project?.pages||[]).map(p=>[p.id,p.name] as [string,string])]} onChange={v=>S.patchNodeProps(ids,{href:v?`page:${v}`:undefined})} />}
        {n0.type === 'heading' && <SelectField label="Level" value={n0.tag || 'h2'} options={['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(h => [h, h.toUpperCase()] as [string, string])} onChange={v => S.patchNodeProps(ids, { tag: v })} />}
        {n0.type === 'image' && <>
          <TextField label="Alt text" value={n0.alt || ''} onCommit={v => S.patchNodeProps(ids, { alt: v })} />
          <Btn type="button" h="30px" {...T.card} fontSize="sm" cursor="pointer" onClick={async()=>{const file=await pickFile('image/*');if(!file)return;const result=await readImage(file);if(!result)return;const asset=registerAsset(result.asset);S.patchNodeProps(ids,{src:asset.dataUrl,assetId:asset.id,name:asset.name});}}>Replace image</Btn>
          <SelectField label="Fit" value={String(n0.attrs?.['object-fit']||'cover')} options={['cover','contain','fill','none','scale-down'].map(x=>[x,x[0].toUpperCase()+x.slice(1)])} onChange={v=>setNodeAttr('object-fit',v)} />
          <TextField label="Crop position" value={String(n0.attrs?.['object-position']||'center')} placeholder="50% 50%" onCommit={v=>setNodeAttr('object-position',v||'center')} />
          <TextField label="Image filter" value={String(n0.attrs?.filter||'')} placeholder="grayscale(0.2) contrast(1.1)" onCommit={v=>setNodeAttr('filter',v)} />
          <Section title="Overlay">
            <Row gap="2" items="end"><ColorField label="Tint" value={n0.overlay?.color||'#0f172a'} allowNone onChange={v=>S.patchNodeProps(ids,{overlay:v?{color:v,opacity:n0.overlay?.opacity??0.28}:undefined})} /><NumField label="Opacity" value={Math.round((n0.overlay?.opacity??0.28)*100)} min={0} max={100} onCommit={v=>S.patchNodeProps(ids,{overlay:{color:n0.overlay?.color||'#0f172a',opacity:v/100}})} suffix="%" /></Row>
            {n0.overlay&&<Btn type="button" h="28px" {...T.card} fontSize="sm" cursor="pointer" onClick={()=>S.patchNodeProps(ids,{overlay:undefined})}>Remove overlay</Btn>}
          </Section>
        </>}
      </Section>}
      {only && n0.type === 'form' && <Section title="Form submission" open={!n0.attrs?.action && !n0.attrs?.['data-netlify']}><FormSubmission node={n0} /></Section>}
      {only && n0.type !== 'page' && <Section title="Analytics event" open={!!n0.attrs?.['data-ast-event']}><EventTag node={n0} /></Section>}
      {only && n0.type !== 'page' && <Section title="Tokens and class" open={!!n0.cls || !!n0.style.tok}><TokenLinks node={n0} /></Section>}
      {only && n0.type !== 'page' && <Section title="Animation" open={false}><Row items="center" gap="2" px="3" py="2"><Txt fontSize="sm" m="0" flex="1" min-w="0" truncate {...T.muted}>{n0.anim ? (n0.anim.preset === 'custom' ? 'Custom animation' : n0.anim.preset.replace(/-/g, ' ')) : 'No animation'}</Txt><Btn type="button" onClick={() => S.openDocker('animation')} h="26px" px="3" cursor="pointer" fontSize="sm" fontWeight="500" {...T.tile} {...T.text}>Open panel</Btn></Row></Section>}
      {only && n0.type === 'input' && <Section title="Form control">
        {(() => { const f = n0.field || { type: 'text' as const, name: 'field' }; const save = (patch: Partial<typeof f>) => S.patchNodeProps(ids, { field: { ...f, ...patch } }); return <>
          <SelectField label="Control" value={f.type} options={(['text','email','password','number','textarea','select','checkbox','radio','range'] as const).map(v => [v, v[0].toUpperCase()+v.slice(1)] as [string,string])} onChange={v => save({ type: v as typeof f.type })} />
          <TextField label="Name" value={f.name} onCommit={v => save({ name: v || 'field' })} />
          {f.type === 'range' && <Row gap="2"><TextField label="Min" value={f.min || ''} onCommit={v => save({ min: v })} /><TextField label="Max" value={f.max || ''} onCommit={v => save({ max: v })} /><TextField label="Step" value={f.step || ''} onCommit={v => save({ step: v })} /></Row>}
          {f.type === 'radio' && <TextField label="Value sent when chosen" value={f.value || ''} onCommit={v => save({ value: v })} />}
          {f.type === 'radio' && <Checkbox checked={!!f.checked} onChange={v => save({ checked: v })} label="Selected by default" />}
          {f.type !== 'checkbox' && f.type !== 'radio' && f.type !== 'range' && f.type !== 'select' && <TextField label="Placeholder" value={f.placeholder || ''} onCommit={v => save({ placeholder: v })} />}
          {f.type !== 'checkbox' && f.type !== 'radio' && f.type !== 'select' && <TextField label="Initial value" value={f.value || ''} onCommit={v => save({ value: v })} />}
          {f.type === 'select' && <><TextField label="Options (comma separated)" value={(f.options || []).join(', ')} onCommit={v => save({ options: v.split(',').map(x => x.trim()).filter(Boolean) })} /><TextField label="Selected option" value={f.value || ''} onCommit={v => save({ value: v })} /></>}
          {f.type === 'checkbox' && <Checkbox checked={f.value === 'true'} onChange={v => save({ value: v ? 'true' : 'false' })} label="Checked by default" />}
          {f.type !== 'checkbox' && <Checkbox checked={!!f.required} onChange={v => save({ required: v })} label="Required" />}
        </>; })()}
      </Section>}
      {only && n0.type === 'embed' && <Section title="Custom HTML">
        <Txt fontSize="sm" m="0" {...T.muted}>Embed code (a widget, map, form service). It is not run in the editor. Preview shows it in a sandboxed frame; exports include it as written.</Txt>
        <TextField label="HTML" multiline value={n0.html || ''} onCommit={v => S.patchNodeProps(ids, { html: v })} />
      </Section>}
      {only && isContainer(n0) && <Section title="Repeater">
        <Txt fontSize="sm" m="0" {...T.muted}>Repeats the first child once per item. Use {'{{field}}'} in its text, image alt/src, or link. Data comes from a CMS collection or pasted CSV.</Txt>
        <Checkbox checked={!!n0.repeat} onChange={v => { const csv = n0.repeat?.csv || 'title,description\nFirst item,Description'; S.patchNodeProps(ids, { repeat: v ? { csv, rows: parseCsv(csv) } : undefined }); }} label="Repeat first child" />
        {n0.repeat && <RepeaterSource ids={ids} node={n0} />}
      </Section>}
    </Box>
  );
}

/* ---------- Typography ---------- */
const FONTS: [string, string][] = [['DM Sans, "Segoe UI", sans-serif', 'DM Sans / system sans'], ['Inter, system-ui, sans-serif', 'Inter / system sans'], ['Georgia, "Times New Roman", serif', 'Georgia serif'], ['"Playfair Display", Georgia, serif', 'Playfair serif'], ['"Helvetica Neue", Arial, sans-serif', 'Helvetica / Arial'], ['"Trebuchet MS", sans-serif', 'Trebuchet'], ['Verdana, Geneva, sans-serif', 'Verdana'], ['"Courier New", ui-monospace, monospace', 'Monospace'], ['Impact, "Arial Black", sans-serif', 'Impact display'], ['"Brush Script MT", cursive', 'Script']];
function Typography() {
  const s = useStudio(); const nodes = S.selNodes(s).filter(n => n.type === 'text' || n.type === 'heading' || n.type === 'button');
  if (!nodes.length) return <EmptyState icon="type" title="Select text" hint="Typography applies to text, headings and buttons." />;
  const ids = nodes.map(n => n.id); const st = nodes.map(n => sty(n, s.bp)); const put = (p: Style) => S.patchNodes(ids, p);
  const flag = (k: 'italic' | 'underline' | 'upper', l: string, t: string, extra: Record<string, string> = {}) => <Btn key={k} type="button" title={t} aria-pressed={!!st[0][k]} onClick={() => put({ [k]: !st[0][k] } as Style)} flex="1" h="26px" rounded="lg" border="0" fontSize="sm" fontWeight="700" cursor="pointer" {...extra}
    {...(st[0][k] ? { bg: 'white', 'dark-bg': 'primary', text: 'primary', 'dark-text': 'white', shadow: 'sm' } : { bg: 'transparent', ...T.label, 'hover-text': 'gray-900', 'dark-hover-text': 'white' })}>{l}</Btn>;
  return <Box>
    <Section title="Style">
      <SelectField label="Linked style" value={st[0].tstyle || ''} options={[['','Unlinked'],...(s.project?.textStyles||[]).map(x=>[x.id,x.name] as [string,string])]} onChange={v=>{const ts=s.project?.textStyles?.find(x=>x.id===v);ts?S.applyTextStyle(ids,ts):S.unlinkTextStyle(ids);}} />
    </Section>
    <Section title="Font">
      <SelectField label="Family" value={same(st.map(x => x.font)) || ''} options={[['', 'Default (project font)'], ...(s.project?.webFonts || []).map(f => [familyValue(f), `${f.family} (web font)`] as [string, string]), ...FONTS]} onChange={v => put({ font: v || undefined })} />
      <Row gap="2"><NumField label="Size" title="Font size" value={same(st.map(x => x.fontSize))} min={8} max={200} onCommit={v => {S.unlinkTextStyle(ids);put({ fontSize: v });}} suffix="px" /><SelectField label="Weight" value={String(same(st.map(x => x.fontWeight)) ?? 400)} options={[['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold'], ['800', 'Extra bold']]} onChange={v => {S.unlinkTextStyle(ids);put({ fontWeight: Number(v) });}} /></Row>
    </Section>
    <Section title="Web fonts" open={!(s.project?.webFonts || []).length}><WebFonts /></Section>
    <Section title="Paragraph">
      <Seg label="Alignment" value={same(st.map(x => x.align)) ?? 'left'} options={[{ v: 'left', label: 'Left' }, { v: 'center', label: 'Center' }, { v: 'right', label: 'Right' }]} onChange={v => put({ align: v })} />
      <Row gap="2"><NumField label="Line height" title="Line height" step={0.1} value={same(st.map(x => x.lineHeight)) ?? 1.4} min={0.8} max={3} onCommit={v => {S.unlinkTextStyle(ids);put({ lineHeight: v });}} /><NumField label="Letter spacing" title="Letter spacing" step={0.5} value={same(st.map(x => x.letterSpacing)) ?? 0} onCommit={v => {S.unlinkTextStyle(ids);put({ letterSpacing: v });}} suffix="px" /></Row>
    </Section>
    <Section title="Decoration">
      <Box display="flex" flex-col gap="1"><Label>Emphasis</Label>
        <Row bg="gray-900/5" dark-bg="white/6" rounded="lg" p="2px" gap="2px">{flag('italic', 'I', 'Italic', { fontStyle: 'italic' })}{flag('underline', 'U', 'Underline', { 'text-decoration': 'underline' })}{flag('upper', 'AA', 'Uppercase')}</Row></Box>
      <Btn type="button" title="Fill the letters with a gradient or image" onClick={() => S.openDocker('fill')} h="30px" px="2" rounded="lg" border="0" fontSize="sm" fontWeight="500" cursor="pointer" display="flex" items="center" justify="between" {...(st[0].clipText ? T.active : { ...T.field })}>Fill letters<Txt fontSize="sm" m="0" {...T.label}>{st[0].clipText ? 'On' : 'Off'}</Txt></Btn>
      <TextField label="Text shadow" value={same(st.map(x => x.textShadow)) || ''} placeholder="2px 2px 6px rgba(0,0,0,.3)" onCommit={v => put({ textShadow: v || undefined })} />
    </Section>
    <Section title="Colour">
      <ColorField value={same(st.map(x => x.color))} tokens={s.project?.tokens || []} activeToken={nodes[0].style.colorToken}
        onToken={(t: DesignToken) => { S.unlinkTextStyle(ids); ids.forEach(id => S.replaceNode(id, n => ({ ...n, style: { ...n.style, colorToken: t.id, color: t.light } }))); }}
        onChange={v => { S.unlinkTextStyle(ids); if (v) put({ color: v, colorToken: undefined } as Style); }} />
    </Section>
  </Box>;
}

/* ---------- Tokens and linked styles ---------- */
function Styles() {
  const s=useStudio(); const p=s.project!; const tokens=p.tokens||[]; const styles=p.textStyles||[]; const selected=S.selNodes(s); const node=selected[0]; const [cmp,setCmp]=useState('');const [from,setFrom]=useState('');const [to,setTo]=useState('');
  const update=(t:DesignToken)=>S.setToken(t);
  const [tab,setTab]=useState<'colours'|'text'|'spacing'|'fonts'|'history'>('colours');
  return <Box p="2" display="flex" flex-col gap="2">
    <Seg value={tab} onChange={setTab} options={[{v:'colours',label:'Colours'},{v:'text',label:'Text'},{v:'spacing',label:'Scales'},{v:'fonts',label:'Fonts'},{v:'history',label:'History'}]} />
    {tab==='colours'&&<>
    <Box display="flex" flex-col gap="2" px="1"><Label>Page appearance</Label><AppearanceSwitch value={(p as any).pageTheme||'light'} onChange={S.setPageTheme} /><ThemePreview tokens={tokens} active={(p as any).pageTheme||'light'} /></Box>
    <Section title="Colour tokens" action={<IconBtn icon="plus" title="Add colour token" size={22} iconSize={13} onClick={S.addToken} />}>
      <Box display="flex" flex-col gap="3">{tokens.map(t=><TokenCard key={t.id} t={t} tokens={tokens} node={node} />)}</Box>
    </Section>
    {tokens.length>1&&<Section title="Find & replace token"><SelectField label="Find" value={from} options={tokens.map(t=>[t.id,t.name] as [string,string])} onChange={setFrom}/><SelectField label="Replace with" value={to} options={tokens.map(t=>[t.id,t.name] as [string,string])} onChange={setTo}/><Btn type="button" disabled={!from||!to||from===to} onClick={()=>{S.replaceTokenReferences(from,to);S.toast('Token references replaced across pages and components.');}} h="28px" {...T.card} fontSize="sm" cursor="pointer">Replace references</Btn></Section>}
    </>}
    {tab==='text'&&<>
    <Section title="Linked text styles" action={<IconBtn icon="plus" title="Add text style" size={22} iconSize={13} onClick={()=>S.setTextStyle({id:`type-${Date.now()}`,name:'New style',fontSize:18,fontWeight:400})} />}>
      {styles.map(ts=><Row key={ts.id} items="center" gap="1" mb="1"><TextField value={ts.name} onCommit={v=>S.setTextStyle({...ts,name:v||ts.name})}/><NumField value={ts.fontSize} min={8} max={200} suffix="px" onCommit={v=>S.setTextStyle({...ts,fontSize:v})}/>{selected.length>0&&<IconBtn icon="type" title={`Apply ${ts.name} to selection`} size={22} iconSize={13} onClick={()=>S.applyTextStyle(selected.map(n=>n.id),ts)}/>}</Row>)}
    </Section>
    </>}
    {tab==='spacing'&&<>
    <ScaleSections />
    </>}
    {tab==='fonts'&&<>
    <Section title="Web fonts"><WebFonts /></Section>
    <Section title="Font stacks"><TextField label="Headings" value={p.fontStacks?.heading||'DM Sans, sans-serif'} onCommit={v=>S.setProject({...p,fontStacks:{...(p.fontStacks||{body:'DM Sans, sans-serif'}),heading:v}})}/><TextField label="Body" value={p.fontStacks?.body||'DM Sans, sans-serif'} onCommit={v=>S.setProject({...p,fontStacks:{...(p.fontStacks||{heading:'DM Sans, sans-serif'}),body:v}})}/></Section>
    </>}
    {tab==='history'&&<>
    <Section title="Version snapshots" action={<IconBtn icon="plus" title="Create named snapshot" size={22} iconSize={13} onClick={()=>{promptSnapshotName(`Snapshot ${new Date().toLocaleString()}`).then(name=>{if(name!==null)S.createSnapshot(name);});}}/>}>
      {!(p.snapshots||[]).length?<Txt fontSize="sm" m="0" {...T.muted}>Save a named restore point before a major change. Automatic restore points are also taken about every 10 minutes while you edit (last 10 kept).</Txt>:(p.snapshots||[]).slice().reverse().map(snap=>{const diff=cmp===snap.id?compareSnapshot(p,snap):null;return <Box key={snap.id} mb="1"><Row items="center" gap="1" p="1" {...T.card}><Box flex="1"><Txt fontSize="sm" m="0" fontWeight="600">{snap.name}{snap.auto?' (automatic)':''}</Txt><Txt fontSize="sm" m="0" {...T.muted}>{new Date(snap.createdAt).toLocaleString()}</Txt></Box><IconBtn icon="copy" title="Compare with the current version" size={22} iconSize={12} active={cmp===snap.id} onClick={()=>setCmp(cmp===snap.id?'':snap.id)}/><IconBtn icon="refresh" title="Restore snapshot" size={22} iconSize={12} onClick={()=>{confirmRestoreSnapshot(snap.name).then(ok=>{if(ok)S.restoreSnapshot(snap.id);});}}/><IconBtn icon="trash" title="Delete snapshot" size={22} iconSize={12} onClick={()=>S.deleteSnapshot(snap.id)}/></Row>{cmp===snap.id&&<Box px="2" py="1" display="flex" flex-col gap="1" {...T.tile} mt="1">{!diff?<Txt fontSize="sm" m="0" {...T.muted}>Could not read this snapshot.</Txt>:!diff.changed?<Txt fontSize="sm" m="0" {...T.muted}>No differences from the current version.</Txt>:<><Txt fontSize="sm" fontWeight="600" m="0" {...T.text}>Since this snapshot</Txt>{diff.lines.map((l,i)=><Txt key={i} as="p" fontSize="sm" leading="snug" m="0" {...T.muted}>{l}</Txt>)}</>}</Box>}</Box>})}
    </Section>
    </>}
  </Box>;
}

/* ---------- Align ---------- */
function AlignPanel() {
  const s = useStudio(); const [to, setTo] = useState<'selection' | 'parent' | 'page'>('selection'); const L = s.layout;
  const A: [string, any][] = [['alignL', 'left'], ['alignCH', 'hcenter'], ['alignR', 'right'], ['alignT', 'top'], ['alignCV', 'vcenter'], ['alignB', 'bottom']];
  return <Box p="3" display="flex" flex-col gap="3">
    <Seg label="Align to" value={to} options={[{ v: 'selection', label: 'Selection' }, { v: 'parent', label: 'Parent' }, { v: 'page', label: 'Page' }]} onChange={setTo} />
    <Row gap="1">{A.map(([i, k]) => <IconBtn key={k} icon={i} title={`Align ${k}`} onClick={() => S.doAlign(k, to)} disabled={!s.sel.length} />)}<IconBtn icon="distH" title="Distribute horizontally" onClick={() => S.doDistribute('x')} disabled={s.sel.length < 3} /><IconBtn icon="distV" title="Distribute vertically" onClick={() => S.doDistribute('y')} disabled={s.sel.length < 3} /></Row>
    <Label>Snapping & guides</Label>
    {([['snap', 'Snap to objects and guides'], ['grid', 'Show grid (8px)'], ['guides', 'Show guides'], ['safeArea', 'Show safe area'], ['rulers', 'Show rulers']] as const).map(([k, t]) => <Checkbox key={k} checked={L[k]} onChange={(v: boolean) => S.setLayoutFlag({ [k]: v })} label={t} />)}
    <Btn type="button" onClick={() => S.setGuides([])} py="2.5" px="6" outline="none" {...T.card} border="none" fontSize="sm" cursor="pointer">Clear all guides</Btn>
  </Box>;
}

/* ---------- Shapes ---------- */
function Thumb({ d }: { d: ShapeDef }) {
  return <svg viewBox="0 0 40 40" width="36" height="36">{d.kind === 'ellipse' ? <ellipse cx="20" cy="20" rx="16" ry="16" fill="currentColor" /> : d.kind ? <rect x="4" y="8" width="32" height="24" rx={d.kind === 'rounded' ? 7 : 0} fill="currentColor" /> : <polygon points={d.pts!.map(([x, y]) => `${4 + x * 32},${4 + y * 32}`).join(' ')} fill="currentColor" />}</svg>;
}
function Shapes() {
  return <Box p="2" display="grid" grid-cols="4" gap="1">{SHAPES.map(d => <Btn key={d.id} type="button" title={`${d.name} · click to insert or drag onto the canvas`} draggable onDragStart={(e: React.DragEvent) => e.dataTransfer.setData('application/x-aa-shape', d.id)} onClick={() => S.addNode(shapeNode(d))} h="52px" border="0" rounded="lg" cursor="pointer" bg="transparent" {...T.hover} text="primary" dark-text="primary" display="flex" items="center" justify="center"><Thumb d={d} /></Btn>)}</Box>;
}

/* ---------- Icon packs (Iconify) ---------- */
const ICON_PACKS: [string, string][] = [['lucide', 'Lucide'], ['tabler', 'Tabler'], ['ph', 'Phosphor'], ['heroicons', 'Heroicons'], ['mdi', 'Material Design'], ['fa6-solid', 'Font Awesome'], ['bi', 'Bootstrap']];
const ICON_API = 'https://api.iconify.design';
type IconData = { body: string; width: number; height: number };
const iconCache = new Map<string, IconData | null>();
const svgOf = (d: IconData, size = 48) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d.width} ${d.height}" width="${size}" height="${size}">${d.body}</svg>`;

/** One request for every icon on screen, instead of one image request each: the grid draws inline SVG, so it follows the theme and cannot half-load. */
async function loadIcons(pack: string, names: string[], signal: AbortSignal) {
  const need = names.filter(n => !iconCache.has(`${pack}:${n}`)); if (!need.length) return;
  const r = await fetch(`${ICON_API}/${pack}.json?icons=${need.map(encodeURIComponent).join(',')}`, { signal }); if (!r.ok) throw new Error('icons');
  const j = await r.json(); const w = j.width || 24, h = j.height || 24;
  for (const n of need) { const i = j.icons?.[n]; iconCache.set(`${pack}:${n}`, i ? { body: i.body, width: i.width || w, height: i.height || h } : null); }
}
const SUGGEST_ICONS = ['home', 'user', 'cart', 'search', 'arrow', 'star', 'heart', 'mail', 'phone', 'check', 'menu', 'settings'];

function IconPacks() {
  const [pack, setPack] = useState('lucide'); const [q, setQ] = useState(''); const [names, setNames] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [, bump] = useState(0);
  useEffect(() => {
    const term = q.trim(); if (!term) { setNames([]); setErr(''); return; }
    const ctl = new AbortController(); setBusy(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${ICON_API}/search?query=${encodeURIComponent(term)}&prefix=${pack}&limit=60`, { signal: ctl.signal }); const j = await r.json();
        const list: string[] = (j.icons || []).map((f: string) => f.split(':').slice(1).join(':'));
        await loadIcons(pack, list, ctl.signal); setNames(list); setErr(''); bump(n => n + 1);
      } catch (e) { if ((e as Error).name !== 'AbortError') setErr('Icon search needs an internet connection.'); }
      finally { if (!ctl.signal.aborted) setBusy(false); }
    }, 300);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, pack]);
  const place = (n: string) => { const d = iconCache.get(`${pack}:${n}`); if (!d) return; try { S.addNode(importSvg(svgOf(d).replace(/currentColor/gi, '#111827'), n)); S.toast('Icon added as editable vector paths. Change its colour in Fill.'); } catch { S.toast('Could not add this icon.', 'error'); } };
  const shown = names.filter(n => iconCache.get(`${pack}:${n}`));
  return <Box display="flex" flex-col gap="2">
    <Row items="center" gap="2" py="3" px="3" {...T.field} focus-within-border-color="primary">
      <Box display="flex" shrink="0" {...T.label}><Ic n="zoom" size={16} /></Box>
      <Box as="input" value={q} placeholder="Search icons: home, cart, user" aria-label="Search icons" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()} flex="1" min-w="0" border="0" bg="transparent" outline="none" fontSize="sm" {...T.text} />
    </Row>
    <SelectField value={pack} options={ICON_PACKS} onChange={setPack} />
    {err && <Txt fontSize="sm" m="0" text="danger">{err}</Txt>}
    {!q.trim() && <>
      <Txt fontSize="sm" leading="snug" m="0" {...T.label}>Search {ICON_PACKS.find(p => p[0] === pack)?.[1]}. Click an icon to place it as editable vector paths.</Txt>
      <Row gap="1" wrap>{SUGGEST_ICONS.map(s => <Btn key={s} type="button" onClick={() => setQ(s)} h="24px" px="2" border="0" rounded="full" cursor="pointer" fontSize="sm" bg="gray-900/5" dark-bg="white/6" hover-bg="gray-900/10" dark-hover-bg="white/10" {...T.muted}>{s}</Btn>)}</Row>
    </>}
    {busy && <Txt fontSize="sm" m="0" {...T.label}>Searching…</Txt>}
    {!busy && !err && q.trim() && !shown.length && <Txt fontSize="sm" m="0" {...T.label}>No icons found.</Txt>}
    <Box display="grid" grid-cols="6" gap="1">{shown.map(n => { const d = iconCache.get(`${pack}:${n}`)!; return <Btn key={n} type="button" title={n} aria-label={`Add icon ${n}`} onClick={() => place(n)} h="36px" border="0" rounded="lg" cursor="pointer" bg="transparent" {...T.hover} {...T.text} display="flex" items="center" justify="center">
      <svg viewBox={`0 0 ${d.width} ${d.height}`} width="20" height="20" fill="currentColor" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d.body }} />
    </Btn>; })}</Box>
  </Box>;
}

/* ---------- Assets ---------- */
function AssetTile({ a }: { a: { id: string; name: string; dataUrl: string } }) {
  const place = () => { const n = { ...cloneDeep(makeText(0, 0)), type: 'image' as const, name: a.name, src: a.dataUrl, assetId: a.id, alt: '', text: undefined, style: { x: 40, y: 40, w: 320, h: 220 } }; S.addNode(n); };
  const [hover, setHover] = useState(false);
  return (
    <Box display="flex" flex-col gap="1" min-w="0" draggable onDragStart={(e: React.DragEvent) => e.dataTransfer.setData('application/x-aa-asset', a.id)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Box position="relative" h="76px" rounded="lg" overflow="hidden" bg="gray-900/5" dark-bg="white/6" cursor="pointer" border="1px solid" border-color="transparent" hover-border-color="primary" onClick={place} title="Click to place on the canvas">
        <Box as="img" src={a.dataUrl} alt={a.name} w="100%" h="100%" object-fit="cover" draggable={false} />
        {hover && <Box position="absolute" top="4px" right="4px"><IconBtn icon="trash" title="Remove" size={22} iconSize={12} danger bg="white" onClick={(e: React.MouseEvent) => { e.stopPropagation(); removeAsset(a.id); }} /></Box>}
      </Box>
      <Txt fontSize="sm" fontWeight="500" m="0" px="1" truncate {...T.text}>{a.name}</Txt>
    </Box>
  );
}
function Assets() {
  const s = useStudio(); const p = s.project!; const [over, setOver] = useState(false);
  const addFiles = async (files: File[]) => { for (const f of files) { const r = await readImage(f); if (r) registerAsset(r.asset); } };
  const add = async () => addFiles(await pickImages(true));
  const addSvg = async () => { const f=await pickFile('.svg,image/svg+xml');if(!f)return;try{S.addNode(importSvg(await f.text(),f.name));S.toast('SVG imported as editable vector paths.');}catch(e){S.toast(e instanceof Error?e.message:'Could not import this SVG.','error');} };
  return <Box>
    <Box px="3" py="3" display="flex" flex-col gap="2">
      <Btn type="button" onClick={add} onDragOver={(e: React.DragEvent) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e: React.DragEvent) => { e.preventDefault(); setOver(false); addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))); }}
        w="100%" py="4" rounded="lg" display="flex" flex-col items="center" gap="1" cursor="pointer" border="1px dashed" {...(over ? { 'border-color': 'primary', bg: 'primary/10' } : { 'border-color': 'gray-300', 'dark-border-color': 'gray-600', bg: 'gray-50', 'dark-bg': 'gray-800/50', 'hover-border-color': 'primary' })}>
        <Box display="flex" text="primary"><Ic n="image" size={40} /></Box>
        <Txt fontSize="sm" fontWeight="600" m="0" {...T.text}>Upload images</Txt>
        <Txt fontSize="sm" m="0" {...T.label}>or drop them here</Txt>
      </Btn>
      <Btn type="button" onClick={addSvg} py="3" px="6" bg="grey-50" dark-bg="grey-800" rounded="lg" border="0" fontSize="sm" fontWeight="500" cursor="pointer">Import SVG artwork</Btn>
    </Box>
    <Section title="Images" action={<Count n={p.assets.length} />}>
      {p.assets.length>0&&<Row items="center" gap="2" mb="2"><Txt fontSize="sm" m="0" flex="1" {...T.muted}>{formatBytes(p.assets.reduce((n,a)=>n+dataUrlBytes(a.dataUrl),0))} total. New uploads are resized to 2400 px and saved as WebP.</Txt><Btn type="button" h="28px" {...T.card} fontSize="sm" cursor="pointer" onClick={()=>{void optimizeAllAssets();}}>Optimize all</Btn></Row>}
      {p.assets.length
        ? <Box display="grid" grid-cols="2" gap="2" gap-y="3">{p.assets.map(a => <AssetTile key={a.id} a={a} />)}</Box>
        : <Txt fontSize="sm" leading="snug" m="0" {...T.label}>No images yet. Upload one, or drop an image on the canvas.</Txt>}
    </Section>
    <Section title="Icons"><IconPacks /></Section>
  </Box>;
}

/* ---------- Components and UI Kit (the library lives in Library.tsx) ---------- */
/** Makes a node interactive in exported pages (menus, dropdowns, tabs, dialogs). Nothing runs inside the editor. */
function BehaviorFields({ node, ids }: { node: Node; ids: string[] }) {
  const b = node.behavior;
  const set = (patch: Partial<Behavior> | null) => S.patchNodeProps(ids, { behavior: patch === null ? undefined : { ...(b || { role: 'toggle' as const }), ...patch } });
  const role = BEHAVIOR_ROLES.find(r => r.id === b?.role);
  const keyed = b && b.role !== 'scope';
  return <Box display="flex" flex-col gap="2" px="3" py="2">
    <SelectField label="Interaction" value={b?.role || ''} options={[['', 'None'], ...BEHAVIOR_ROLES.map(r => [r.id, r.label] as [string, string])]} onChange={v => v ? set({ role: v as Behavior['role'] }) : set(null)} />
    {role && <Txt fontSize="sm" m="0" {...T.muted}>{role.hint} Works in exported pages, not inside the editor.</Txt>}
    {keyed && <TextField label={b!.role === 'close' ? 'Key (empty = the panel it sits in)' : b!.role === 'scroll' ? 'Target element id' : b!.role === 'copy' ? 'Text to copy' : 'Key (match the panel and its buttons)'} value={b!.key || ''} onCommit={v => set({ key: v })} />}
    {(b?.role === 'tab' || b?.role === 'panel') && <TextField label="Tab group (optional)" value={b!.group || ''} onCommit={v => set({ group: v })} />}
    {b?.role === 'panel' && <>
      <Checkbox label="Starts open" checked={b.initial === 'open'} onChange={v => set({ initial: v ? 'open' : 'closed' })} />
      <Checkbox label="Closes on outside click or Escape" checked={!!b.dismiss} onChange={v => set({ dismiss: v })} />
      <Checkbox label="Is a dialog (backdrop closes it)" checked={!!b.modal} onChange={v => set({ modal: v })} />
      <Checkbox label="Collapsible on phones only" checked={!!b.mobile} onChange={v => set({ mobile: v })} />
    </>}
    {b && b.role !== 'scope' && b.role !== 'panel' && <Checkbox label="Show only on phones" checked={!!b.mobileOnly} onChange={v => set({ mobileOnly: v })} />}
  </Box>;
}

const Count = ({ n }: { n: number }) => <Txt fontSize="sm" m="0" {...T.label}>{n}</Txt>;

/* ---------- Structure ---------- */
function Structure() {
  const s = useStudio(); const all = flatten(S.root(s)); const outline = all.filter(n => n.type === 'section' || n.type === 'heading');
  const issues = all.filter(n => n.type === 'image' && !n.alt).length;
  return <Box py="1">{outline.map(n => <Row key={n.id} items="center" gap="2" h="28px" px="3" cursor="pointer" {...T.hover} onClick={() => S.select([n.id])} pl={n.type === 'heading' ? '24px' : '12px'}><Ic n={n.type === 'section' ? 'section' : 'heading'} size={13} /><Txt fontSize="sm" m="0" flex="1" truncate>{n.type === 'heading' ? n.text : n.name}</Txt>{n.type === 'heading' && <Txt fontSize="sm" m="0" {...T.muted}>{n.tag || 'h2'}</Txt>}</Row>)}
    {!outline.length && <EmptyState icon="section" title="No sections or headings" />}
    {issues > 0 && <Txt fontSize="sm" m="0" px="3" py="2" text="warning">{issues} image{issues > 1 ? 's' : ''} without alt text.</Txt>}</Box>;
}

/* ---------- Code & export ---------- */
export function exportZip() { const p = S.getState().project!; download(buildSiteZip(p), `${(p.name || 'site').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.zip`); S.toast('Exported ZIP'); }
export function exportReactZip() { const p=S.getState().project!;download(buildReactProjectZip(p),`${(p.name||'site').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-react.zip`);S.toast('Exported runnable React project'); }
export function downloadProject() { const p = S.getState().project!; download(new Blob([JSON.stringify(p)], { type: 'application/json' }), `${p.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'project'}.atomattr.json`); }
function Export() {
  const s = useStudio();const p=s.project!;const pg=S.page(s);
  return <Box p="3" display="flex" flex-col gap="2">
    <Section title="Page SEO"><TextField label="Title" value={pg.seo?.title||''} placeholder={`${pg.name} · ${p.name}`} onCommit={v=>S.setPageSeo(pg.id,{...pg.seo,title:v})}/><TextField label="Description" value={pg.seo?.description||''} multiline placeholder="A short summary for search results" onCommit={v=>S.setPageSeo(pg.id,{...pg.seo,description:v})}/><Txt fontSize="sm" m="0" {...T.muted}>Applied to the exported page’s title and description tags.</Txt></Section>
    <Btn type="button" onClick={exportZip} h="32px" rounded="lg" border="0" bg="primary" text="white" fontSize="sm" fontWeight="600" cursor="pointer">Export site as ZIP</Btn>
    <Btn type="button" onClick={exportReactZip} h="30px" {...T.card} fontSize="sm" cursor="pointer">Export runnable React project</Btn>
    <Btn type="button" onClick={downloadProject} h="30px" {...T.card} fontSize="sm" cursor="pointer">Download project file</Btn>
    <Btn type="button" onClick={openImportDialog} h="30px" {...T.card} fontSize="sm" cursor="pointer">Import HTML, CSS, JS, React, Word…</Btn>
    <Label>Open code panel</Label><Box display="grid" grid-cols="2" gap="1">{TARGETS.map(t => <Btn key={t} type="button" onClick={() => S.toggleCode(t)} h="28px" rounded="lg" {...(s.layout.code.open && s.layout.code.target === t ? T.active : T.card)} fontSize="sm" cursor="pointer">{TARGET_LABEL[t]}</Btn>)}</Box></Box>;
}

function AttributesPanel() {
  const s=useStudio();const nodes=S.selNodes(s);const node=nodes[0];
  if(!node)return <EmptyState icon="sliders" title="Select an object" hint="Generated and custom AtomAttr attributes appear here."/>;
  const gen=buildGen(S.root(s),s.bp,'editor',[],null,null,{...s.project!,activeState:s.attrState==='base'?undefined:s.attrState});
  const findGen=(g:Gen,id:string):Gen|undefined=>g.id===id?g:g.children.map(c=>findGen(c,id)).find(Boolean);
  const attrs=findGen(gen,node.id)?.attrs||{};
  const state=s.attrState;
  return <Box p="3" display="flex" flex-col gap="2">
    {state!=='base'&&<Txt fontSize="sm" m="0" {...T.muted}>Showing attributes for the {state} state. Change the state in the States panel.</Txt>}
    <Section title="Box model" hint="Margin, border and padding around the content. Click a number to change it."><BoxModel style={sty(node,s.bp)} put={(p:Style)=>S.patchNodes(nodes.map(x=>x.id),p)} /></Section>
    <Section title="Generated attributes · read only"><Box as="pre" m="0" p="2" overflow="auto" max-h="180px" fontSize="sm" whitespace="pre-wrap" {...T.card}>{JSON.stringify(attrs,null,2)}</Box></Section>
    <Section title="Custom attributes" hint="Leave the value empty for a flag such as hidden or disabled."><AttrEditor node={node}/></Section>
  </Box>;
}

export const PANELS: Record<DockerId, () => React.ReactElement> = { layers: Layers, properties: Properties, structure: Structure, styles: Styles, typography: Typography, align: AlignPanel, shapes: Shapes, assets: Assets, components: Components, attributes: AttributesPanel, checks: Checks, cms: CmsPanel, code: CustomCodePanel, export: Export , fill: FillPanel, effects: EffectsPanel, vector: VectorPanel, animation: AnimationDock, analytics: AnalyticsPanel, comments: CommentsPanel, colors: ColorsPanel, states: StatesPanel };
void thumbSvg; void generate; void assetNamesFor;