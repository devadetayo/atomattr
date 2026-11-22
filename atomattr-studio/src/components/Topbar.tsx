import { BETA } from '../state/diagnostics';
import { openFeedback } from './FeedbackDialog';
import { openImportDialog } from './ImportDialog';
import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio, type Tool } from '../state/store';
import { DOCKERS, DOCKER_META, PRESETS, activePreset } from '../state/layout';
import { PanelsMenu } from './PanelMenu';
import { BPS, BP_LABEL } from '../document/style';
import { keys } from '../canvas/keys';
import { PANELS, exportZip, exportReactZip, downloadProject } from '../panels/Panels';
import { Welcome, NewProjectModal } from './Welcome';
import { ToolIcon } from './ToolIcons';
import { IconBtn, Kbd } from './ui';
import { T, ACCENT_CHOICES, ACCENT_DEFAULT, isHex } from '../theme';
import { BI, type BarIcon } from './BarIcons';
import { generate, TARGETS, TARGET_LABEL, TARGET_EXT } from '../exporters/codegen';
import { download } from '../exporters/zip';
import { thumbSvg } from '../document/thumb';
import { pickFile } from '../state/assets';
import { parseProjectFile, listRecents } from '../state/storage';
import { previewSafe } from '../exporters/custom-code';
import { openProjectFromDisk, projectFileName, saveProjectAsArchive } from '../state/project-file';
import { makeSection, makeText, makeHeading, makeButton } from '../document/factory';
import { GROUPS, ALL_TOOLS, KEYMAP, useDrag } from './tools';
import { closeToWelcome, confirmResetWorkspace, promptCustomViewport, promptSnapshotName } from '../state/confirm';

/* ---------- menus ---------- */
type Item = { label: string; run?: () => void; key?: string; disabled?: boolean; checked?: boolean; sep?: boolean; icon?: string };

/** Icon per docker id (ToolIcon keys). Unknown ids fall back to a generic panel icon. */
const DOCKER_ICON: Record<string, string> = { layers: 'layers', properties: 'sliders', inspector: 'sliders', structure: 'structure', styles: 'styles', assets: 'image', fill: 'fountain', effects: 'transparency', vector: 'pen', components: 'component', code: 'code', pages: 'pages' };

/** Icon per menu item, by label. Tool and docker items set their own icon directly. */
const MENU_ICON: Record<string, string> = {
  'New project…': 'filenew', 'Open project…': 'folder', 'Import HTML, CSS, JS, React, Word…': 'folder', 'Open project file…': 'folder', 'Save as…': 'save', Save: 'save', 'Export project ZIP': 'download', 'Import project ZIP': 'folder', 'Create version snapshot…': 'snapshot', 'Download project file': 'download', 'Export site as ZIP': 'export', 'Rename project…': 'pencil', 'Close to welcome screen': 'home',
  Undo: 'undo', Redo: 'redo', Cut: 'cut', Copy: 'copy', Paste: 'paste', 'Copy style': 'brush', 'Paste style': 'styles', Duplicate: 'duplicate', Delete: 'trash', 'Select all': 'selectall', Deselect: 'deselect',
  Group: 'group', Ungroup: 'ungroup', 'Enter group': 'enter', 'Exit group': 'exit', 'Bring to front': 'tofront', 'Bring forward': 'forward', 'Send backward': 'backward', 'Send to back': 'toback', 'Rotate 90° clockwise': 'rotate', 'Convert shape to path': 'topath', 'Lock / unlock': 'lock', 'Hide / show': 'eye',
  'Zoom in': 'plus', 'Zoom out': 'minus', 'Fit page': 'fit', 'Fit width': 'fitwidth', 'Actual size (100%)': 'actual', Grid: 'grid', Guides: 'guides', 'Safe area': 'safe', Snapping: 'snap', 'Preview mode': 'play', 'Compare artboards': 'compare', 'Mobile device frame': 'mobile', 'Code panel': 'code', 'Dark theme': 'moon',
  Text: 'text', Heading: 'heading', Button: 'button', 'Image…': 'image', 'SVG artwork…': 'image', Section: 'section', 'New page': 'pages',
  'Fill docker': 'fountain', 'Effects docker': 'transparency', 'Vector docker': 'pen', Weld: 'weld', Intersect: 'intersect', 'Front minus back': 'minusback', 'Back minus front': 'minusfront', 'Exclude overlap': 'exclude', 'Combine into one path': 'combine', 'Break apart': 'ungroup', 'Use image as section background': 'image',
  'Open Components docker': 'component', 'Create from selection': 'plus',
  'Export runnable React project': 'code', 'Preview in a new tab': 'external', 'Copy code': 'copy',
  'Colour palette': 'styles', 'Floating pages': 'pages', 'Reset workspace': 'reset',
  'Command palette': 'sparkle', 'Keyboard shortcuts': 'keyboard', 'About AtomAttr Studio': 'info',
};
const iconOf = (it: Item) => it.icon ?? MENU_ICON[it.label] ?? '';

function menus(s: S.State): Record<string, Item[]> {
  const sel = s.sel.length; const one = S.selNodes(s)[0]; const noSel = !sel;
  const openFile = async () => {
    const p = await openProjectFromDisk();
    if (p) S.openImported(p); else S.toast('That file is not an AtomAttr Studio project.', 'error');
  };
  const saveAsFile = async () => {
    if (!s.project) return;
    try {
      const ok = await saveProjectAsArchive(s.project, { lastSaved: Date.now(), lastSavedBy: 'user' }, { saveAs: true });
      if (ok) S.toast('Saved as .ast'); else S.toast('The file could not be written. Your current project remains open.', 'error');
    } catch {
      S.toast('Could not export the project file. Your current project is still available in the editor.', 'error');
    }
  };
  const add = (n: any) => S.addNode(n);
  const tools = (ids: Tool[]) => ids.map(id => { const t = ALL_TOOLS.find(x => x.id === id)!; return { label: t.name, key: t.key, icon: t.icon, checked: s.tool === id, run: () => S.setTool(id) }; });
  const recents = listRecents().slice(0, 5);
  return {
    File: [{ label: 'New project…', key: 'Ctrl+N', run: () => S.setState({ modal: 'new' }) }, { label: 'Open project…', run: openFile }, { label: 'Import project (.ast)', run: openFile }, { label: 'Import HTML, CSS, JS, React, Word…', run: openImportDialog }, ...recents.map(r => ({ label: `Open “${r.name}”`, icon: 'file', run: () => { S.saveNow(); S.openSaved(r.id); } })), { sep: true, label: '' }, { label: 'Save', key: 'Ctrl+S', run: () => S.saveNow() && S.toast('Saved') }, { label: 'Save as…', run: saveAsFile }, { label: 'Duplicate project', run: () => S.duplicateProject() }, { label: 'Save to file (.ast)', key: 'Ctrl+Shift+S', run: async () => { if (!s.project) return; const ok = await saveProjectAsArchive(s.project, { lastSaved: Date.now(), lastSavedBy: 'user' }); if (ok) S.toast('Saved to .ast file'); } }, { label: 'Create version snapshot…', run: () => { promptSnapshotName().then(name => { if (name !== null) S.createSnapshot(name); }); } }, { label: 'Download project file', run: downloadProject }, { label: 'Export site as ZIP', run: exportZip }, { label: 'Project settings…', run: () => S.setState({ modal: 'project' }) }, { label: 'Site navigation…', run: () => S.setState({ modal: 'site-nav' }) }, { label: 'Rename project…', run: () => S.setState({ modal: 'rename' }) }, { sep: true, label: '' }, { label: 'Close to welcome screen', run: () => { void closeToWelcome(); } }],
    Edit: [{ label: 'Undo', key: 'Ctrl+Z', run: S.undo, disabled: !S.canUndo(s) }, { label: 'Redo', key: 'Ctrl+Shift+Z', run: S.redo, disabled: !S.canRedo(s) }, { sep: true, label: '' }, { label: 'Cut', key: 'Ctrl+X', run: () => S.copySel(true), disabled: noSel }, { label: 'Copy', key: 'Ctrl+C', run: () => S.copySel(), disabled: noSel }, { label: 'Paste', key: 'Ctrl+V', run: S.paste, disabled: !s.clip.length }, { label: 'Copy style', run: S.copyStyle, disabled: noSel }, { label: 'Paste style', run: S.pasteStyle, disabled: noSel }, { label: 'Duplicate', key: 'Ctrl+D', run: S.duplicateSelection, disabled: noSel }, { label: 'Delete', key: 'Del', run: S.deleteSelection, disabled: noSel }, { sep: true, label: '' }, { label: 'Select all', key: 'Ctrl+A', run: S.selectAll }, { label: 'Deselect', key: 'Esc', run: S.clearSelection, disabled: noSel }],
    Object: [{ label: 'Group', key: 'Ctrl+G', run: S.groupSelection, disabled: noSel }, { label: 'Ungroup', key: 'Ctrl+Shift+G', run: S.ungroupSelection, disabled: one?.type !== 'group' }, { label: 'Enter group', run: () => one && S.enterGroup(one.id), disabled: one?.type !== 'group' }, { label: 'Exit group', run: S.exitGroup, disabled: !s.enter }, { sep: true, label: '' }, { label: 'Bring to front', key: 'Ctrl+Shift+]', run: () => S.arrange('front'), disabled: noSel }, { label: 'Bring forward', key: 'Ctrl+]', run: () => S.arrange('forward'), disabled: noSel }, { label: 'Send backward', key: 'Ctrl+[', run: () => S.arrange('backward'), disabled: noSel }, { label: 'Send to back', key: 'Ctrl+Shift+[', run: () => S.arrange('back'), disabled: noSel }, { sep: true, label: '' }, { label: 'Rotate 90° clockwise', run: () => S.rotateBy(90), disabled: noSel }, { label: 'Convert shape to path', run: S.convertToPath, disabled: one?.type !== 'shape' }, { label: 'Lock / unlock', key: 'Ctrl+L', run: () => S.toggleFlag('locked'), disabled: noSel }, { label: 'Hide / show', key: 'Ctrl+H', run: () => S.toggleFlag('hidden'), disabled: noSel }],
    View: [{ label: 'Zoom in', key: 'Ctrl++', run: () => S.zoomStep(1) }, { label: 'Zoom out', key: 'Ctrl+-', run: () => S.zoomStep(-1) }, { label: 'Fit page', key: 'Ctrl+0', run: () => S.fit('page') }, { label: 'Fit width', key: 'Ctrl+9', run: () => S.fit('width') }, { label: 'Actual size (100%)', key: 'Ctrl+1', run: () => S.fit('actual') }, { sep: true, label: '' }, { label: 'Grid', checked: s.layout.grid, run: () => S.setLayoutFlag({ grid: !s.layout.grid }) }, { label: 'Guides', checked: s.layout.guides, run: () => S.setLayoutFlag({ guides: !s.layout.guides }) }, { label: 'Safe area', checked: s.layout.safeArea, run: () => S.setLayoutFlag({ safeArea: !s.layout.safeArea }) }, { label: 'Snapping', checked: s.layout.snap, run: () => S.setLayoutFlag({ snap: !s.layout.snap }) }, { label: 'Zoom controls', icon: 'zoom', checked: s.layout.zoomDock !== false, run: () => S.setZoomDock(s.layout.zoomDock === false) }, { sep: true, label: '' }, { label: 'Preview mode', key: 'Ctrl+P', checked: s.preview, run: () => S.setPreview(!s.preview) }, { label: 'Compare artboards', checked: s.compare, run: () => S.setCompare(!s.compare) }, { label: 'Mobile device frame', checked: !!s.project?.settings?.deviceFrame, run: () => S.setSettings({ deviceFrame: !s.project?.settings?.deviceFrame }) }, { label: 'Code panel', key: 'Ctrl+E', checked: s.layout.code.open, run: () => S.toggleCode() }, { label: 'Dark theme', checked: s.theme === 'dark', run: S.toggleTheme }, ...BPS.filter(b => b === 'desktop' || s.project?.settings?.[b] !== false).map(b => ({ label: `${BP_LABEL[b]} size`, icon: b, checked: s.bp === b, run: () => S.setBp(b) }))],
    Insert: [{ label: 'Text', run: () => add(makeText(80, 80)) }, { label: 'Heading', run: () => add(makeHeading(80, 80)) }, { label: 'Button', run: () => add(makeButton(80, 80)) }, { label: 'Image…', run: () => S.setTool('image') }, { label: 'SVG artwork…', run: () => S.openDocker('assets') }, { sep: true, label: '' }, { label: 'Section', run: () => S.addNode(makeSection('Section', 480), S.root(s).id) }, ...tools(['container', 'grid', 'rect', 'ellipse', 'polygon', 'star', 'line', 'pen', 'pencil']), { sep: true, label: '' }, { label: 'New page', run: () => S.addPage() }],
    Effects: [{ label: 'Fill docker', run: () => S.openDocker('fill') }, { label: 'Effects docker', run: () => S.openDocker('effects') }, { label: 'Vector docker', run: () => S.openDocker('vector') }, { sep: true, label: '' }, ...tools(['fountain', 'transparency', 'contour', 'dropshadow', 'blend']), { sep: true, label: '' }, { label: 'Weld', run: () => S.booleanOp('weld'), disabled: sel < 2 }, { label: 'Intersect', run: () => S.booleanOp('intersect'), disabled: sel < 2 }, { label: 'Front minus back', run: () => S.booleanOp('front-back'), disabled: sel < 2 }, { label: 'Back minus front', run: () => S.booleanOp('back-front'), disabled: sel < 2 }, { label: 'Exclude overlap', run: () => S.booleanOp('exclude'), disabled: sel < 2 }, { label: 'Combine into one path', run: S.combineSel, disabled: sel < 2 }, { label: 'Break apart', run: S.breakApartSel, disabled: one?.type !== 'path' }, { sep: true, label: '' }, { label: 'Use image as section background', run: S.useImageAsBackground, disabled: one?.type !== 'image' }],
    Components: [{ label: 'Open Components docker', run: () => S.openDocker('components') }, { label: 'Create from selection', run: () => { S.openDocker('components'); }, disabled: noSel }],
    Publish: [{ label: 'Export site as ZIP', run: exportZip }, { label: 'Export runnable React project', run: exportReactZip }, { label: 'Preview in a new tab', run: () => { window.open(URL.createObjectURL(new Blob([buildPreviewHtml(S.getState().project!)], { type: 'text/html' }))); } }, { label: 'Copy code', run: () => { void navigator.clipboard.writeText(generate(s.project!, (String(s.layout.code.target).startsWith('custom:') ? 'HTML' : s.layout.code.target) as import('../exporters/codegen').Target).code); S.toast('Copied'); } }],
    Layout: [...PRESETS.map((p, i) => ({ label: p.name, icon: p.icon, key: `Alt+${i + 1}`, checked: activePreset(s.layout)?.id === p.id, run: () => S.applyPreset(p.id) })), { sep: true, label: '' }, { label: 'Tidy floating panels', icon: 'fit', run: S.tidyFloating }, { label: 'Colour palette', checked: s.layout.palette.visible, run: () => S.setPalette({ visible: !s.layout.palette.visible }) }, { label: 'Floating pages', checked: s.layout.band.open, run: () => S.setBand(!s.layout.band.open) }, { label: 'Clip pages to the bottom', icon: 'pages', checked: s.layout.band.dock === 'bottom', run: () => S.setBandDock(s.layout.band.dock === 'bottom' ? null : 'bottom') }, { label: 'Clip pages to the top', icon: 'pages', checked: s.layout.band.dock === 'top', run: () => S.setBandDock(s.layout.band.dock === 'top' ? null : 'top') }, { sep: true, label: '' }, { label: 'Reset workspace', run: () => { confirmResetWorkspace().then(ok => { if (ok) S.resetWorkspace(); }); } }],
    Window: [{ label: 'Search panels…', icon: 'panel', key: 'Alt+P', run: () => S.setState({ panelMenu: true, presetMenu: false }) }, { sep: true, label: '' }, ...DOCKERS.filter(d => d.id !== 'code').map(d => ({ label: d.title, icon: DOCKER_META[d.id].icon, checked: !!S.winOf(d.id, s.layout), run: () => S.toggleDocker(d.id) }))],
    Help: [{ label: 'Command palette', key: 'Ctrl+K', run: () => S.setState({ commandOpen: true }) }, { label: 'Keyboard shortcuts', key: '?', run: () => S.setState({ modal: 'shortcuts' }) }, { label: 'What’s new', icon: 'sparkle', run: () => S.setState({ modal: 'whats-new' }) }, { label: 'Send feedback or report a problem…', icon: 'info', run: openFeedback }, { label: 'About AtomAttr Studio', run: () => S.setState({ modal: 'about' }) }],
  };
}
import { buildGen } from '../document/gen';
import { usesBehavior } from '../document/behavior';
import { BEHAVIOR_CSS, BEHAVIOR_JS } from '../exporters/behavior-runtime';
import { markupLines, assetNamesFor, withAutoAssets, inlineAssets } from '../exporters/codegen';
import { indexGen } from '../exporters/css';
import { buildPreviewHtml } from '../exporters/preview-html';
function previewBody(p: any) { const root = buildGen(p.pages.find((x: any) => x.id === p.activePageId).root, 'desktop', 'export', [], null, null, p); const cls = new Map(); indexGen(root).forEach(({ gen, cls: c }) => cls.set(gen, c)); return previewSafe(inlineAssets(markupLines(root, 0, assetNamesFor(p), cls).join('\n'), p)); }

export function CommandPalette() {
  const s=useStudio();const [query,setQuery]=useState('');const [active,setActive]=useState(0);const input=useRef<HTMLInputElement|null>(null);
  const all=Object.entries(menus(s)).flatMap(([group,items])=>items.filter(i=>!i.sep&&i.run).map(i=>({group,item:i})));
  const matches=all.filter(x=>`${x.item.label} ${x.group}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(()=>{if(s.commandOpen){setQuery('');setActive(0);requestAnimationFrame(()=>input.current?.focus());}},[s.commandOpen]);
  if(!s.commandOpen)return null;
  const run=(item:Item)=>{if(item.disabled)return;S.setState({commandOpen:false,menu:null});item.run?.();};
  return <Box position="fixed" top="0" left="0" w="100%" h="100%" z="400" {...T.overlay} display="flex" justify="center" items="start" onPointerDown={()=>S.setState({commandOpen:false})}>
    <Box {...T.panel} mt="12vh" w="min(560px, 92vw)" max-h="72vh" overflow="hidden" rounded="lg" onPointerDown={(e:React.PointerEvent)=>e.stopPropagation()}>
      <Input ref={input} type="text" value={query} placeholder="Search commands…" aria-label="Search commands" onChange={(e:any)=>{setQuery(e.target.value);setActive(0);}} onKeyDown={(e:any)=>{if(e.key==='Escape'){S.setState({commandOpen:false});e.stopPropagation();}else if(e.key==='ArrowDown'){e.preventDefault();setActive(i=>Math.min(matches.length-1,i+1));}else if(e.key==='ArrowUp'){e.preventDefault();setActive(i=>Math.max(0,i-1));}else if(e.key==='Enter'&&matches[active])run(matches[active].item);}} w="100%" h="46px" px="4" fontSize="sm" border="0" border-b="1px solid" {...T.hairline} {...T.text} bg="transparent" />
      <Box max-h="60vh" overflow="auto" p="2">{matches.slice(0,80).map(({group,item},i)=><Row key={`${group}-${item.label}`} items="center" gap="2" h="34px" px="2" rounded="lg" cursor={item.disabled?'not-allowed':'pointer'} opacity={item.disabled?'0.45':'1'} {...(i===active?T.active:T.hover)} onPointerEnter={()=>setActive(i)} onClick={()=>run(item)}><Box w="20px" h="20px" flex="none" display="flex" items="center" justify="center" {...T.text}>{iconOf(item)&&<ToolIcon n={iconOf(item)} size={20} />}</Box><Txt fontSize="sm" m="0" flex="1" truncate {...T.text}>{item.label}</Txt><Txt fontSize="sm" m="0" {...T.muted}>{group}</Txt>{item.key&&<Kbd>{item.key}</Kbd>}</Row>)}{!matches.length&&<Txt fontSize="sm" m="0" p="3" {...T.muted}>No matching commands.</Txt>}</Box>
      <Txt fontSize="sm" m="0" px="3" py="3" {...T.muted}>↑ ↓ navigate · Enter run · Esc close</Txt>
    </Box>
  </Box>;
}

/* ---------- header ----------
   One bar, three zones, in the language of the device preview: 36px round-cornered icon buttons, grouped pills, soft popovers.
   Left: menu, brand, project and save state.  Right: device size (desktop / tablet / mobile and the device list), history, search, workspace, pages, preview, appearance, export. */

/** Header height in px: 52 bar + 1 rule. Use it wherever the workspace offsets itself from the top. */
export const HEADER_H = 53;

const FOCUS = { 'focus-visible-outline': '2px solid primary', 'focus-visible-outline-offset': '1px' };
export const Scrim = ({ onClose }: { onClose: () => void }) => <Box position="fixed" top="0" left="0" w="100vw" h="100vh" z="89" onPointerDown={onClose} />;
const Pop = (p: any) => <Box position="absolute" top="44px" z="90" {...T.panel} rounded="6px" p="6px" {...p} />;
const Group = ({ children }: { children: React.ReactNode }) => <Txt as="div" fontSize="sm" fontWeight="700" tracking="0.09em" uppercase m="0" pt="10px" px="10px" pb="4px" {...T.muted}>{children}</Txt>;
const VSep = () => <Box w="1px" h="20px" mx="1" shrink="0" {...T.divider} />;
/** A soft grouped pill that holds a few related controls. */
const Pill = (p: any) => <Row items="center" gap="1" p="3px" rounded="6px" shrink="0" bg="gray-900/5" dark-bg="white/6" {...p} />;

/** Icon button: 36px, 11px corners. `act` lights it with the theme colour. */
export function Bt({ t, on, act, dis, w = 36, raised, children, ...rest }: { t: string; on?: () => void; act?: boolean; dis?: boolean; w?: number; raised?: boolean; children: React.ReactNode; [k: string]: unknown }) {
  const look = act ? (raised ? { bg: 'white', 'dark-bg': 'gray-700', shadow: 'sm', text: 'primary', 'dark-text': 'white' } : T.active) : { bg: 'transparent', ...T.hover, ...T.text };
  return (
    <Btn type="button" title={t} aria-label={t} aria-pressed={act} disabled={dis} onClick={dis ? undefined : on} w={`${w}px`} h="36px" p="0" display="flex" items="center" justify="center" rounded="lg" border="0" shrink="0"
      cursor={dis ? 'not-allowed' : 'pointer'} opacity={dis ? '0.35' : undefined} transition="all" duration="120" {...look} {...FOCUS} {...rest}>{children}</Btn>
  );
}

export const Row2 = ({ label, hint, active, disabled, onClick, icon }: { label: string; hint?: string; active?: boolean; disabled?: boolean; onClick: () => void; icon?: React.ReactNode }) => (
  <Row items="center" gap="2" h="32px" px="2" rounded="lg" cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? '0.4' : '1'} {...(disabled ? {} : active ? T.active : T.hover)} onClick={() => { if (!disabled) onClick(); }}>
    <Box w="20px" h="20px" flex="none" display="flex" items="center" justify="center">{icon}</Box>
    <Txt fontSize="sm" m="0" flex="1" truncate>{label}</Txt>
    {hint && <Txt fontSize="sm" m="0" {...(active ? {} : T.muted)}>{hint}</Txt>}
  </Row>
);

/* ---------- menu: one button, categories on the left, their items on the right ---------- */
const CAT_ICON: Record<string, string> = { File: 'folder', Edit: 'pencil', Object: 'group', View: 'eye', Insert: 'plus', Effects: 'transparency', Components: 'component', Publish: 'export', Layout: 'window', Window: 'panel', Help: 'info' };

function MainMenu() {
  const s = useStudio(); const m = menus(s); const open = !!s.menu; const names = Object.keys(m);
  const [cat, setCat] = useState('File');
  useEffect(() => { if (s.menu && m[s.menu]) setCat(s.menu); }, [s.menu]);
  const close = () => S.setState({ menu: null });
  const items = m[cat] ?? m.File;
  return (
    <Box position="relative">
      <Bt t="Menu" act={open} on={() => S.setState({ menu: open ? null : cat })}>{BI.menu}</Bt>
      {open && <>
        <Scrim onClose={close} />
        <Pop left="0" w="min(580px, 94vw)" display="flex" gap="1" role="menu" aria-label="Main menu">
          <Box w="164px" shrink="0" display="flex" flex-col gap="1" pr="1" border-r="1px solid" {...T.hairline}>
            {names.map(n => (
              <Row key={n} items="center" gap="2" h="34px" px="2" rounded="lg" cursor="pointer" {...(n === cat ? T.active : { ...T.hover, ...T.text })} onPointerEnter={() => setCat(n)} onClick={() => setCat(n)}>
                <ToolIcon n={CAT_ICON[n] ?? 'panel'} size={18} /><Txt fontSize="sm" fontWeight="600" m="0" flex="1">{n}</Txt>{BI.chevronR}
              </Row>))}
          </Box>
          <Box flex="1" min-w="0" max-h="min(70vh, 560px)" overflow-y="auto" pl="1">
            {items.map((it, i) => it.sep ? <Box key={i} h="1px" my="1" {...T.divider} /> :
              <Row key={i} items="center" gap="2" h="32px" px="2" rounded="lg" role="menuitem" aria-checked={it.checked} cursor={it.disabled ? 'not-allowed' : 'pointer'} opacity={it.disabled ? '0.4' : '1'} {...(it.disabled ? {} : it.checked ? T.active : T.hover)}
                onClick={() => { if (it.disabled) return; close(); it.run?.(); }}>
                <Box w="20px" h="20px" flex="none" display="flex" items="center" justify="center">{iconOf(it) && <ToolIcon n={iconOf(it)} size={18} />}</Box>
                <Txt fontSize="sm" m="0" flex="1" truncate>{it.label}</Txt>{it.key && <Kbd>{it.key}</Kbd>}
              </Row>)}
          </Box>
        </Pop>
      </>}
    </Box>
  );
}

/* ---------- right: device size ---------- */
type DeviceKind = 'desktop' | 'laptop' | 'tablet' | 'phone';
type DeviceProfile = { width: number; height: number; bp: 'desktop' | 'tablet' | 'mobile'; kind: DeviceKind };
const PROFILES: Record<string, DeviceProfile> = {
  Desktop: { width: 1440, height: 900, bp: 'desktop', kind: 'desktop' },
  Laptop: { width: 1280, height: 800, bp: 'desktop', kind: 'laptop' },
  'MacBook Air': { width: 1440, height: 900, bp: 'desktop', kind: 'laptop' },
  'MacBook Pro': { width: 1512, height: 982, bp: 'desktop', kind: 'laptop' },
  'Tablet landscape': { width: 1024, height: 768, bp: 'desktop', kind: 'tablet' },
  'Tablet portrait': { width: 768, height: 1024, bp: 'tablet', kind: 'tablet' },
  'Mobile landscape': { width: 844, height: 390, bp: 'tablet', kind: 'phone' },
  'Mobile portrait': { width: 390, height: 844, bp: 'mobile', kind: 'phone' },
  'iPhone 15 Pro': { width: 393, height: 852, bp: 'mobile', kind: 'phone' },
  'Samsung Galaxy S24': { width: 412, height: 874, bp: 'mobile', kind: 'phone' },
};
const PROFILE_ICON = (n: string) => (PROFILES[n] ? PROFILES[n].bp : 'plus');
const BP_ICON = (b: string): BarIcon => (b === 'tablet' ? 'tablet' : b === 'mobile' ? 'mobile' : 'desktop');

function ViewControls() {
  const s = useStudio(); const p = s.project!; const [pop, setPop] = useState<'device' | null>(null);
  const toggle = (k: 'device') => setPop(pop === k ? null : k);
  const profile = (name: string) => {
    if (name === 'Custom') { promptCustomViewport(s.viewport.width, s.viewport.height).then(size => { if (size) S.setViewport({ name: 'Custom', ...size }); }); return; }
    const { width, height, bp } = PROFILES[name]; S.setViewport({ name, width, height }, bp);
  };
  const close = () => setPop(null);
  return (
    <Row items="center" gap="2" shrink="0">
      <Pill>
        {BPS.filter(b => b === 'desktop' || p.settings?.[b] !== false).map(b => <Bt key={b} t={`${BP_LABEL[b]} view`} act={s.bp === b} raised on={() => S.setBp(b)} w={34}>{BI[BP_ICON(b)]}</Bt>)}
        <Box position="relative">
          <Bt t={`Device viewport: ${s.viewport.name} (${s.viewport.width}×${s.viewport.height})`} act={pop === 'device'} w={22} on={() => toggle('device')}>{BI.chevron}</Bt>
          {pop === 'device' && <><Scrim onClose={close} /><Pop left="-80px" w="270px" max-h="70vh" overflow-y="auto" top="42px">
            <Group>Device size</Group>
            {[...Object.keys(PROFILES), 'Custom'].map(n => <Row2 key={n} label={n} hint={PROFILES[n] ? `${PROFILES[n].width}×${PROFILES[n].height}` : ''} active={s.viewport.name === n} onClick={() => { close(); profile(n); }} icon={<ToolIcon n={PROFILE_ICON(n)} size={18} />} />)}
          </Pop></>}
        </Box>
      </Pill>
    </Row>
  );
}

/* ---------- appearance: light / dark and the theme colour ---------- */
export function AppearanceBody() {
  const s = useStudio(); const dark = s.theme === 'dark';
  const [draft, setDraft] = useState(s.accent);
  useEffect(() => { setDraft(s.accent); }, [s.accent]);
  const pick = (hex: string) => { S.setAccent(hex); };
  const type = (v: string) => { const x = v.startsWith('#') ? v : `#${v}`; setDraft(v); if (isHex(x)) pick(x); };
  const known = ACCENT_CHOICES.some(c => c.hex === s.accent);
  const swatch = (hex: string, name: string) => {
    const on = s.accent === hex;
    return (
      <Btn key={hex} type="button" title={name} aria-label={`${name} theme colour`} aria-pressed={on} onClick={() => pick(hex)} w="30px" h="30px" p="0" rounded="full" cursor="pointer" display="flex" items="center" justify="center" shrink="0" text="white" bg={hex}
        border="2px solid" {...(on ? { 'border-color': 'gray-900', 'dark-border-color': 'white' } : { 'border-color': 'transparent' })} hover-opacity="0.85" transition="all" duration="120" {...FOCUS}>{on && BI.check}</Btn>
    );
  };
  return (
    <>
<Group>Mode</Group>
          <Pill mx="1" mb="1">
            {([['light', 'Light', BI.sun], ['dark', 'Dark', BI.moon]] as const).map(([k, l, ic]) => (
              <Btn key={k} type="button" aria-pressed={dark === (k === 'dark')} onClick={() => S.setTheme(k)} flex="1" h="34px" rounded="lg" border="0" cursor="pointer" display="flex" items="center" justify="center" gap="2" fontSize="sm" fontWeight="600" {...FOCUS}
                {...((dark === (k === 'dark')) ? { bg: 'white', 'dark-bg': 'gray-700', shadow: 'sm', text: 'gray-900', 'dark-text': 'white' } : { bg: 'transparent', ...T.muted })}>{ic}{l}</Btn>))}
          </Pill>
          <Group>Theme colour</Group>
          <Box px="1" display="flex" flex-col gap="2" pt="1">
            <Row gap="2" items="center" justify="between">{ACCENT_CHOICES.slice(0, 6).map(c => swatch(c.hex, c.name))}</Row>
            <Row gap="2" items="center" justify="between">{ACCENT_CHOICES.slice(6).map(c => swatch(c.hex, c.name))}</Row>
          </Box>
          <Row items="center" gap="2" mt="3" px="1">
            <Box position="relative" w="30px" h="30px" shrink="0" rounded="full" overflow="hidden" border="2px solid" {...(known ? { 'border-color': 'transparent' } : { 'border-color': 'gray-900', 'dark-border-color': 'white' })} title="Pick any colour">
              <Input type="color" aria-label="Custom theme colour" value={s.accent} onChange={(e: any) => pick(e.target.value)} position="absolute" top="-6px" left="-6px" w="44px" h="44px" p="0" border="0" cursor="pointer" bg="transparent" />
            </Box>
            <Input type="text" aria-label="Theme colour hex" value={draft} spellCheck={false} maxLength={7} onChange={(e: any) => type(e.target.value)} onBlur={() => setDraft(s.accent)} h="32px" px="3" flex="1" min-w="0" fontSize="sm" {...T.field} />
            <Btn type="button" title="Back to the default colour" aria-label="Reset theme colour" disabled={s.accent === ACCENT_DEFAULT} onClick={() => pick(ACCENT_DEFAULT)} w="32px" h="32px" p="0" rounded="lg" border="0" cursor="pointer" display="flex" items="center" justify="center" opacity={s.accent === ACCENT_DEFAULT ? '0.35' : '1'} bg="transparent" {...T.hover} {...T.text} {...FOCUS}>{BI.reset}</Btn>
          </Row>
          <Row items="center" gap="2" mt="3" mb="3" px="1">
            <Box h="28px" px="3" rounded="lg" bg="primary" text="white" fontSize="sm" fontWeight="600" display="flex" items="center">Button</Box>
            <Box h="28px" px="3" rounded="lg" bg="primary/15" dark-bg="primary/25" text="primary" fontSize="sm" fontWeight="600" display="flex" items="center">Selected</Box>
          </Row>

          <Txt display="block" fontSize="sm" m="0" px="1" pb="1" {...T.muted} leading="snug">The editor only. Your designs keep their own colours.</Txt>
    </>
  );
}

function Appearance() {
  const [open, setOpen] = useState(false);
  return (
    <Box position="relative">
      <Bt t="Appearance and theme colour" act={open} on={() => setOpen(!open)}>{BI.palette}</Bt>
      {open && <>
        <Scrim onClose={() => setOpen(false)} />
        <Pop right="0" w="288px" p="10px" role="dialog" aria-label="Appearance"><AppearanceBody /></Pop>
      </>}
    </Box>
  );
}

/* ---------- export ---------- */
function ExportMenu() {
  const s = useStudio(); const [open, setOpen] = useState(false); const items = menus(s).Publish;
  return (
    <Box position="relative">
      <Btn type="button" title="Export" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} h="36px" pl="12px" pr="14px" rounded="lg" border="0" bg="primary" text="white" hover-opacity="0.92" cursor="pointer" display="flex" items="center" gap="2" fontSize="sm" fontWeight="600" shrink="0" transition="all" duration="120" {...FOCUS}>
        {BI.export}<Txt as="span" m="0" display="none" md-display="inline">Export</Txt>
      </Btn>
      {open && <>
        <Scrim onClose={() => setOpen(false)} />
        <Pop right="0" w="250px" role="menu" aria-label="Export">
          <Group>Publish</Group>
          {items.map((it, i) => <Row2 key={i} label={it.label} icon={<ToolIcon n={iconOf(it) || 'export'} size={18} />} onClick={() => { setOpen(false); it.run?.(); }} />)}
        </Pop>
      </>}
    </Box>
  );
}

export function BarBtn({ icon, title, active, onClick, w = 28 }: { icon: string; title: string; active?: boolean; onClick: () => void; w?: number }) {
  return (
    <Btn type="button" title={title} aria-label={title} aria-pressed={active} onClick={onClick}
      w={`${w}px`} h="28px" p="0" display="flex" items="center" justify="center" rounded="lg" border="0" cursor="pointer" shrink="0"
      {...(active ? { bg: 'primary', text: 'white' } : { bg: 'transparent', ...T.hover, ...T.text })}>
      <ToolIcon n={icon} size={18} />
    </Btn>
  );
}

/* Width tiers. The bar measures itself: wide shows everything, then search goes, then history and pages move into the overflow button, then preview and appearance follow. */
const W_SEARCH = 1240; const W_TIER1 = 1000; const W_TIER2 = 760;

function Overflow({ search, history, preview, appearance }: { search: boolean; history: boolean; preview: boolean; appearance: boolean }) {
  const s = useStudio(); const [open, setOpen] = useState(false);
  const go = (f: () => void) => () => { setOpen(false); f(); };
  return (
    <Box position="relative">
      <Bt t="More" act={open} on={() => setOpen(!open)}>{BI.more}</Bt>
      {open && <>
        <Scrim onClose={() => setOpen(false)} />
        <Pop right="0" w="288px" max-h="80vh" overflow-y="auto" role="menu" aria-label="More">
          {search && <Row2 label="Search commands" icon={BI.search} onClick={go(() => S.setState({ commandOpen: true }))} />}
          {history && <>
            <Row2 label="Undo" icon={BI.undo} disabled={!S.canUndo(s)} onClick={go(S.undo)} />
            <Row2 label="Redo" icon={BI.redo} disabled={!S.canRedo(s)} onClick={go(S.redo)} />
            <Row2 label="Pages" icon={BI.pages} active={s.layout.band.open} onClick={go(() => S.setBand(!s.layout.band.open))} />
          </>}
          {preview && <Row2 label="Preview" icon={BI.play} active={s.preview} onClick={go(() => S.setPreview(!s.preview))} />}
          {appearance && <><Box h="1px" my="1" {...T.divider} /><Box p="4px"><AppearanceBody /></Box></>}
        </Pop>
      </>}
    </Box>
  );
}

/** Saved state as a pill: the time, tinted by status (green saved, amber saving or unsaved, red failed). */
function SavePill() {
  const s = useStudio();
  const time = s.savedAt ? new Date(s.savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Saved';
  const tone = s.saveStatus === 'error' ? { bg: 'red-500/15', text: 'red-700', 'dark-text': 'red-300' } : s.saveStatus === 'saved' ? { bg: 'green-500/15', text: 'green-700', 'dark-text': 'green-300' } : { bg: 'amber-500/20', text: 'amber-700', 'dark-text': 'amber-300' };
  const title = s.saveStatus === 'saving' ? 'Saving…' : s.saveStatus === 'error' ? 'Save failed' : s.saveStatus === 'unsaved' ? 'Unsaved changes' : `Saved at ${time}`;
  return <Txt as="span" title={title} role="status" fontSize="sm" fontWeight="600" m="0" px="10px" h="24px" rounded="lg" display="flex" items="center" whitespace="nowrap" shrink="0" {...tone}>{time}</Txt>;
}

export function Header() {
  const s = useStudio(); const p = s.project!;
  const ref = useRef<HTMLDivElement | null>(null); const [w, setW] = useState(typeof window === 'undefined' ? 1400 : window.innerWidth);
  useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); setW(el.clientWidth); return () => ro.disconnect(); }, []);
  const showSearch = w >= W_SEARCH; const tier1 = w < W_TIER1; const tier2 = w < W_TIER2;
  return (
    <Box ref={ref} display="flex" flex-col shrink="0" w="100%" {...T.chrome} border-b="1px solid" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      <Row items="center" h="52px" px="3" gap="3" min-w="0">

        {/* left: menu, brand, project and save pill. This zone shrinks first (the name truncates), so it can never run into the centre. */}
        <Row items="center" gap="1" shrink="1" min-w="0">
          <MainMenu />
          {!tier2 && <img src="/logo-studio.png" alt="AtomAttr Studio" width={28} height={28} style={{ display: 'block', flexShrink: 0, borderRadius: 8, objectFit: 'contain', margin: '0 4px' }} />}
          {!tier2 && <Txt fontSize="xs" fontWeight="700" m="0" px="2" py="0.5" rounded="full" bg="primary/12" text="primary" dark-text="white" title={`Beta ${BETA.version}. Click to send feedback.`} onClick={openFeedback} cursor="pointer">BETA</Txt>}
          <Btn type="button" onClick={() => S.setState({ modal: 'rename' })} title="Rename project" display="flex" items="center" gap="2" h="36px" px="2" rounded="lg" border="0" bg="transparent" cursor="pointer" min-w="0" max-w="260px" {...T.hover} {...T.text} {...FOCUS}>
            <Txt as="span" fontSize="sm" fontWeight="600" m="0" truncate min-w="0">{p.name}</Txt>
            <SavePill />
          </Btn>
        </Row>

        <Box flex="1" min-w="0" />

        {/* right: device size first, then the rest; it collapses as the window narrows */}
        <Row items="center" gap="2" shrink="0">
          <ViewControls />
          <VSep />
          {!tier1 && <Pill gap="2" px="4px">
            <Bt t="Undo (Ctrl+Z)" on={S.undo} dis={!S.canUndo(s)} w={32}>{BI.undo}</Bt>
            <Bt t="Redo (Ctrl+Shift+Z)" on={S.redo} dis={!S.canRedo(s)} w={32}>{BI.redo}</Bt>
          </Pill>}
          {showSearch && <Btn type="button" title="Search commands (Ctrl+K)" aria-label="Search commands" onClick={() => S.setState({ commandOpen: true })} h="36px" pl="12px" pr="8px" rounded="lg" cursor="pointer" display="flex" items="center" gap="2" shrink="0" border="1px solid" border-color="transparent" dark-border-color="transparent" bg="gray-900/5" dark-bg="white/6" hover-bg="gray-900/8" dark-hover-bg="white/9" fontSize="sm" {...T.text} {...FOCUS}>
            {BI.search}<Txt as="span" m="0" fontSize="sm" whitespace="nowrap" {...T.muted}>Search</Txt><Box ml="2"><Kbd>Ctrl K</Kbd></Box>
          </Btn>}
          {!tier1 && <VSep />}
          <PanelsMenu />
          {!tier1 && <Bt t="Pages" act={s.layout.band.open} on={() => S.setBand(!s.layout.band.open)}>{BI.pages}</Bt>}
          {!tier2 && <Bt t="Preview (Ctrl+P)" act={s.preview} on={() => S.setPreview(!s.preview)}>{BI.play}</Bt>}
          {!tier2 && <Appearance />}
          {tier1 && <Overflow search={!showSearch} history={tier1} preview={tier2} appearance={tier2} />}
          <ExportMenu />
        </Row>
      </Row>
    </Box>
  );
}
