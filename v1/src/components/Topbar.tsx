import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio, type Tool } from '../state/store';
import { DOCKERS, winBox, type DockerId, type Win } from '../state/layout';
import { BPS, BP_LABEL } from '../document/style';
import { keys } from '../canvas/keys';
import { PANELS, exportZip, exportReactZip, downloadProject } from '../panels/Panels';
import { Welcome, NewProjectModal } from './Welcome';
import { Ic } from './Icons';
import { IconBtn, Kbd } from './ui';
import { T, SWATCHES, ACCENT } from '../theme';
import { generate, TARGETS, TARGET_LABEL, TARGET_EXT } from '../exporters/codegen';
import { download } from '../exporters/zip';
import { thumbSvg } from '../document/thumb';
import { pickFile } from '../state/assets';
import { parseProjectFile, listRecents } from '../state/storage';
import { makeSection, makeText, makeHeading, makeButton } from '../document/factory';
import { GROUPS, ALL_TOOLS, KEYMAP, useDrag } from './tools';
/* ---------- menus ---------- */
type Item = { label: string; run?: () => void; key?: string; disabled?: boolean; checked?: boolean; sep?: boolean };
function menus(s: S.State): Record<string, Item[]> {
  const sel = s.sel.length; const one = S.selNodes(s)[0]; const noSel = !sel;
  const openFile = async () => { const f = await pickFile('.json,application/json'); if (!f) return; const p = parseProjectFile(await f.text()); p ? S.openProject(p) : S.toast('That file is not an AtomAttr Studio project.', 'error'); };
  const add = (n: any) => S.addNode(n);
  const tools = (ids: Tool[]) => ids.map(id => { const t = ALL_TOOLS.find(x => x.id === id)!; return { label: t.name, key: t.key, checked: s.tool === id, run: () => S.setTool(id) }; });
  const recents = listRecents().slice(0, 5);
  return {
    File: [{ label: 'New project…', key: 'Ctrl+N', run: () => S.setState({ modal: 'new' }) }, { label: 'Open project file…', run: openFile }, ...recents.map(r => ({ label: `Open “${r.name}”`, run: () => { S.saveNow(); S.openSaved(r.id); } })), { sep: true, label: '' }, { label: 'Save', key: 'Ctrl+S', run: () => S.saveNow() && S.toast('Saved') }, { label: 'Create version snapshot…', run: () => { const name=prompt('Name this snapshot');if(name!==null)S.createSnapshot(name); } }, { label: 'Download project file', run: downloadProject }, { label: 'Export site as ZIP', run: exportZip }, { label: 'Rename project…', run: () => S.setState({ modal: 'rename' }) }, { sep: true, label: '' }, { label: 'Close to welcome screen', run: S.goWelcome }],
    Edit: [{ label: 'Undo', key: 'Ctrl+Z', run: S.undo, disabled: !S.canUndo(s) }, { label: 'Redo', key: 'Ctrl+Shift+Z', run: S.redo, disabled: !S.canRedo(s) }, { sep: true, label: '' }, { label: 'Cut', key: 'Ctrl+X', run: () => S.copySel(true), disabled: noSel }, { label: 'Copy', key: 'Ctrl+C', run: () => S.copySel(), disabled: noSel }, { label: 'Paste', key: 'Ctrl+V', run: S.paste, disabled: !s.clip.length }, { label: 'Copy style', run: S.copyStyle, disabled: noSel }, { label: 'Paste style', run: S.pasteStyle, disabled: noSel }, { label: 'Duplicate', key: 'Ctrl+D', run: S.duplicateSelection, disabled: noSel }, { label: 'Delete', key: 'Del', run: S.deleteSelection, disabled: noSel }, { sep: true, label: '' }, { label: 'Select all', key: 'Ctrl+A', run: S.selectAll }, { label: 'Deselect', key: 'Esc', run: S.clearSelection, disabled: noSel }],
    Object: [{ label: 'Group', key: 'Ctrl+G', run: S.groupSelection, disabled: noSel }, { label: 'Ungroup', key: 'Ctrl+Shift+G', run: S.ungroupSelection, disabled: one?.type !== 'group' }, { label: 'Enter group', run: () => one && S.enterGroup(one.id), disabled: one?.type !== 'group' }, { label: 'Exit group', run: S.exitGroup, disabled: !s.enter }, { sep: true, label: '' }, { label: 'Bring to front', key: 'Ctrl+Shift+]', run: () => S.arrange('front'), disabled: noSel }, { label: 'Bring forward', key: 'Ctrl+]', run: () => S.arrange('forward'), disabled: noSel }, { label: 'Send backward', key: 'Ctrl+[', run: () => S.arrange('backward'), disabled: noSel }, { label: 'Send to back', key: 'Ctrl+Shift+[', run: () => S.arrange('back'), disabled: noSel }, { sep: true, label: '' }, { label: 'Rotate 90° clockwise', run: () => S.rotateBy(90), disabled: noSel }, { label: 'Convert shape to path', run: S.convertToPath, disabled: one?.type !== 'shape' }, { label: 'Lock / unlock', key: 'Ctrl+L', run: () => S.toggleFlag('locked'), disabled: noSel }, { label: 'Hide / show', key: 'Ctrl+H', run: () => S.toggleFlag('hidden'), disabled: noSel }],
    View: [{ label: 'Zoom in', key: 'Ctrl++', run: () => S.zoomStep(1) }, { label: 'Zoom out', key: 'Ctrl+-', run: () => S.zoomStep(-1) }, { label: 'Fit page', key: 'Ctrl+0', run: () => S.fit('page') }, { label: 'Fit width', key: 'Ctrl+9', run: () => S.fit('width') }, { label: 'Actual size (100%)', key: 'Ctrl+1', run: () => S.fit('actual') }, { sep: true, label: '' }, { label: 'Rulers', checked: s.layout.rulers, run: () => S.setLayoutFlag({ rulers: !s.layout.rulers }) }, { label: 'Grid', checked: s.layout.grid, run: () => S.setLayoutFlag({ grid: !s.layout.grid }) }, { label: 'Guides', checked: s.layout.guides, run: () => S.setLayoutFlag({ guides: !s.layout.guides }) }, { label: 'Safe area', checked: s.layout.safeArea, run: () => S.setLayoutFlag({ safeArea: !s.layout.safeArea }) }, { label: 'Snapping', checked: s.layout.snap, run: () => S.setLayoutFlag({ snap: !s.layout.snap }) }, { sep: true, label: '' }, { label: 'Preview mode', key: 'Ctrl+P', checked: s.preview, run: () => S.setPreview(!s.preview) }, { label: 'Compare artboards', checked: s.compare, run: () => S.setCompare(!s.compare) }, { label: 'Mobile device frame', checked: !!s.project?.settings?.deviceFrame, run: () => S.setSettings({ deviceFrame: !s.project?.settings?.deviceFrame }) }, { label: 'Code panel', key: 'Ctrl+E', checked: s.layout.code.open, run: () => S.toggleCode() }, { label: 'Dark theme', checked: s.theme === 'dark', run: S.toggleTheme }, ...BPS.filter(b => b === 'desktop' || s.project?.settings?.[b] !== false).map(b => ({ label: `${BP_LABEL[b]} size`, checked: s.bp === b, run: () => S.setBp(b) }))],
    Insert: [{ label: 'Text', run: () => add(makeText(80, 80)) }, { label: 'Heading', run: () => add(makeHeading(80, 80)) }, { label: 'Button', run: () => add(makeButton(80, 80)) }, { label: 'Image…', run: () => S.setTool('image') }, { label: 'SVG artwork…', run: () => S.openDocker('assets') }, { sep: true, label: '' }, { label: 'Section', run: () => S.addNode(makeSection('Section', 480), S.root(s).id) }, ...tools(['container', 'grid', 'rect', 'ellipse', 'polygon', 'star', 'line', 'pen', 'pencil']), { sep: true, label: '' }, { label: 'New page', run: () => S.addPage() }],
    Components: [{ label: 'Open Components docker', run: () => S.openDocker('components') }, { label: 'Create from selection', run: () => { S.openDocker('components'); }, disabled: noSel }],
    Publish: [{ label: 'Export site as ZIP', run: exportZip }, { label: 'Export runnable React project', run: exportReactZip }, { label: 'Preview in a new tab', run: () => { const p = S.getState().project!; const html = generate(p, 'HTML').code; const css = generate(p, 'CSS').code; void html; const code = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>${css}</style>${previewBody(p)}`; window.open(URL.createObjectURL(new Blob([code], { type: 'text/html' }))); } }, { label: 'Copy code (current target)', run: () => { void navigator.clipboard.writeText(generate(s.project!, s.layout.code.target).code); S.toast('Copied'); } }],
    Window: [...DOCKERS.map(d => ({ label: d.title, checked: !!S.winOf(d.id, s.layout), run: () => S.toggleDocker(d.id) })), { sep: true, label: '' }, { label: 'Colour palette', checked: s.layout.palette.visible, run: () => S.setPalette({ visible: !s.layout.palette.visible }) }, { label: 'Page band', checked: s.layout.band.open, run: () => S.setBand(!s.layout.band.open) }, { sep: true, label: '' }, { label: 'Reset workspace', run: S.resetWorkspace }],
    Help: [{ label: 'Command palette', key: 'Ctrl+K', run: () => S.setState({ commandOpen: true }) }, { label: 'Keyboard shortcuts', key: '?', run: () => S.setState({ modal: 'shortcuts' }) }, { label: 'About AtomAttr Studio', run: () => S.setState({ modal: 'about' }) }],
  };
}
import { buildGen } from '../document/gen';
import { markupLines, assetNamesFor } from '../exporters/codegen';
import { indexGen } from '../exporters/css';
function previewBody(p: any) { const root = buildGen(p.pages.find((x: any) => x.id === p.activePageId).root, 'desktop', 'export', [], null, null, p); const cls = new Map(); indexGen(root).forEach(({ gen, cls: c }) => cls.set(gen, c)); return markupLines(root, 0, assetNamesFor(p), cls).join('\n').replace(/src="assets\/[^"]+"/g, m => { const a = p.assets.find((x: any) => m.includes((x.name || '').toLowerCase().replace(/\.[a-z0-9]+$/, ''))); return a ? `src="${a.dataUrl}"` : m; }); }

export function MenuBar() {
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

export function CommandPalette() {
  const s=useStudio();const [query,setQuery]=useState('');const [active,setActive]=useState(0);const input=useRef<HTMLInputElement|null>(null);
  const all=Object.entries(menus(s)).flatMap(([group,items])=>items.filter(i=>!i.sep&&i.run).map(i=>({group,item:i})));
  const matches=all.filter(x=>`${x.item.label} ${x.group}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(()=>{if(s.commandOpen){setQuery('');setActive(0);requestAnimationFrame(()=>input.current?.focus());}},[s.commandOpen]);
  if(!s.commandOpen)return null;
  const run=(item:Item)=>{if(item.disabled)return;S.setState({commandOpen:false,menu:null});item.run?.();};
  return <Box position="fixed" top="0" left="0" w="100%" h="100%" z="110" bg="black/40" display="flex" justify="center" items="start" onPointerDown={()=>S.setState({commandOpen:false})}>
    <Box {...T.panel} mt="12vh" w="min(560px, 92vw)" max-h="72vh" overflow="hidden" rounded="xl" shadow="xl" onPointerDown={(e:React.PointerEvent)=>e.stopPropagation()}>
      <Input ref={input} type="text" value={query} placeholder="Search commands…" aria-label="Search commands" onChange={(e:any)=>{setQuery(e.target.value);setActive(0);}} onKeyDown={(e:any)=>{if(e.key==='Escape'){S.setState({commandOpen:false});e.stopPropagation();}else if(e.key==='ArrowDown'){e.preventDefault();setActive(i=>Math.min(matches.length-1,i+1));}else if(e.key==='ArrowUp'){e.preventDefault();setActive(i=>Math.max(0,i-1));}else if(e.key==='Enter'&&matches[active])run(matches[active].item);}} w="100%" h="46px" px="4" fontSize="14px" border="0" border-b="1px solid" border-color="gray-200" dark-border-color="gray-700" {...T.text} bg="transparent" />
      <Box max-h="60vh" overflow="auto" p="2">{matches.slice(0,80).map(({group,item},i)=><Row key={`${group}-${item.label}`} items="center" gap="2" h="34px" px="2" rounded="md" cursor={item.disabled?'not-allowed':'pointer'} opacity={item.disabled?'0.45':'1'} {...(i===active?T.active:T.hover)} onPointerEnter={()=>setActive(i)} onClick={()=>run(item)}><Txt fontSize="12px" m="0" flex="1">{item.label}</Txt><Txt fontSize="10px" m="0" {...T.muted}>{group}</Txt>{item.key&&<Kbd>{item.key}</Kbd>}</Row>)}{!matches.length&&<Txt fontSize="12px" m="0" p="3" {...T.muted}>No matching commands.</Txt>}</Box>
      <Txt fontSize="10px" m="0" px="3" py="2" {...T.muted}>↑ ↓ navigate · Enter run · Esc close</Txt>
    </Box>
  </Box>;
}

/* ---------- header ---------- */
const ZOOMS = [10, 25, 50, 75, 100, 150, 200, 400, 800];
export function Header() {
  const s = useStudio(); const [zoomOpen, setZoomOpen] = useState(false); const [launch, setLaunch] = useState(false); const p = s.project!;
  const profile=(name:string)=>{const profiles:Record<string,[number,number,'desktop'|'tablet'|'mobile']>={Desktop:[1440,900,'desktop'],Laptop:[1280,800,'desktop'],'Tablet landscape':[1024,768,'desktop'],'Tablet portrait':[768,1024,'tablet'],'Mobile landscape':[844,390,'tablet'],'Mobile portrait':[390,844,'mobile']};if(name==='Custom'){const width=Number(prompt('Custom viewport width in CSS pixels',String(s.viewport.width)));if(!Number.isFinite(width)||width<240)return;const height=Number(prompt('Custom viewport height in CSS pixels',String(s.viewport.height)));if(!Number.isFinite(height)||height<240)return;S.setViewport({name:'Custom',width:Math.round(width),height:Math.round(height)});return;}const [width,height,bp]=profiles[name];S.setViewport({name,width,height},bp);};
  return (
    <Row items="center" h="44px" px="3" gap="2" bg="#fff" dark-bg="grey-950" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      <IconBtn icon="home" title="Welcome screen" onClick={S.goWelcome} />
      <Btn type="button" onClick={() => S.setState({ modal: 'rename' })} title="Rename project" bg="transparent" border="0" cursor="pointer" fontSize="13px" fontWeight="700" {...T.text} max-w="200px" truncate>{p.name}</Btn>
      <Txt fontSize="11px" m="0" {...T.muted} whitespace="nowrap">{s.dirty ? 'Saving…' : 'Saved'}</Txt>
      <Box flex="1" />
      {/* <IconBtn icon="undo" title="Undo (Ctrl+Z)" onClick={S.undo} disabled={!S.canUndo(s)} /><IconBtn icon="redo" title="Redo (Ctrl+Shift+Z)" onClick={S.redo} disabled={!S.canRedo(s)} />
      <Row {...T.card} p="1" gap="1">{BPS.filter(b => b === 'desktop' || p.settings?.[b] !== false).map(b => <IconBtn key={b} icon={b} title={`${BP_LABEL[b]} preview`} active={s.bp === b} size={26} onClick={() => S.setBp(b)} />)}</Row> */}
      <Box as="select" aria-label="Device viewport" title="Responsive device viewport" value={s.viewport.name} onChange={(e:any)=>profile(e.target.value)} h="28px" max-w="140px" px="1" fontSize="11px" {...T.field}>{['Desktop','Laptop','Tablet landscape','Tablet portrait','Mobile landscape','Mobile portrait','Custom'].map(name=><Box key={name} as="option" value={name}>{name}</Box>)}</Box>
      <Row items="center" gap="0" position="relative"><IconBtn icon="minus" title="Zoom out" onClick={() => S.zoomStep(-1)} />
        <Btn type="button" title="Zoom level" onClick={() => setZoomOpen(!zoomOpen)} w="58px" h="28px" border="0" rounded="md" bg="transparent" {...T.hover} {...T.text} fontSize="12px" fontWeight="600" cursor="pointer">{Math.round(s.view.zoom * 100)}%</Btn>
        <IconBtn icon="plus" title="Zoom in" onClick={() => S.zoomStep(1)} />
        {zoomOpen && <Box position="absolute" right="0" top="32px" z="90" {...T.panel} p="1" w="170px" onPointerLeave={() => setZoomOpen(false)}>
          {[['Fit page', () => S.fit('page')], ['Fit width', () => S.fit('width')], ['Fit all', () => S.fit('page')], ...ZOOMS.map(z => [`${z}%`, () => S.zoomTo(z / 100)])].map(([l, f]: any) => <Row key={l} h="26px" px="2" items="center" rounded="md" cursor="pointer" fontSize="12px" {...T.hover} onClick={() => { f(); setZoomOpen(false); }}>{l}</Row>)}</Box>}
      </Row>
      <IconBtn icon="fit" title="Fit page" onClick={() => S.fit('page')} />
      <Box position="relative"><Btn type="button" onClick={() => setLaunch(!launch)} h="30px" px="3" rounded="md" {...(launch ? T.active : T.card)} fontSize="12px" fontWeight="600" cursor="pointer"><Row items="center" gap="1"><Ic n="window" size={14} />Dockers</Row></Btn>
        {launch && <Box position="absolute" right="0" top="34px" z="90" {...T.panel} p="1" w="260px" onPointerLeave={() => setLaunch(false)}>{DOCKERS.map(d => { const on = !!S.winOf(d.id, s.layout); return <Row key={d.id} items="center" gap="2" h="34px" px="2" rounded="md" cursor="pointer" {...T.hover} onClick={() => S.toggleDocker(d.id)}><Box w="14px">{on && <Ic n="check" size={13} />}</Box><Box flex="1"><Txt fontSize="12px" fontWeight="600" m="0">{d.title}</Txt><Txt fontSize="10px" m="0" {...T.muted}>{d.blurb}</Txt></Box></Row>; })}<Box h="1px" my="1" {...T.divider} /><Row h="30px" px="2" items="center" rounded="md" cursor="pointer" fontSize="12px" {...T.hover} onClick={S.resetWorkspace}>Reset workspace</Row></Box>}</Box>
      <IconBtn icon="text" title="Insert text" active={s.tool === 'text'} onClick={() => S.setTool('text')} />
      <IconBtn icon="play" title="Preview (Ctrl+P)" active={s.preview} onClick={() => S.setPreview(!s.preview)} />
      <IconBtn icon="code" title="Code panel (Ctrl+E)" active={s.layout.code.open} onClick={() => S.toggleCode()} />
      <IconBtn icon={s.theme === 'dark' ? 'sun' : 'moon'} title="Toggle light / dark" onClick={S.toggleTheme} />
      <Btn type="button" onClick={exportZip} h="30px" px="3" rounded="md" border="0" bg="primary" text="white" fontSize="12px" fontWeight="600" cursor="pointer">Export</Btn>
    </Row>
  );
}

