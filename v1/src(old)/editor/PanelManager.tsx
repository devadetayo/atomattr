import type { ChangeEvent, MouseEvent as RME, ReactNode } from 'react';
import { Badge, Box, Btn, Input, Option, Row, Select, Stack, Txt } from 'atomattr/react';
import { ELEMENT_LABEL } from '../registry/elements';
import { PRESETS } from '../registry/presets';
import { SHAPES, ngon } from '../registry/shapes';
import type { ShapeDef } from '../registry/shapes';
import { SHAPE_DRAG_PREFIX, TOOL_MIME } from '../registry/tools';
import type { Mode } from '../registry/tools';
import type { DesignObject, SiteElement, StyleKey } from '../types/project';
import { isHex } from './ColorDock';
import type { ColorSlot, Palette } from './ColorDock';
import { Dock } from './Dock';
import type { PanelDef, Panels } from './Dock';
import { DANGER, FIELD, GHOST, I, IconButton, toolIcon } from './Studio-Ui';
import { geometryOf } from './Stage';
import type { Geometry } from './Stage';

export type AlignEdge = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';
export type ArrangeOp = 'front' | 'forward' | 'backward' | 'back';

type Props = {
  panels: Panels; mode: Mode;
  elements: SiteElement[]; selected: SiteElement | null; viewport: string;
  onSelect: (id: string) => void; onContentChange: (content: string) => void;
  onStyleChange: (key: StyleKey, value: string) => void;
  onFieldChange: (key: 'href' | 'src' | 'alt', value: string) => void;
  onUploadImage: (file: File) => void; onDelete: () => void; onDuplicate: () => void; onMove: (direction: -1 | 1) => void;
  onGeometry: (patch: Partial<Geometry>) => void;
  designObjects: DesignObject[]; selectedDesign: DesignObject | null;
  onSelectDesign: (id: string) => void; onUpdateDesign: (id: string, patch: Partial<DesignObject>) => void;
  onDeleteDesign: () => void; onDuplicateDesign: () => void; onMoveDesign: (direction: -1 | 1) => void;
  hiddenIds: Set<string>; lockedIds: Set<string>; onToggleHidden: (id: string) => void; onToggleLocked: (id: string) => void;
  onAddImageFile: (file: File) => void; onInsertPreset: (id: string) => void; onInsertShape: (id: string) => void;
  onAlign: (edge: AlignEdge) => void; onArrange: (op: ArrangeOp) => void;
  palette: Palette; colors: { primary?: string; secondary?: string }; colorLabels: [string, string]; onApplyColor: (slot: ColorSlot, value: string) => void;
};

const COLORS = ['transparent', 'white', 'primary', 'primary/10', 'gray-50', 'gray-100', 'gray-200', 'gray-800', 'gray-900', 'success', 'warning', 'danger'];
const PADDING = ['0', '2', '3', '4', '6', '8', '12'];
const FONT_SIZES = ['sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
const FONT_WEIGHTS = ['400', '500', '600', '700', '800'];
const ALIGNMENTS = ['left', 'center', 'right'];
const hexOr = (value: string | undefined, fallback: string) => (isHex(value) ? value : fallback);

/* ---------- small building blocks ---------- */
const Caption = ({ children }: { children: ReactNode }) => <Txt fontSize="xs" fontWeight="600" text="muted" m="0">{children}</Txt>;
const Note = ({ children }: { children: ReactNode }) => <Txt text="muted" fontSize="xs" m="0">{children}</Txt>;
const Pill = ({ children }: { children: ReactNode }) => <Badge bg="primary/10" text="primary" rounded="full" px="2" py="1" fontSize="xs">{children}</Badge>;
const Field = ({ label, children }: { label: string; children: ReactNode }) => <Box as="label" display="flex" flex-col gap="1" fontSize="xs" text="muted">{label}{children}</Box>;
const Action = ({ danger, ...rest }: { danger?: boolean; onClick?: () => void; disabled?: boolean; children: ReactNode }) => <Btn type="button" flex="1" {...(danger ? DANGER : GHOST)} {...rest} />;
const Empty = ({ title, children }: { title: string; children: ReactNode }) => (
  <Stack gap="1" p="3" bg="gray-50" dark-bg="gray-950" rounded="lg"><Txt fontSize="sm" fontWeight="600" m="0">{title}</Txt><Note>{children}</Note></Stack>
);
function Pick({ label, value, options, onChange }: { label: string; value: string; options: (string | [string, string])[]; onChange: (value: string) => void }) {
  return <Field label={label}><Select aria-label={label} value={value} onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)} {...FIELD}>{options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <Option key={v} value={v}>{l}</Option>; })}</Select></Field>;
}
function Num({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (value: number) => void; min?: string; max?: string; step?: string }) {
  return <Field label={label}><Input aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))} {...FIELD} /></Field>;
}
function ListRow({ active, onClick, left, right }: { active: boolean; onClick: () => void; left: ReactNode; right?: ReactNode }) {
  return (
    <Btn type="button" onClick={onClick} aria-current={active ? 'true' : undefined} display="flex" items="center" justify="between" gap="2" w="full" px="3" py="2" rounded="lg" border="none" fontSize="sm"
      bg={active ? 'primary/10' : 'transparent'} text={active ? 'primary' : 'text'} hover-bg="gray-100" dark-hover-bg="gray-800">
      <Box as="span" display="flex" items="center" gap="2" minW="0">{left}</Box>
      <Box as="span" text="muted" fontSize="xs" truncate maxW="28">{right}</Box>
    </Btn>
  );
}
type LayerRowProps = { active: boolean; onSelect: () => void; left: ReactNode; right?: ReactNode; hidden: boolean; locked: boolean; onHidden: () => void; onLocked: () => void; onUp?: () => void; onDown?: () => void; upDisabled?: boolean; downDisabled?: boolean };
function LayerRow({ active, onSelect, left, right, hidden, locked, onHidden, onLocked, onUp, onDown, upDisabled, downDisabled }: LayerRowProps) {
  return (
    <Row items="center" gap="1" opacity={hidden ? '0.5' : '1'}>
      <Box flex="1" minW="0"><ListRow active={active} onClick={onSelect} left={left} right={right} /></Box>
      {active && onUp && <IconButton label="Bring forward" onClick={onUp} disabled={upDisabled} size="7">{I.arrowUp}</IconButton>}
      {active && onDown && <IconButton label="Send backward" onClick={onDown} disabled={downDisabled} size="7">{I.arrowDown}</IconButton>}
      <IconButton label={hidden ? 'Show layer' : 'Hide layer'} onClick={onHidden} active={hidden} size="7">{hidden ? I.eyeOff : I.eye}</IconButton>
      <IconButton label={locked ? 'Unlock layer' : 'Lock layer'} onClick={onLocked} active={locked} size="7">{locked ? I.lock : I.unlock}</IconButton>
    </Row>
  );
}

/** A real outline of the shape (not an icon): filled and stroked with the current text colour, so it follows light and dark themes. */
function ShapeThumb({ def }: { def: ShapeDef }) {
  const paint = { fill: 'currentColor', fillOpacity: 0.22, stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' } as const;
  const scale = 30 / Math.max(def.w, def.h);
  const w = def.w * scale; const h = Math.max(def.h * scale, 1);
  let body: ReactNode;
  if (def.kind === 'rect') body = <rect x={(40 - w) / 2} y={(40 - h) / 2} width={w} height={h} rx={(def.radius || 0) * scale} {...paint} />;
  else if (def.kind === 'ellipse') body = <ellipse cx="20" cy="20" rx={w / 2} ry={h / 2} {...paint} />;
  else if (def.kind === 'line') body = <path d="M5 20h30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />;
  else body = <polygon points={ngon(def.points || 5, def.kind === 'star', def.radius || 0.46, 20, 20, 16)} {...paint} />;
  return <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">{body}</svg>;
}

export function PanelManager(props: Props) {
  const { mode, elements, selected, viewport, designObjects, selectedDesign: sd, hiddenIds, lockedIds, palette, colors, colorLabels } = props;
  const designMode = mode === 'design';
  const hasSelection = designMode ? !!sd : !!selected;
  const selectedIndex = selected ? elements.findIndex(e => e.id === selected.id) : -1;
  const designIndex = sd ? designObjects.findIndex(o => o.id === sd.id) : -1;
  const breakpoint = viewport === 'tablet' ? 'md' : viewport === 'desktop' ? 'lg' : null;
  const cs = (selected && breakpoint ? { ...selected.style, ...selected.style[breakpoint] } : selected?.style) as Record<string, string> | undefined;
  const style = (key: StyleKey) => (value: string) => props.onStyleChange(key, value);
  const patch = (p: Partial<DesignObject>) => { if (sd) props.onUpdateDesign(sd.id, p); };
  const textKind = selected && (selected.kind === 'heading' || selected.kind === 'text' || selected.kind === 'button');
  const locked = designMode ? !!sd && lockedIds.has(sd.id) : !!selected && lockedIds.has(selected.id);

  const images = designMode
    ? designObjects.filter(o => o.kind === 'image' && o.src).map(o => ({ id: o.id, src: o.src as string, name: `Image ${Math.round(o.width)} × ${Math.round(o.height)}`, active: sd?.id === o.id, select: () => props.onSelectDesign(o.id) }))
    : elements.filter(e => e.kind === 'image' && e.src).map(e => ({ id: e.id, src: e.src as string, name: e.asset?.name || e.alt || 'Image', active: selected?.id === e.id, select: () => props.onSelect(e.id) }));

  /* ---------- Properties ---------- */
  const properties = (): ReactNode => {
    if (designMode) {
      if (!sd) return <Empty title="Nothing selected">Select an object on the artboard or in Layers. Drag shapes to draw, drop an image file, or paste an image.</Empty>;
      return (
        <Stack gap="3">
          <Row items="center" justify="between"><Caption>{sd.kind.toUpperCase()}</Caption><Pill>Canvas object</Pill></Row>
          {sd.kind === 'image' && <Note>Image data is embedded on this canvas and included in the project file.</Note>}
          {sd.kind === 'text' && <Field label="Text"><Input aria-label="Vector text content" value={sd.text || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => patch({ text: e.target.value })} {...FIELD} /></Field>}
          {(sd.kind === 'polygon' || sd.kind === 'star') && <Num label={sd.kind === 'star' ? 'Points' : 'Sides'} min="3" max="24" value={sd.points || 5} onChange={v => patch({ points: Math.min(24, Math.max(3, v || 3)) })} />}
          {sd.kind === 'star' && <Num label="Inner radius (0.1 – 0.95)" min="0.1" max="0.95" step="0.05" value={sd.radius || 0.46} onChange={v => patch({ radius: Math.min(0.95, Math.max(0.1, v || 0.46)) })} />}
          {sd.kind === 'rect' && <Num label="Corner radius" min="0" max="400" value={sd.radius || 0} onChange={v => patch({ radius: Math.max(0, v || 0) })} />}
          <Note>Position, size and rotation are in the Transform docker.</Note>
          <Row gap="2"><Action onClick={props.onDuplicateDesign}>Duplicate</Action><Action danger onClick={props.onDeleteDesign} disabled={locked}>Delete</Action></Row>
        </Stack>
      );
    }
    if (!selected) return <Empty title="Nothing selected">Select an element on the canvas or in Layers to edit its properties.</Empty>;
    return (
      <Stack gap="3">
        <Row items="center" justify="between"><Caption>Content</Caption><Pill>{ELEMENT_LABEL[selected.kind]}</Pill></Row>
        <Input aria-label="Selected element content" value={selected.content} onChange={(e: ChangeEvent<HTMLInputElement>) => props.onContentChange(e.target.value)} {...FIELD} />
        {selected.kind === 'button' && <Stack gap="2"><Caption>Link destination</Caption><Input aria-label="Button link" placeholder="https://example.com or /about" value={selected.href || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => props.onFieldChange('href', e.target.value)} {...FIELD} /></Stack>}
        {selected.kind === 'image' && (
          <Stack gap="2">
            <Caption>Image source</Caption>
            <Input aria-label="Image source URL" placeholder="https://… or data URL" value={selected.src || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => props.onFieldChange('src', e.target.value)} {...FIELD} />
            <Note>Upload PNG, JPEG, GIF, WebP, or SVG (max 2 MB).</Note>
            <Input aria-label="Upload image" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) props.onUploadImage(f); e.target.value = ''; }} {...FIELD} />
            {selected.asset && <Txt text="success" fontSize="xs" m="0">Included in export: {selected.asset.name}</Txt>}
            <Caption>Alt text</Caption>
            <Input aria-label="Image alternative text" value={selected.alt || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => props.onFieldChange('alt', e.target.value)} {...FIELD} />
          </Stack>
        )}
        <Note>Position and size are in the Transform docker.</Note>
        <Row gap="2"><Action onClick={props.onDuplicate}>Duplicate</Action><Action danger onClick={props.onDelete} disabled={locked}>Delete</Action></Row>
      </Stack>
    );
  };

  /* ---------- Styles ---------- */
  const styles = (): ReactNode => {
    if (designMode) {
      if (!sd) return <Empty title="Nothing selected">Select an object to change its fill, stroke and opacity.</Empty>;
      return (
        <Stack gap="3">
          <Box display="grid" grid-cols="2" gap="2">
            <Field label="Fill"><Input aria-label="Object fill" type="color" value={hexOr(sd.fill, '#ffffff')} onChange={(e: ChangeEvent<HTMLInputElement>) => patch({ fill: e.target.value })} {...FIELD} h="10" p="1" /></Field>
            <Field label="Stroke"><Input aria-label="Object stroke" type="color" value={hexOr(sd.stroke, '#635bff')} onChange={(e: ChangeEvent<HTMLInputElement>) => patch({ stroke: e.target.value })} {...FIELD} h="10" p="1" /></Field>
          </Box>
          <Row gap="2"><Action onClick={() => patch({ fill: 'none' })}>No fill</Action><Action onClick={() => patch({ stroke: 'none', strokeWidth: 0 })}>No outline</Action></Row>
          <Num label="Stroke width" min="0" max="100" value={sd.strokeWidth} onChange={v => patch({ strokeWidth: Math.max(0, v || 0) })} />
          <Field label={`Opacity · ${Math.round((sd.opacity ?? 1) * 100)}%`}><Input aria-label="Object opacity" type="range" min="0" max="1" step="0.05" value={sd.opacity} accentColor="primary" onChange={(e: ChangeEvent<HTMLInputElement>) => patch({ opacity: Number(e.target.value) })} /></Field>
        </Stack>
      );
    }
    if (!selected || !cs) return <Empty title="Nothing selected">Select an element to style it.</Empty>;
    return (
      <Stack gap="3">
        <Note>{breakpoint ? `Editing the ${breakpoint} breakpoint and up (${viewport})` : 'Editing base styles (mobile)'}</Note>
        <Pick label="Background color" value={cs.bg} options={COLORS} onChange={style('bg')} />
        <Pick label="Text color" value={cs.text} options={COLORS.filter(c => c !== 'transparent')} onChange={style('text')} />
        <Pick label="Padding" value={cs.p} options={PADDING} onChange={style('p')} />
        {selected.kind === 'section' && <>
          <Pick label="Layout" value={cs.display || 'flex'} options={[['flex', 'Flex'], ['grid', 'Grid'], ['block', 'Block']]} onChange={style('display')} />
          <Pick label="Layout gap" value={cs.gap || '4'} options={PADDING.filter(v => v !== '0')} onChange={style('gap')} />
        </>}
        {selected.kind === 'image' && <Pick label="Image fit" value={cs['object-fit'] || 'cover'} options={[['cover', 'Cover'], ['contain', 'Contain'], ['fill', 'Fill']]} onChange={style('object-fit')} />}
        {(selected.kind === 'button' || selected.kind === 'image') && <Pick label="Corner radius" value={cs.rounded || 'lg'} options={[['none', 'None'], ['md', 'Medium'], ['lg', 'Large'], ['xl', 'Extra large'], ['full', 'Full']]} onChange={style('rounded')} />}
      </Stack>
    );
  };

  /* ---------- Typography ---------- */
  const typography = (): ReactNode => {
    if (designMode) {
      if (!sd || sd.kind !== 'text') return <Empty title="No text selected">Select a text object to edit its content and size.</Empty>;
      return (
        <Stack gap="3">
          <Field label="Text"><Input aria-label="Vector text content" value={sd.text || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => patch({ text: e.target.value })} {...FIELD} /></Field>
          <Num label="Font size" min="8" max="240" value={sd.fontSize || 32} onChange={v => patch({ fontSize: Math.max(8, v || 8) })} />
          <Field label="Colour"><Input aria-label="Text colour" type="color" value={hexOr(sd.fill, '#172033')} onChange={(e: ChangeEvent<HTMLInputElement>) => patch({ fill: e.target.value })} {...FIELD} h="10" p="1" /></Field>
        </Stack>
      );
    }
    if (!selected || !cs || !textKind) return <Empty title="No text selected">Select a heading, text block or button.</Empty>;
    return (
      <Stack gap="3">
        <Note>{breakpoint ? `Editing the ${breakpoint} breakpoint and up (${viewport})` : 'Editing base styles (mobile)'}</Note>
        <Box display="grid" grid-cols="2" gap="2">
          <Pick label="Size" value={cs['font-size'] || 'base'} options={FONT_SIZES} onChange={style('font-size')} />
          <Pick label="Weight" value={cs['font-weight'] || '400'} options={FONT_WEIGHTS} onChange={style('font-weight')} />
        </Box>
        {selected.kind !== 'button' && <Pick label="Alignment" value={cs.align || 'left'} options={ALIGNMENTS} onChange={style('align')} />}
        <Pick label="Text color" value={cs.text} options={COLORS.filter(c => c !== 'transparent')} onChange={style('text')} />
      </Stack>
    );
  };

  /* ---------- Colors ---------- */
  const colorsPanel = (): ReactNode => {
    if (!hasSelection) return <Empty title="Nothing selected">Select an object, then pick colours here or from the palette bar at the bottom.</Empty>;
    return (
      <Stack gap="3">
        <Box display="grid" grid-cols="2" gap="2">
          {(['primary', 'secondary'] as const).map((slot, i) => (
            <Field key={slot} label={colorLabels[i]}>
              <Input aria-label={colorLabels[i]} type="color" value={hexOr(colors[slot], '#ffffff')} onChange={(e: ChangeEvent<HTMLInputElement>) => props.onApplyColor(slot, e.target.value)} {...FIELD} h="10" p="1" />
              <Txt fontSize="xs" text="muted" m="0">{colors[slot] || 'none'}</Txt>
            </Field>
          ))}
        </Box>
        <Caption>Swatches</Caption>
        <Row flexWrap="wrap" gap="2">
          {palette.swatches.map(swatch => (
            <Btn key={swatch} type="button" aria-label={`Apply ${swatch}`} title={`${swatch} · click: ${colorLabels[0]} · right-click: ${colorLabels[1]} · Alt-click: remove`}
              onClick={(e: RME) => { if (e.altKey) palette.remove(swatch); else props.onApplyColor('primary', swatch); }}
              onContextMenu={(e: RME) => { e.preventDefault(); props.onApplyColor('secondary', swatch); }}
              w="7" h="7" minW="7" p="0" rounded="md" bg={swatch} border="1px solid gray-300" dark-border-color="gray-700" cursor="pointer" />
          ))}
          <IconButton label="Save the current colour as a swatch" onClick={() => colors.primary && palette.add(colors.primary)} disabled={!isHex(colors.primary) || palette.swatches.length >= 24} size="7">{I.plus}</IconButton>
        </Row>
        <Note>Click = {colorLabels[0].toLowerCase()} · right-click = {colorLabels[1].toLowerCase()} · Alt-click removes a swatch.</Note>
      </Stack>
    );
  };

  /* ---------- Transform ---------- */
  const transform = (): ReactNode => {
    if (designMode) {
      if (!sd) return <Empty title="Nothing selected">Select an object to move, resize or rotate it precisely.</Empty>;
      const scaleBy = (factor: number) => patch({ width: Math.max(1, Math.round(sd.width * factor)), height: Math.max(1, Math.round(sd.height * factor)) });
      const rotateBy = (deg: number) => patch({ rotation: (((Math.round(sd.rotation || 0) + deg) % 360) + 360) % 360 });
      return (
        <Stack gap="3">
          <Box display="grid" grid-cols="2" gap="2">
            {(['x', 'y', 'width', 'height', 'rotation'] as const).map(key => <Num key={key} label={key === 'rotation' ? 'Rotation (°)' : key[0].toUpperCase() + key.slice(1)} min={key === 'width' || key === 'height' ? '1' : undefined} value={Math.round(sd[key])} onChange={v => patch({ [key]: v } as Partial<DesignObject>)} />)}
          </Box>
          <Caption>Rotate</Caption>
          <Row gap="2"><Action onClick={() => rotateBy(-90)} disabled={locked}>−90°</Action><Action onClick={() => rotateBy(90)} disabled={locked}>+90°</Action><Action onClick={() => patch({ rotation: 0 })} disabled={locked}>Reset</Action></Row>
          <Caption>Scale (keeps proportions)</Caption>
          <Row gap="2">{[0.5, 0.75, 1.25, 2].map(factor => <Action key={factor} onClick={() => scaleBy(factor)} disabled={locked}>{Math.round(factor * 100)}%</Action>)}</Row>
        </Stack>
      );
    }
    if (!selected) return <Empty title="Nothing selected">Select an element to set its position and size precisely.</Empty>;
    const geo = geometryOf(selected);
    const scaleBy = (factor: number) => props.onGeometry({ w: Math.max(16, Math.round(geo.w * factor)), h: Math.max(16, Math.round(geo.h * factor)) });
    return (
      <Stack gap="3">
        <Box display="grid" grid-cols="2" gap="2">
          {(['x', 'y', 'w', 'h'] as const).map(key => <Num key={key} label={{ x: 'X', y: 'Y', w: 'Width', h: 'Height' }[key]} min={key === 'w' || key === 'h' ? '16' : undefined} value={Math.round(geo[key])} onChange={v => props.onGeometry({ [key]: v } as Partial<Geometry>)} />)}
        </Box>
        <Caption>Scale (keeps proportions)</Caption>
        <Row gap="2">{[0.5, 0.75, 1.25, 2].map(factor => <Action key={factor} onClick={() => scaleBy(factor)} disabled={locked}>{Math.round(factor * 100)}%</Action>)}</Row>
      </Stack>
    );
  };

  /* ---------- Layers ---------- */
  const layers = (): ReactNode => {
    const empty = designMode ? designObjects.length === 0 : elements.length === 0;
    return (
      <Stack gap="2">
        <Note>Select, hide or lock a layer. The selected layer can be moved forward and backward. Hidden layers are left out of the code.</Note>
        {designMode
          ? designObjects.map((o, i) => <LayerRow key={o.id} active={sd?.id === o.id} onSelect={() => props.onSelectDesign(o.id)} left={<>{toolIcon(o.kind)}<span>{i + 1} · {o.kind}</span></>} right={`${Math.round(o.width)} × ${Math.round(o.height)}`}
              hidden={hiddenIds.has(o.id)} locked={lockedIds.has(o.id)} onHidden={() => props.onToggleHidden(o.id)} onLocked={() => props.onToggleLocked(o.id)}
              onUp={() => props.onMoveDesign(1)} onDown={() => props.onMoveDesign(-1)} upDisabled={designIndex >= designObjects.length - 1} downDisabled={designIndex <= 0} />)
          : elements.map(e => <LayerRow key={e.id} active={selected?.id === e.id} onSelect={() => props.onSelect(e.id)} left={<>{toolIcon(e.kind)}<span>{ELEMENT_LABEL[e.kind]}</span></>} right={e.content}
              hidden={hiddenIds.has(e.id)} locked={lockedIds.has(e.id)} onHidden={() => props.onToggleHidden(e.id)} onLocked={() => props.onToggleLocked(e.id)}
              onUp={() => props.onMove(1)} onDown={() => props.onMove(-1)} upDisabled={selectedIndex >= elements.length - 1} downDisabled={selectedIndex <= 0} />)}
        {empty && <Note>No objects yet. Choose a tool on the left.</Note>}
      </Stack>
    );
  };

  /* ---------- Align & Arrange ---------- */
  const alignPanel = (): ReactNode => {
    if (!hasSelection) return <Empty title="Nothing selected">Select an object to align it to the page or change its stacking order.</Empty>;
    const off = locked;
    const webOnly = !designMode;
    const edges: [AlignEdge, string, boolean][] = [['left', 'Left', false], ['hcenter', 'Centre', false], ['right', 'Right', false], ['top', 'Top', false], ['vcenter', 'Middle', webOnly], ['bottom', 'Bottom', webOnly]];
    const order: [ArrangeOp, string][] = [['front', 'To front'], ['forward', 'Forward'], ['backward', 'Backward'], ['back', 'To back']];
    return (
      <Stack gap="3">
        <Caption>Align to page</Caption>
        <Box display="grid" grid-cols="3" gap="2">
          {edges.map(([edge, label, disabled]) => <Btn key={edge} type="button" disabled={off || disabled} onClick={() => props.onAlign(edge)} {...GHOST} opacity={off || disabled ? '0.4' : '1'}>{label}</Btn>)}
        </Box>
        {webOnly && <Note>A website page has no fixed height, so only top and horizontal alignment apply.</Note>}
        <Caption>Arrange</Caption>
        <Box display="grid" grid-cols="2" gap="2">
          {order.map(([op, label]) => <Btn key={op} type="button" onClick={() => props.onArrange(op)} {...GHOST}>{label}</Btn>)}
        </Box>
      </Stack>
    );
  };

  /* ---------- Shapes ---------- */
  const shapesPanel = (): ReactNode => (
    <Stack gap="2">
      <Note>Click a shape to place it, or drag it onto the artboard.{!designMode ? ' Placing a shape switches to Design mode.' : ''}</Note>
      <Box display="grid" grid-cols="4" gap="2">
        {SHAPES.map(def => (
          <Btn key={def.id} type="button" draggable title={def.label} aria-label={`Insert ${def.label}`} onClick={() => props.onInsertShape(def.id)}
            onDragStart={(event: React.DragEvent) => { event.dataTransfer.setData(TOOL_MIME, `${SHAPE_DRAG_PREFIX}${def.id}`); event.dataTransfer.effectAllowed = 'copy'; }}
            display="flex" flex-col items="center" justify="center" gap="1" py="2" px="1" rounded="lg" border="none" fontSize="xs"
            bg="gray-100" dark-bg="gray-800" text="muted" hover-bg="gray-200" dark-hover-bg="gray-700">
            <ShapeThumb def={def} />
            <Box as="span" truncate maxW="full">{def.label}</Box>
          </Btn>
        ))}
      </Box>
    </Stack>
  );

  /* ---------- Assets ---------- */
  const assets = (): ReactNode => (
    <Stack gap="3">
      <Field label={designMode ? 'Add an image to the artboard' : 'Add an image to the page'}>
        <Input aria-label="Add image" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) props.onAddImageFile(f); e.target.value = ''; }} {...FIELD} />
      </Field>
      <Note>PNG, JPEG, GIF, WebP or SVG up to 2 MB. You can also drop a file on the canvas or press Ctrl+V.</Note>
      {images.length === 0
        ? <Note>No images in this {designMode ? 'artboard' : 'page'} yet.</Note>
        : images.map(image => (
          <Btn key={image.id} type="button" onClick={image.select} aria-current={image.active ? 'true' : undefined} display="flex" items="center" gap="3" w="full" p="2" rounded="lg" border="none" fontSize="sm"
            bg={image.active ? 'primary/10' : 'transparent'} text={image.active ? 'primary' : 'text'} hover-bg="gray-100" dark-hover-bg="gray-800">
            <Box as="img" src={image.src} alt="" w="10" h="10" rounded="md" objectFit="cover" flex="none" />
            <Box as="span" truncate minW="0">{image.name}</Box>
          </Btn>
        ))}
    </Stack>
  );

  /* ---------- Sections & Presets ---------- */
  const presets = (): ReactNode => {
    if (designMode) return <Empty title="Website sections">Presets insert website sections. Switch to Web mode to use them.</Empty>;
    return (
      <Stack gap="2">
        <Note>Click a preset to add it below your existing content.</Note>
        {PRESETS.map(preset => (
          <Btn key={preset.id} type="button" onClick={() => props.onInsertPreset(preset.id)} display="flex" flex-col items="start" gap="1" w="full" p="3" rounded="lg" border="none" textAlign="left"
            bg="gray-100" dark-bg="gray-800" hover-bg="gray-200" dark-hover-bg="gray-700" text="text">
            <Box as="span" fontSize="sm" fontWeight="600">{preset.label}</Box>
            <Box as="span" fontSize="xs" text="muted">{preset.hint}</Box>
          </Btn>
        ))}
      </Stack>
    );
  };

  const defs: PanelDef[] = [
    { id: 'properties', icon: I.properties, render: properties },
    { id: 'styles', icon: I.styles, render: styles },
    { id: 'typography', icon: I.typography, render: typography },
    { id: 'colors', icon: I.colors, render: colorsPanel },
    { id: 'transform', icon: I.transform, render: transform },
    { id: 'layers', icon: I.layers, badge: designMode ? designObjects.length : elements.length, render: layers },
    { id: 'align', icon: I.align, render: alignPanel },
    { id: 'shapes', icon: I.shapes, render: shapesPanel },
    { id: 'assets', icon: I.image, badge: images.length, render: assets },
    { id: 'presets', icon: I.presets, render: presets },
  ];
  return <Dock panels={props.panels} defs={defs} />;
}
