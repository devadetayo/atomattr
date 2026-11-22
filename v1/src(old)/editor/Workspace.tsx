import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio, type Tool } from '../state/store';
import { DOCKERS, winBox, type DockerId, type Win } from '../state/layout';
import { BPS, BP_LABEL } from '../document/style';
import { Canvas } from '../canvas/Canvas';
import { keys } from '../canvas/keys';
import { PANELS, exportZip, downloadProject } from '../panels/Panels';
import { Welcome, NewProjectModal } from './Welcome';
import { Ic } from './Icons';
import { IconBtn, Kbd } from './ui';
import { T, SWATCHES, ACCENT } from '../theme';
import { generate, TARGETS, TARGET_LABEL, TARGET_EXT } from '../exporters/codegen';
import { download } from '../exporters/zip';
import { thumbSvg } from '../document/thumb';
import { pickFile } from '../state/assets';
import { parseProjectFile, listRecents } from '../state/storage';
// @ts-ignore engine lives in the AtomAttr package next to this app
import { setTheme as engineSetTheme } from '../../../src/engine/generator.js';
import { makeSection, makeText, makeHeading, makeButton } from '../document/factory';

/* ---------- tool palette (floating, movable, with flyouts) ---------- */
type ToolDef = { id: Tool; icon: string; name: string; key: string };
const GROUPS: ToolDef[][] = [
  [{ id: 'select', icon: 'select', name: 'Select', key: 'V' }, { id: 'direct', icon: 'direct', name: 'Direct select (edit nodes)', key: 'A' }],
  [{ id: 'text', icon: 'text', name: 'Text', key: 'T' }, { id: 'heading', icon: 'heading', name: 'Heading', key: 'Shift+T' }],
  [{ id: 'rect', icon: 'rect', name: 'Rectangle', key: 'R' }, { id: 'rounded', icon: 'rounded', name: 'Rounded rectangle', key: 'U' }, { id: 'ellipse', icon: 'ellipse', name: 'Ellipse', key: 'E' }, { id: 'polygon', icon: 'polygon', name: 'Polygon', key: 'G' }, { id: 'star', icon: 'star', name: 'Star', key: 'S' }, { id: 'line', icon: 'line', name: 'Line', key: 'L' }],
  [{ id: 'pen', icon: 'pen', name: 'Pen (Bézier)', key: 'P' }, { id: 'pencil', icon: 'pencil', name: 'Freehand', key: 'B' }],
  [{ id: 'section', icon: 'section', name: 'Section', key: 'X' }, { id: 'container', icon: 'container', name: 'Container', key: 'C' }, { id: 'grid', icon: 'grid', name: 'Grid', key: 'D' }],
  [{ id: 'button', icon: 'button', name: 'Button', key: 'N' }, { id: 'image', icon: 'image', name: 'Image', key: 'Shift+I' }],
  [{ id: 'eyedropper', icon: 'eyedropper', name: 'Eyedropper', key: 'I' }],
  [{ id: 'hand', icon: 'hand', name: 'Hand (or hold Space)', key: 'H' }, { id: 'zoom', icon: 'zoom', name: 'Zoom (Alt-click zooms out)', key: 'Z' }],
];
const ALL_TOOLS = GROUPS.flat();
const KEYMAP: Record<string, Tool> = Object.fromEntries(ALL_TOOLS.filter(t => !t.key.includes('Shift')).map(t => [t.key.toLowerCase(), t.id]));

function useDrag(onMove: (dx: number, dy: number, e: PointerEvent) => void, onEnd?: () => void) {
  return (e: React.PointerEvent) => {
    if (e.button !== 0) return; e.preventDefault(); const sx = e.clientX; const sy = e.clientY;
    const mv = (ev: PointerEvent) => onMove(ev.clientX - sx, ev.clientY - sy, ev); const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); onEnd?.(); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
}

function ToolPalette({ area }: { area: { w: number; h: number } }) {
  const s = useStudio(); const pos = s.layout.tools; const [fly, setFly] = useState<number | null>(null); const [last, setLast] = useState<Record<number, Tool>>({});
  const start = useRef(pos); const grip = useDrag((dx, dy) => S.setToolsPos(Math.max(0, Math.min(area.w - 60, start.current.x + dx)), Math.max(0, Math.min(area.h - 120, start.current.y + dy))));
  return (
    <Box position="absolute" left={`${pos.x}px`} top={`${pos.y}px`} z="40" {...T.panel} p="1" display="flex" flex-col gap="1" w="44px" role="toolbar" aria-label="Tools">
      <Box h="14px" display="flex" items="center" justify="center" cursor="move" {...T.muted} title="Drag to move the tool palette" onPointerDown={(e: React.PointerEvent) => { start.current = S.getState().layout.tools; grip(e); }}><Ic n="grip" size={14} /></Box>
      {GROUPS.map((g, i) => {
        const cur = g.find(t => t.id === s.tool) || g.find(t => t.id === last[i]) || g[0]; const active = g.some(t => t.id === s.tool);
        return (
          <Box key={i} position="relative">
            <IconBtn icon={cur.icon} title={`${cur.name} (${cur.key})`} active={active} size={36} iconSize={18} onClick={() => { setLast({ ...last, [i]: cur.id }); S.setTool(cur.id); setFly(null); }} onContextMenu={(e: React.MouseEvent) => { e.preventDefault(); g.length > 1 && setFly(fly === i ? null : i); }} />
            {g.length > 1 && <Box position="absolute" right="0" bottom="0" w="12px" h="12px" cursor="pointer" {...T.muted} display="flex" items="center" justify="center" title="More tools" onClick={() => setFly(fly === i ? null : i)}><Ic n="chevR" size={9} /></Box>}
            {fly === i && <Box position="absolute" left="46px" top="0" z="50" {...T.panel} p="1" w="210px" onPointerLeave={() => setFly(null)}>{g.map(t => <Row key={t.id} items="center" gap="2" h="30px" px="2" rounded="md" cursor="pointer" {...(s.tool === t.id ? T.active : T.hover)} onClick={() => { setLast({ ...last, [i]: t.id }); S.setTool(t.id); setFly(null); }}><Ic n={t.icon} size={15} /><Txt fontSize="12px" m="0" flex="1">{t.name}</Txt><Kbd>{t.key}</Kbd></Row>)}</Box>}
          </Box>
        );
      })}
    </Box>
  );
}

/* ---------- docker windows ---------- */
function Window({ win, area, docked }: { win: Win; area: { w: number; h: number }; docked?: boolean }) {
  const active = win.active; const Body = PANELS[active]; const def = DOCKERS.find(d => d.id === active)!;
  const box = winBox(win, area); const origin = useRef({ x: 0, y: 0, w: 0, h: 0 }); const tabDrag = useRef<DockerId | null>(null);
  const move = useDrag((dx, dy, e) => { const o = origin.current; const nx = o.x + dx; const left = nx + box.w / 2 < area.w / 2; S.patchWin(win.id, { ax: left ? 'l' : 'r', x: left ? Math.max(0, nx) : Math.max(0, area.w - nx - box.w), y: Math.max(0, Math.min(area.h - 34, o.y + dy)) }); void e; });
  const resize = useDrag((dx, dy) => { const o = origin.current; S.patchWin(win.id, { w: Math.max(220, o.w + (win.ax === 'l' ? dx : -dx)), h: Math.max(120, o.h + dy) }); });
  const startTab = (id: DockerId, e: React.PointerEvent) => { e.stopPropagation(); S.setActiveTab(win.id, id); if (win.tabs.length < 1) return; tabDrag.current = id; const sx = e.clientX; const sy = e.clientY; let moved = false;
    const up = (ev: PointerEvent) => { window.removeEventListener('pointerup', up); window.removeEventListener('pointermove', mv); if (!moved) return; const el = document.elementsFromPoint(ev.clientX, ev.clientY).find(x => (x as HTMLElement).dataset?.win && (x as HTMLElement).dataset.win !== win.id) as HTMLElement | undefined;
      if (el?.dataset.win) S.mergeTab(id, el.dataset.win); else if (win.tabs.length > 1) { const host = document.querySelector('[data-area]')!.getBoundingClientRect(); S.splitTab(id, 'l', Math.max(0, ev.clientX - host.left - 40), Math.max(0, ev.clientY - host.top - 12)); } };
    const mv = (ev: PointerEvent) => { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) moved = true; };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); };
  const style = docked ? { position: 'relative', w: '100%', flex: '1', 'min-h': '120px' } : { position: 'absolute', left: `${box.x}px`, top: `${box.y}px`, w: `${box.w}px`, h: `${box.h}px`, z: String(20 + win.z) };
  return (
    <Box {...style} {...T.panel} display="flex" flex-col overflow="hidden" rounded={docked ? 'none' : 'lg'} data-win={win.id} onPointerDown={() => S.focusWin(win.id)} role="region" aria-label={def.title}>
      <Row items="center" h="32px" flex="none" px="1" gap="1" cursor={win.dock ? 'default' : 'move'} bg="gray-50" dark-bg="gray-800" border-b="1px solid" border-color="gray-200" dark-border-color="gray-700"
        onPointerDown={(e: React.PointerEvent) => { if (win.dock) return; origin.current = { x: box.x, y: box.y, w: win.w, h: win.h }; if (win.ax === 'r') origin.current.x = box.x; move(e); }} onDoubleClick={() => S.patchWin(win.id, { collapsed: !win.collapsed })}>
        <Box flex="1" display="flex" min-w="0" overflow="hidden">{win.tabs.map(t => <Box key={t} px="2" h="26px" display="flex" items="center" fontSize="11px" fontWeight="700" rounded="md" cursor="pointer" whitespace="nowrap" {...(t === active ? { bg: 'white', 'dark-bg': 'gray-700', ...T.text } : { ...T.muted })} onPointerDown={(e: React.PointerEvent) => startTab(t, e)}>{DOCKERS.find(d => d.id === t)!.title}</Box>)}</Box>
        <IconBtn icon="pin" title={win.dock ? 'Unpin (float)' : 'Pin: dock to the side and resize the canvas'} active={!!win.dock} size={22} iconSize={13} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onClick={() => S.togglePin(win.id, area.w)} />
        <IconBtn icon={win.collapsed ? 'chevD' : 'collapse'} title="Collapse" size={22} iconSize={13} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onClick={() => S.patchWin(win.id, { collapsed: !win.collapsed })} />
        <IconBtn icon="x" title="Close" size={22} iconSize={13} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onClick={() => S.closeWin(win.id)} />
      </Row>
      {!win.collapsed && <Box flex="1" overflow="auto" min-h="0"><Body /></Box>}
      {!win.collapsed && !win.dock && <Box position="absolute" right="0" bottom="0" w="16px" h="16px" cursor="nwse-resize" z="3" title="Resize" onPointerDown={(e: React.PointerEvent) => { e.stopPropagation(); origin.current = { x: box.x, y: box.y, w: box.w, h: box.h }; resize(e); }} {...T.muted}><svg width="16" height="16" viewBox="0 0 16 16"><path d="M13 5L5 13M13 9l-4 4" stroke="currentColor" strokeWidth="1.3" /></svg></Box>}
    </Box>
  );
}

/* ---------- menus ---------- */
type Item = { label: string; run?: () => void; key?: string; disabled?: boolean; checked?: boolean; sep?: boolean };
function menus(s: S.State): Record<string, Item[]> {
  const sel = s.sel.length; const one = S.selNodes(s)[0]; const noSel = !sel;
  const openFile = async () => { const f = await pickFile('.json,application/json'); if (!f) return; const p = parseProjectFile(await f.text()); p ? S.openProject(p) : S.toast('That file is not an AtomAttr Studio project.', 'error'); };
  const add = (n: any) => S.addNode(n);
  const tools = (ids: Tool[]) => ids.map(id => { const t = ALL_TOOLS.find(x => x.id === id)!; return { label: t.name, key: t.key, checked: s.tool === id, run: () => S.setTool(id) }; });
  const recents = listRecents().slice(0, 5);
  return {
    File: [{ label: 'New project…', key: 'Ctrl+N', run: () => S.setState({ modal: 'new' }) }, { label: 'Open project file…', run: openFile }, ...recents.map(r => ({ label: `Open “${r.name}”`, run: () => { S.saveNow(); S.openSaved(r.id); } })), { sep: true, label: '' }, { label: 'Save', key: 'Ctrl+S', run: () => S.saveNow() && S.toast('Saved') }, { label: 'Download project file', run: downloadProject }, { label: 'Export site as ZIP', run: exportZip }, { label: 'Rename project…', run: () => S.setState({ modal: 'rename' }) }, { sep: true, label: '' }, { label: 'Close to welcome screen', run: S.goWelcome }],
    Edit: [{ label: 'Undo', key: 'Ctrl+Z', run: S.undo, disabled: !S.canUndo(s) }, { label: 'Redo', key: 'Ctrl+Shift+Z', run: S.redo, disabled: !S.canRedo(s) }, { sep: true, label: '' }, { label: 'Cut', key: 'Ctrl+X', run: () => S.copySel(true), disabled: noSel }, { label: 'Copy', key: 'Ctrl+C', run: () => S.copySel(), disabled: noSel }, { label: 'Paste', key: 'Ctrl+V', run: S.paste, disabled: !s.clip.length }, { label: 'Duplicate', key: 'Ctrl+D', run: S.duplicateSelection, disabled: noSel }, { label: 'Delete', key: 'Del', run: S.deleteSelection, disabled: noSel }, { sep: true, label: '' }, { label: 'Select all', key: 'Ctrl+A', run: S.selectAll }, { label: 'Deselect', key: 'Esc', run: S.clearSelection, disabled: noSel }],
    Object: [{ label: 'Group', key: 'Ctrl+G', run: S.groupSelection, disabled: noSel }, { label: 'Ungroup', key: 'Ctrl+Shift+G', run: S.ungroupSelection, disabled: one?.type !== 'group' }, { label: 'Enter group', run: () => one && S.enterGroup(one.id), disabled: one?.type !== 'group' }, { label: 'Exit group', run: S.exitGroup, disabled: !s.enter }, { sep: true, label: '' }, { label: 'Bring to front', key: 'Ctrl+Shift+]', run: () => S.arrange('front'), disabled: noSel }, { label: 'Bring forward', key: 'Ctrl+]', run: () => S.arrange('forward'), disabled: noSel }, { label: 'Send backward', key: 'Ctrl+[', run: () => S.arrange('backward'), disabled: noSel }, { label: 'Send to back', key: 'Ctrl+Shift+[', run: () => S.arrange('back'), disabled: noSel }, { sep: true, label: '' }, { label: 'Rotate 90° clockwise', run: () => S.rotateBy(90), disabled: noSel }, { label: 'Convert shape to path', run: S.convertToPath, disabled: one?.type !== 'shape' }, { label: 'Lock / unlock', key: 'Ctrl+L', run: () => S.toggleFlag('locked'), disabled: noSel }, { label: 'Hide / show', key: 'Ctrl+H', run: () => S.toggleFlag('hidden'), disabled: noSel }],
    View: [{ label: 'Zoom in', key: 'Ctrl++', run: () => S.zoomStep(1) }, { label: 'Zoom out', key: 'Ctrl+-', run: () => S.zoomStep(-1) }, { label: 'Fit page', key: 'Ctrl+0', run: () => S.fit('page') }, { label: 'Fit width', key: 'Ctrl+9', run: () => S.fit('width') }, { label: 'Actual size (100%)', key: 'Ctrl+1', run: () => S.fit('actual') }, { sep: true, label: '' }, { label: 'Rulers', checked: s.layout.rulers, run: () => S.setLayoutFlag({ rulers: !s.layout.rulers }) }, { label: 'Grid', checked: s.layout.grid, run: () => S.setLayoutFlag({ grid: !s.layout.grid }) }, { label: 'Guides', checked: s.layout.guides, run: () => S.setLayoutFlag({ guides: !s.layout.guides }) }, { label: 'Snapping', checked: s.layout.snap, run: () => S.setLayoutFlag({ snap: !s.layout.snap }) }, { sep: true, label: '' }, { label: 'Preview mode', key: 'Ctrl+P', checked: s.preview, run: () => S.setPreview(!s.preview) }, { label: 'Code panel', key: 'Ctrl+E', checked: s.layout.code.open, run: () => S.toggleCode() }, { label: 'Dark theme', checked: s.theme === 'dark', run: S.toggleTheme }, ...BPS.filter(b => b === 'desktop' || s.project?.settings?.[b] !== false).map(b => ({ label: `${BP_LABEL[b]} size`, checked: s.bp === b, run: () => S.setBp(b) }))],
    Insert: [{ label: 'Text', run: () => add(makeText(80, 80)) }, { label: 'Heading', run: () => add(makeHeading(80, 80)) }, { label: 'Button', run: () => add(makeButton(80, 80)) }, { label: 'Image…', run: () => S.setTool('image') }, { sep: true, label: '' }, { label: 'Section', run: () => S.addNode(makeSection('Section', 480), S.root(s).id) }, ...tools(['container', 'grid', 'rect', 'ellipse', 'polygon', 'star', 'line', 'pen', 'pencil']), { sep: true, label: '' }, { label: 'New page', run: () => S.addPage() }],
    Components: [{ label: 'Open Components docker', run: () => S.openDocker('components') }, { label: 'Create from selection', run: () => { S.openDocker('components'); }, disabled: noSel }],
    Publish: [{ label: 'Export site as ZIP', run: exportZip }, { label: 'Preview in a new tab', run: () => { const p = S.getState().project!; const html = generate(p, 'HTML').code; const css = generate(p, 'CSS').code; void html; const code = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>${css}</style>${previewBody(p)}`; window.open(URL.createObjectURL(new Blob([code], { type: 'text/html' }))); } }, { label: 'Copy code (current target)', run: () => { void navigator.clipboard.writeText(generate(s.project!, s.layout.code.target).code); S.toast('Copied'); } }],
    Window: [...DOCKERS.map(d => ({ label: d.title, checked: !!S.winOf(d.id, s.layout), run: () => S.toggleDocker(d.id) })), { sep: true, label: '' }, { label: 'Colour palette', checked: s.layout.palette.visible, run: () => S.setPalette({ visible: !s.layout.palette.visible }) }, { label: 'Page band', checked: s.layout.band.open, run: () => S.setBand(!s.layout.band.open) }, { sep: true, label: '' }, { label: 'Reset workspace', run: S.resetWorkspace }],
    Help: [{ label: 'Keyboard shortcuts', key: '?', run: () => S.setState({ modal: 'shortcuts' }) }, { label: 'About AtomAttr Studio', run: () => S.setState({ modal: 'about' }) }],
  };
}
import { buildGen } from '../document/gen';
import { markupLines, assetNamesFor } from '../exporters/codegen';
import { indexGen } from '../exporters/css';
function previewBody(p: any) { const root = buildGen(p.pages.find((x: any) => x.id === p.activePageId).root, 'desktop', 'export'); const cls = new Map(); indexGen(root).forEach(({ gen, cls: c }) => cls.set(gen, c)); return markupLines(root, 0, assetNamesFor(p), cls).join('\n').replace(/src="assets\/[^"]+"/g, m => { const a = p.assets.find((x: any) => m.includes((x.name || '').toLowerCase().replace(/\.[a-z0-9]+$/, ''))); return a ? `src="${a.dataUrl}"` : m; }); }

function MenuBar() {
  const s = useStudio(); const m = menus(s); const open = s.menu;
  return (
    <Row items="center" h="30px" px="2" gap="0" {...T.chrome} border-b="1px solid" role="menubar" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      {Object.entries(m).map(([name, items]) => (
        <Box key={name} position="relative">
          <Btn type="button" onClick={() => S.setState({ menu: open === name ? null : name })} onPointerEnter={() => open && open !== name && S.setState({ menu: name })} h="26px" px="3" border="0" rounded="md" fontSize="12px" cursor="pointer" {...(open === name ? T.active : { bg: 'transparent', ...T.hover, ...T.text })}>{name}</Btn>
          {open === name && <Box position="absolute" left="0" top="28px" z="90" {...T.panel} p="1" min-w="250px" role="menu">{items.map((it, i) => it.sep ? <Box key={i} h="1px" my="1" {...T.divider} /> :
            <Row key={i} items="center" gap="2" h="28px" px="2" rounded="md" role="menuitem" cursor={it.disabled ? 'not-allowed' : 'pointer'} opacity={it.disabled ? '0.4' : '1'} {...(it.disabled ? {} : T.hover)} onClick={() => { if (it.disabled) return; S.setState({ menu: null }); it.run?.(); }}>
              <Box w="14px" display="flex">{it.checked && <Ic n="check" size={13} />}</Box><Txt fontSize="12px" m="0" flex="1">{it.label}</Txt>{it.key && <Kbd>{it.key}</Kbd>}</Row>)}</Box>}
        </Box>))}
    </Row>
  );
}

/* ---------- header ---------- */
const ZOOMS = [10, 25, 50, 75, 100, 150, 200, 400, 800];
function Header() {
  const s = useStudio(); const [zoomOpen, setZoomOpen] = useState(false); const [launch, setLaunch] = useState(false); const p = s.project!;
  return (
    <Row items="center" h="44px" px="3" gap="2" {...T.chrome} border-b="1px solid" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      <IconBtn icon="home" title="Welcome screen" onClick={S.goWelcome} />
      <Btn type="button" onClick={() => S.setState({ modal: 'rename' })} title="Rename project" bg="transparent" border="0" cursor="pointer" fontSize="13px" fontWeight="700" {...T.text} max-w="200px" overflow="hidden" whitespace="nowrap" text-overflow="ellipsis">{p.name}</Btn>
      <Txt fontSize="11px" m="0" {...T.muted} whitespace="nowrap">{s.dirty ? 'Saving…' : 'Saved'}</Txt>
      <Box flex="1" />
      <IconBtn icon="undo" title="Undo (Ctrl+Z)" onClick={S.undo} disabled={!S.canUndo(s)} /><IconBtn icon="redo" title="Redo (Ctrl+Shift+Z)" onClick={S.redo} disabled={!S.canRedo(s)} />
      <Row {...T.card} p="1" gap="1">{BPS.filter(b => b === 'desktop' || p.settings?.[b] !== false).map(b => <IconBtn key={b} icon={b} title={`${BP_LABEL[b]} preview`} active={s.bp === b} size={26} onClick={() => S.setBp(b)} />)}</Row>
      <Row items="center" gap="0" position="relative"><IconBtn icon="minus" title="Zoom out" onClick={() => S.zoomStep(-1)} />
        <Btn type="button" title="Zoom level" onClick={() => setZoomOpen(!zoomOpen)} w="58px" h="28px" border="0" rounded="md" bg="transparent" {...T.hover} {...T.text} fontSize="12px" fontWeight="600" cursor="pointer">{Math.round(s.view.zoom * 100)}%</Btn>
        <IconBtn icon="plus" title="Zoom in" onClick={() => S.zoomStep(1)} />
        {zoomOpen && <Box position="absolute" right="0" top="32px" z="90" {...T.panel} p="1" w="170px" onPointerLeave={() => setZoomOpen(false)}>
          {[['Fit page', () => S.fit('page')], ['Fit width', () => S.fit('width')], ['Fit all', () => S.fit('page')], ...ZOOMS.map(z => [`${z}%`, () => S.zoomTo(z / 100)])].map(([l, f]: any) => <Row key={l} h="26px" px="2" items="center" rounded="md" cursor="pointer" fontSize="12px" {...T.hover} onClick={() => { f(); setZoomOpen(false); }}>{l}</Row>)}</Box>}
      </Row>
      <IconBtn icon="fit" title="Fit page" onClick={() => S.fit('page')} />
      <Box position="relative"><Btn type="button" onClick={() => setLaunch(!launch)} h="30px" px="3" rounded="md" {...(launch ? T.active : T.card)} fontSize="12px" fontWeight="600" cursor="pointer"><Row items="center" gap="1"><Ic n="window" size={14} />Dockers</Row></Btn>
        {launch && <Box position="absolute" right="0" top="34px" z="90" {...T.panel} p="1" w="260px" onPointerLeave={() => setLaunch(false)}>{DOCKERS.map(d => { const on = !!S.winOf(d.id, s.layout); return <Row key={d.id} items="center" gap="2" h="34px" px="2" rounded="md" cursor="pointer" {...T.hover} onClick={() => S.toggleDocker(d.id)}><Box w="14px">{on && <Ic n="check" size={13} />}</Box><Box flex="1"><Txt fontSize="12px" fontWeight="600" m="0">{d.title}</Txt><Txt fontSize="10px" m="0" {...T.muted}>{d.blurb}</Txt></Box></Row>; })}<Box h="1px" my="1" {...T.divider} /><Row h="30px" px="2" items="center" rounded="md" cursor="pointer" fontSize="12px" {...T.hover} onClick={S.resetWorkspace}>Reset workspace</Row></Box>}</Box>
      <IconBtn icon="play" title="Preview (Ctrl+P)" active={s.preview} onClick={() => S.setPreview(!s.preview)} />
      <IconBtn icon="code" title="Code panel (Ctrl+E)" active={s.layout.code.open} onClick={() => S.toggleCode()} />
      <IconBtn icon={s.theme === 'dark' ? 'sun' : 'moon'} title="Toggle light / dark" onClick={S.toggleTheme} />
      <Btn type="button" onClick={exportZip} h="30px" px="3" rounded="md" border="0" bg="primary" text="white" fontSize="12px" fontWeight="600" cursor="pointer">Export</Btn>
    </Row>
  );
}

/* ---------- code split ---------- */
function CodeSplit() {
  const s = useStudio(); const c = s.layout.code; const out = generate(s.project!, c.target); const w0 = useRef(c.w);
  const drag = useDrag((dx) => S.setCode({ w: Math.max(300, Math.min(900, w0.current - dx)) }), () => setTimeout(() => S.fit('page'), 10));
  return (
    <Row h="100%" flex="none" w={`${c.w}px`} {...T.chrome} border-l="1px solid" position="relative">
      <Box position="absolute" left="-3px" top="0" w="6px" h="100%" cursor="col-resize" z="5" bg="transparent" hover-bg="primary" title="Drag to resize" onPointerDown={(e: React.PointerEvent) => { w0.current = S.getState().layout.code.w; drag(e); }} />
      <Box display="flex" flex-col w="100%" min-w="0">
        <Row items="center" gap="1" h="34px" px="2" overflow="auto" flex="none" border-b="1px solid" border-color="gray-200" dark-border-color="gray-800">{TARGETS.map(t => <Btn key={t} type="button" onClick={() => S.setCode({ target: t })} h="24px" px="2" border="0" rounded="md" fontSize="11px" fontWeight="600" cursor="pointer" whitespace="nowrap" {...(c.target === t ? T.active : { bg: 'transparent', ...T.hover, ...T.muted })}>{TARGET_LABEL[t]}</Btn>)}
          <Box flex="1" /><IconBtn icon="copy" title="Copy code" size={24} onClick={() => { void navigator.clipboard.writeText(out.code); S.toast('Copied'); }} /><IconBtn icon="download" title={`Download ${out.file}`} size={24} onClick={() => download(new Blob([out.code]), out.file)} /><IconBtn icon="x" title="Close code panel" size={24} onClick={() => S.toggleCode()} /></Row>
        {out.note && <Txt fontSize="11px" m="0" px="3" py="1" bg="warning/10" {...T.muted}>{out.note}</Txt>}
        <Box as="pre" flex="1" m="0" p="3" overflow="auto" fontSize="12px" line-height="1.55" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" {...T.text} bg="gray-50" dark-bg="gray-950" tab-size="2" white-space="pre" aria-label={`${c.target} code (read only)`}>{out.code}</Box>
        <Txt fontSize="10px" m="0" px="3" py="1" {...T.muted}>Read-only. Edit on the canvas; this view updates live.</Txt>
      </Box>
    </Row>
  );
}

/* ---------- colour palette ---------- */
function ColourPalette() {
  const s = useStudio(); const pal = s.layout.palette; const sel = S.selNodes(s); const target = s.paint.target; const [hex, setHex] = useState('');
  const apply = (c: string) => { S.pushRecentColor(c); if (sel.length) S.patchNodes(s.sel, target === 'fill' ? { fill: c } : { stroke: c, strokeWidth: sel[0].style.strokeWidth || 2 }); else S.toast('Select an object to colour it.'); };
  const cur = sel[0]?.style[target === 'fill' ? 'fill' : 'stroke'];
  if (!pal.visible) return <IconBtn icon="palette" title="Show colour palette" position="absolute" left="50%" bottom="8px" z="40" {...T.panel} onClick={() => S.setPalette({ visible: true })} size={32} />;
  return (
    <Box position="absolute" left="50%" bottom="8px" z="40" {...T.panel} px="2" py="1" max-w="92%" ml="0" style-translate="" transform="translateX(-50%)">
      <Row items="center" gap="2">
        <Box position="relative" w="34px" h="30px" flex="none" title="Fill / stroke. Click to switch.">
          <Box position="absolute" left="0" top="0" w="20px" h="20px" rounded="sm" border={target === 'fill' ? '2px solid primary' : '1px solid gray-400'} bg={sel[0]?.style.fill || 'transparent'} cursor="pointer" onClick={() => S.setState({ paint: { target: 'fill' } })} z={target === 'fill' ? '2' : '1'} />
          <Box position="absolute" left="10px" top="8px" w="20px" h="20px" rounded="sm" border={target === 'stroke' ? '3px solid' : '3px solid'} border-color={sel[0]?.style.stroke || 'gray-400'} bg="transparent" cursor="pointer" onClick={() => S.setState({ paint: { target: 'stroke' } })} z={target === 'stroke' ? '2' : '1'} />
        </Box>
        <Row gap="1" overflow="auto" max-w="440px">{[...SWATCHES, ...s.project!.colors].map(c => <Box key={c} w="20px" h="20px" flex="none" rounded="sm" border="1px solid gray-300" dark-border-color="gray-600" cursor="pointer" bg={c} title={c} onClick={() => apply(c)} />)}</Row>
        {s.recentColors.length > 0 && <Row gap="1" pl="2" border-l="1px solid" border-color="gray-300" dark-border-color="gray-600" title="Recent">{s.recentColors.slice(0, 6).map(c => <Box key={c} w="16px" h="16px" rounded="full" cursor="pointer" bg={c} border="1px solid gray-300" onClick={() => apply(c)} />)}</Row>}
        <Input type="text" value={hex} placeholder={cur || '#hex'} aria-label="Hex colour" onChange={(e: any) => setHex(e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter' && /^#?[0-9a-f]{3,8}$/i.test(hex)) { apply(hex.startsWith('#') ? hex : `#${hex}`); setHex(''); } e.stopPropagation(); }} w="76px" h="26px" px="2" fontSize="11px" {...T.field} />
        <IconBtn icon="eyedropper" title="Eyedropper" size={26} onClick={() => S.setTool('eyedropper')} /><IconBtn icon="x" title="Hide palette" size={26} onClick={() => S.setPalette({ visible: false })} />
      </Row>
    </Box>
  );
}

/* ---------- page band (bottom-bound) ---------- */
function PageBand() {
  const s = useStudio(); const p = s.project!; const open = s.layout.band.open; const [rename, setRename] = useState<string | null>(null);
  const status = `${BP_LABEL[s.bp]} ${Math.round(s.view.zoom * 100)}% · ${s.sel.length ? `${s.sel.length} selected` : 'nothing selected'} · ${S.page(s).name}`;
  return (
    <Box flex="none" {...T.chrome} border-t="1px solid" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      {open && <Row items="center" gap="2" h="84px" px="3" overflow="auto">
        {p.pages.map((pg, i) => <Box key={pg.id} flex="none" w="88px" cursor="pointer" draggable onDragStart={(e: React.DragEvent) => e.dataTransfer.setData('application/x-aa-page', pg.id)} onDragOver={(e: React.DragEvent) => e.preventDefault()} onDrop={(e: React.DragEvent) => { const id = e.dataTransfer.getData('application/x-aa-page'); if (id) S.movePage(id, i); }} onClick={() => S.switchPage(pg.id)} onDoubleClick={() => setRename(pg.id)}>
          <Box h="48px" bg="white" overflow="hidden" rounded="sm" border={pg.id === p.activePageId ? '2px solid primary' : '1px solid gray-300'} dark-border-color={pg.id === p.activePageId ? 'primary' : 'gray-600'}><Box as="img" alt="" src={`data:image/svg+xml;utf8,${encodeURIComponent(thumbSvg(pg.root))}`} w="100%" h="100%" object-fit="cover" draggable={false} /></Box>
          {rename === pg.id ? <Box as="input" autoFocus defaultValue={pg.name} w="100%" h="18px" fontSize="11px" {...T.field} onBlur={(e: any) => { S.renamePage(pg.id, e.target.value); setRename(null); }} onKeyDown={(e: any) => { if (e.key === 'Enter') e.target.blur(); e.stopPropagation(); }} /> : <Txt fontSize="11px" m="0" mt="1" fontWeight={pg.id === p.activePageId ? '700' : '400'} whitespace="nowrap" overflow="hidden" text-overflow="ellipsis">{pg.name}</Txt>}
        </Box>)}
        <Row gap="0" flex="none"><IconBtn icon="plus" title={p.kind === 'page' ? 'Single-page project' : 'Add page'} disabled={p.kind === 'page'} onClick={() => S.addPage()} /><IconBtn icon="copy" title="Duplicate page" disabled={p.kind === 'page'} onClick={() => S.duplicatePage(p.activePageId)} /><IconBtn icon="trash" title="Delete page" danger disabled={p.pages.length < 2} onClick={() => confirm('Delete this page?') && S.deletePage(p.activePageId)} /></Row>
      </Row>}
      <Row items="center" h="24px" px="3" gap="3" border-t={open ? '1px solid' : '0'} border-color="gray-200" dark-border-color="gray-800">
        <IconBtn icon={open ? 'chevD' : 'chevU'} title={open ? 'Collapse page band' : 'Expand page band'} size={20} iconSize={12} onClick={() => S.setBand(!open)} />
        <Txt fontSize="11px" m="0" {...T.muted}>{status}</Txt><Box flex="1" /><Txt fontSize="11px" m="0" {...T.muted}>{p.kind === 'page' ? 'Page project (exports as a one-page site)' : `${p.pages.length} page${p.pages.length > 1 ? 's' : ''}`}</Txt>
      </Row>
    </Box>
  );
}

/* ---------- modals ---------- */
function Modals() {
  const s = useStudio(); const [name, setName] = useState(s.project?.name || '');
  if (s.modal === 'new') return <NewProjectModal />;
  const Shell = ({ title, children }: { title: string; children: React.ReactNode }) => <Box position="fixed" top="0" left="0" w="100%" h="100%" z="100" display="flex" items="center" justify="center" bg="black/50" onPointerDown={() => S.setState({ modal: null })}><Box {...T.panel} p="5" w="min(480px, 94vw)" max-h="80vh" overflow="auto" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}><Row justify="between" items="center" mb="3"><Txt fontSize="16px" fontWeight="700" m="0">{title}</Txt><IconBtn icon="x" title="Close" onClick={() => S.setState({ modal: null })} /></Row>{children}</Box></Box>;
  if (s.modal === 'rename') return <Shell title="Rename project"><Input type="text" value={name} autoFocus onChange={(e: any) => setName(e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter') { S.renameProject(name); S.setState({ modal: null }); } e.stopPropagation(); }} w="100%" h="34px" px="3" {...T.field} /><Row justify="end" mt="3"><Btn type="button" onClick={() => { S.renameProject(name); S.setState({ modal: null }); }} h="32px" px="4" rounded="md" border="0" bg="primary" text="white" cursor="pointer">Rename</Btn></Row></Shell>;
  if (s.modal === 'about') return <Shell title="AtomAttr Studio"><Txt fontSize="13px" m="0" {...T.muted}>A visual website builder with vector tools. The interface is styled entirely with AtomAttr attributes. Projects are saved in this browser; export gives you a ZIP with a plain HTML/CSS site and the AtomAttr markup.</Txt></Shell>;
  if (s.modal === 'shortcuts') return <Shell title="Keyboard shortcuts"><Box display="grid" grid-cols="2" gap="1">{[...ALL_TOOLS.map(t => [t.name, t.key]), ['Undo', 'Ctrl+Z'], ['Redo', 'Ctrl+Shift+Z'], ['Group', 'Ctrl+G'], ['Ungroup', 'Ctrl+Shift+G'], ['Duplicate', 'Ctrl+D'], ['Delete', 'Del'], ['Nudge', 'Arrows (Shift ×10)'], ['Pan', 'Space + drag'], ['Zoom', 'Ctrl + wheel / pinch'], ['Fit page', 'Ctrl+0'], ['Preview', 'Ctrl+P'], ['Code panel', 'Ctrl+E']].map(([a, b]) => <Row key={a} justify="between" gap="2" py="1"><Txt fontSize="12px" m="0">{a}</Txt><Kbd>{b}</Kbd></Row>)}</Box></Shell>;
  return null;
}

/* ---------- root ---------- */
export function Workspace() {
  const s = useStudio(); const areaRef = useRef<HTMLDivElement | null>(null); const [area, setArea] = useState({ w: 1000, h: 600 });
  useEffect(() => { try { engineSetTheme(s.theme); } catch { /* theme engine unavailable */ } }, [s.theme]);
  useEffect(() => { const el = areaRef.current; if (!el) return; const ro = new ResizeObserver(() => setArea({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el); setArea({ w: el.clientWidth, h: el.clientHeight }); return () => ro.disconnect(); }, [s.screen]);
  useEffect(() => { const t = setTimeout(() => S.fit('page'), 60); return () => clearTimeout(t); }, [s.layout.wins.map(w => w.dock).join(), s.layout.code.open, s.layout.band.open]);
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; const typing = t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable); const st = S.getState(); const mod = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
      if (typing || st.screen !== 'editor') return;
      if (e.code === 'Space') { keys.space = true; e.preventDefault(); return; }
      if (mod) { const hit = (() => { switch (k) { case 'z': e.shiftKey ? S.redo() : S.undo(); return 1; case 'y': S.redo(); return 1; case 'g': e.shiftKey ? S.ungroupSelection() : S.groupSelection(); return 1; case 'd': S.duplicateSelection(); return 1; case 'a': S.selectAll(); return 1; case 'c': S.copySel(); return 1; case 'x': S.copySel(true); return 1; case 'v': S.paste(); return 1; case 's': S.saveNow() && S.toast('Saved'); return 1; case 'n': S.setState({ modal: 'new' }); return 1; case 'p': S.setPreview(!st.preview); return 1; case 'e': S.toggleCode(); return 1; case '0': S.fit('page'); return 1; case '9': S.fit('width'); return 1; case '1': S.fit('actual'); return 1; case '=': case '+': S.zoomStep(1); return 1; case '-': S.zoomStep(-1); return 1; case 'l': S.toggleFlag('locked'); return 1; case 'h': S.toggleFlag('hidden'); return 1; case ']': S.arrange(e.shiftKey ? 'front' : 'forward'); return 1; case '[': S.arrange(e.shiftKey ? 'back' : 'backward'); return 1; default: return 0; } })(); if (hit) e.preventDefault(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (st.pointPick) { const n = S.selNodes(st)[0]; if (n?.pts && n.pts.length > 2) S.replaceNode(n.id, nn => ({ ...nn, pts: nn.pts!.filter((_, i) => i !== st.pointPick!.index) })); S.setState({ pointPick: null }); } else S.deleteSelection(); e.preventDefault(); return; }
      if (e.key === 'Escape') { if (st.modal) S.setState({ modal: null }); else if (st.menu) S.setState({ menu: null }); else if (st.enter && !st.sel.length) S.exitGroup(); else if (st.enter) S.exitGroup(); else if (st.preview) S.setPreview(false); else if (st.tool !== 'select') S.setTool('select'); else S.clearSelection(); return; }
      if (e.key === 'Enter' && st.sel.length === 1) { const n = S.selNodes(st)[0]; if (n?.type === 'group') { S.enterGroup(n.id); S.select([n.children![0].id]); } else if (n && (n.type === 'text' || n.type === 'heading' || n.type === 'button')) S.setState({ edit: n.id }); return; }
      if (e.key === '?') { S.setState({ modal: 'shortcuts' }); return; }
      if (e.key.startsWith('Arrow') && st.sel.length) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; const dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0; const dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0; S.begin0(); S.selNodes(st).forEach(n => { if ((n.style.mode ?? 'abs') === 'abs') S.patchNodes([n.id], { x: (Number(n.style.x ?? 0)) + dx, y: Number(n.style.y ?? 0) + dy }, 'desktop'); }); S.end0(); return; }
      if (e.shiftKey && k === 't') { S.setTool('heading'); return; } if (e.shiftKey && k === 'i') { S.setTool('image'); return; }
      const tool = KEYMAP[k]; if (tool && !e.shiftKey && !e.altKey) S.setTool(tool);
    };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') keys.space = false; };
    const close = () => { if (S.getState().menu) S.setState({ menu: null }); };
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up); window.addEventListener('pointerdown', close);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); window.removeEventListener('pointerdown', close); };
  }, []);

  const body = s.screen === 'welcome' || !s.project
    ? <Welcome />
    : (() => {
      const L = s.layout; const left = L.wins.filter(w => w.dock === 'left'); const right = L.wins.filter(w => w.dock === 'right'); const floating = L.wins.filter(w => !w.dock);
      const sideCol = (side: 'left' | 'right', wins: Win[]) => wins.length > 0 && !s.preview && <Box flex="none" w={`${L.side[side]}px`} h="100%" display="flex" flex-col position="relative" {...T.chrome} border-l={side === 'right' ? '1px solid' : '0'} border-r={side === 'left' ? '1px solid' : '0'}>
        <Box position="absolute" top="0" {...(side === 'left' ? { right: '-3px' } : { left: '-3px' })} w="6px" h="100%" z="5" cursor="col-resize" hover-bg="primary" onPointerDown={(e: React.PointerEvent) => { const w0 = S.getState().layout.side[side]; const sx = e.clientX; const mv = (ev: PointerEvent) => S.setSide(side, w0 + (side === 'left' ? ev.clientX - sx : sx - ev.clientX)); const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); S.fit('page'); }; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); }} />
        {wins.map(w => <Window key={w.id} win={w} area={area} docked />)}</Box>;
      return (
        <Box display="flex" flex-col w="100%" h="100%" {...T.app}>
          {!s.preview && <><Header /><MenuBar /></>}
          {s.preview && <Row items="center" h="36px" px="3" gap="2" {...T.chrome} border-b="1px solid"><Txt fontSize="12px" m="0" flex="1" {...T.muted}>Preview · {BP_LABEL[s.bp]}</Txt>{BPS.map(b => <IconBtn key={b} icon={b} title={BP_LABEL[b]} active={s.bp === b} size={26} onClick={() => S.setBp(b)} />)}<Btn type="button" onClick={() => S.setPreview(false)} h="26px" px="3" rounded="md" border="0" bg="primary" text="white" fontSize="12px" cursor="pointer">Exit preview</Btn></Row>}
          <Row flex="1" min-h="0" position="relative" ref={areaRef} data-area="true">
            {sideCol('left', left)}
            <Box flex="1" min-w="0" h="100%" position="relative"><Canvas /></Box>
            {L.code.open && !s.preview && <CodeSplit />}
            {sideCol('right', right)}
            {!s.preview && <Box position="absolute" top="0" left="0" w="100%" h="100%" pointer-events="none"><Box position="relative" w="100%" h="100%">{!s.preview && <Box pointer-events="auto" display="contents"><ToolPalette area={area} />{floating.map(w => <Box key={w.id} pointer-events="auto" display="contents"><Window win={w} area={area} /></Box>)}<ColourPalette /></Box>}</Box></Box>}
          </Row>
          {!s.preview && <PageBand />}
        </Box>
      );
    })();
  return (
    <Box w="100vw" h="100vh" overflow="hidden" position="relative" className={s.theme === 'dark' ? 'dark' : ''} data-theme={s.theme}>
      {body}<Modals />
      {s.toast && <Box position="fixed" bottom="56px" left="50%" transform="translateX(-50%)" z="120" px="4" py="2" rounded="lg" shadow="lg" bg={s.toast.kind === 'error' ? 'danger' : 'gray-900'} text="white" fontSize="12px" role="status">{s.toast.text}</Box>}
    </Box>
  );
}
export default Workspace;
void ACCENT;
