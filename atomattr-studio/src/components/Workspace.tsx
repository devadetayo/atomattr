import { ToastHost } from './Toast';
import { applyEditorFonts } from '../document/fonts';
import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { PRESETS, dockMode, sideWidth, pagesDockH, type Win } from '../state/layout';
import { BPS, BP_LABEL } from '../document/style';
import { Canvas } from '../canvas/Canvas';
import { keys } from '../canvas/keys';
import { reg } from '../canvas/registry';
import { Welcome } from './Welcome';
import { T, ACCENT_DEFAULT, accentValue } from '../theme';
// @ts-ignore engine lives in the AtomAttr package next to this app
import { setTheme as engineSetTheme } from '../../../src/engine/generator.js';
import { KEYMAP } from './tools';
import { ToolPalette, DockZones } from './ToolPalette';
import { Window, PanelHost, DockTargets } from './Dock';
import { Header, CommandPalette, BarBtn } from './Topbar';
import { CodeSplit, codeWidth } from './CodeSplit';
import { ColourPalette } from './ColorDock';
import { PagesFloat, PagesDock, PagesGuide } from './PageTabs';
import { DevicePreview } from './DevicePreview';
import { Modals } from './Modals';
import { DialogHost } from './Dialogs';
import { ImportDialog } from './ImportDialog';
import { FeedbackDialog } from './FeedbackDialog';
import { useWhatsNewAutoOpen } from './WhatsNew';
import { ZoomDock } from './ZoomDock';

/* ---------- root ---------- */
export function Workspace() {
  const s = useStudio(); useWhatsNewAutoOpen(); const areaRef = useRef<HTMLDivElement | null>(null); const [area, setArea] = useState({ w: 1000, h: 600 });
  useEffect(() => { applyEditorFonts(s.project); }, [s.project?.webFonts]);
  useEffect(() => { document.documentElement.classList.toggle('dark', s.theme === 'dark'); try { engineSetTheme(s.theme); } catch { /* theme engine unavailable */ } }, [s.theme]);
  useEffect(() => {
    const root = document.documentElement; const apply = () => { if (s.accent === ACCENT_DEFAULT) root.style.removeProperty('--primary'); else root.style.setProperty('--primary', accentValue(s.accent, s.theme === 'dark')); };
    apply(); const id = requestAnimationFrame(apply); return () => cancelAnimationFrame(id);
  }, [s.accent, s.theme]);
  useEffect(() => { const el = areaRef.current; if (!el) return; const ro = new ResizeObserver(() => setArea({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el); setArea({ w: el.clientWidth, h: el.clientHeight }); return () => ro.disconnect(); }, [s.screen]);
  useEffect(() => { const t = setTimeout(() => S.fit('page'), 60); return () => clearTimeout(t); }, [s.layout.wins.map(w => `${w.dock}${w.collapsed ? 'c' : ''}`).join(), area.w, s.layout.code.open, s.layout.code.pinned, s.layout.code.collapsed, s.layout.tools.dock ?? '', area.h > 0 && area.w < 720]);
  const selText = (() => { const ns = S.selNodes(s); return ns.length > 0 && ns.every(n => n.type === 'text' || n.type === 'heading' || n.type === 'button'); })();
  useEffect(() => {
    // Selecting text brings up the Typography dock; leaving text puts it away again (only if it opened by itself).
    if (s.screen !== 'editor' || s.preview) return; const st = S.getState();
    const hasRightDock = st.layout.wins.some(w => w.dock === 'right');
    if (selText && !S.winOf('typography', st.layout) && !hasRightDock) { S.openDocker('typography'); const w = S.winOf('typography', S.getState().layout); if (w) S.patchWin(w.id, { ax: 'l', x: 72, y: 14, w: 290, h: 470 }); S.setState({ textAuto: 'typography' }); }
    else if (!selText && st.textAuto) { const w = S.winOf('typography', st.layout); if (w && !w.dock && w.tabs.length === 1) S.closeDocker('typography'); S.setState({ textAuto: null }); }
  }, [selText, s.screen, s.preview]);
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; const typing = t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable); const st = S.getState(); const mod = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
      if (st.screen !== 'editor') return;
      if (e.altKey && !mod && !e.shiftKey) {
        if (e.code === 'KeyP') { e.preventDefault(); S.setState({ panelMenu: !st.panelMenu, presetMenu: false }); return; }
        const m = /^Digit([1-5])$/.exec(e.code); if (m) { e.preventDefault(); S.applyPreset(PRESETS[Number(m[1]) - 1].id); return; }
      }
      if (mod && k === 'k') { e.preventDefault(); S.setState({ commandOpen: true }); return; }
      if (st.commandOpen && e.key === 'Escape') { S.setState({ commandOpen: false }); e.preventDefault(); return; }
      if (typing) return;
      if (e.code === 'Space') { keys.space = true; e.preventDefault(); return; }
      if (mod) { const hit = (() => { switch (k) { case 'z': e.shiftKey ? S.redo() : S.undo(); return 1; case 'y': S.redo(); return 1; case 'g': e.shiftKey ? S.ungroupSelection() : S.groupSelection(); return 1; case 'd': S.duplicateSelection(); return 1; case 'a': S.selectAll(); return 1; case 'c': S.copySel(); return 1; case 'x': S.copySel(true); return 1; case 'v': S.paste(); return 1; case 's': S.saveNow() && S.toast('Saved'); return 1; case 'n': S.setState({ modal: 'new' }); return 1; case 'p': S.setPreview(!st.preview); return 1; case 'e': S.toggleCode(); return 1; case '0': S.fit('page'); return 1; case '9': S.fit('width'); return 1; case '1': S.fit('actual'); return 1; case '=': case '+': S.zoomStep(1); return 1; case '-': S.zoomStep(-1); return 1; case 'l': S.toggleFlag('locked'); return 1; case 'h': S.toggleFlag('hidden'); return 1; case ']': S.arrange(e.shiftKey ? 'front' : 'forward'); return 1; case '[': S.arrange(e.shiftKey ? 'back' : 'backward'); return 1; default: return 0; } })(); if (hit) e.preventDefault(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (st.pointPick) { const n = S.selNodes(st)[0]; if (n?.pts && n.pts.length > 2) S.replaceNode(n.id, nn => ({ ...nn, pts: nn.pts!.filter((_, i) => i !== st.pointPick!.index) })); S.setState({ pointPick: null }); } else S.deleteSelection(); e.preventDefault(); return; }
      if (e.key === 'Escape') { if (st.panelMenu || st.presetMenu) S.setState({ panelMenu: false, presetMenu: false }); else if (st.modal) S.setState({ modal: null }); else if (st.menu) S.setState({ menu: null }); else if (st.enter) S.exitGroup(); else if (st.preview) S.setPreview(false); else if (st.tool !== 'select') S.setTool('select'); else S.clearSelection(); return; }
      if (e.key === 'Enter' && st.sel.length === 1) { const n = S.selNodes(st)[0]; if (n?.type === 'group') { S.enterGroup(n.id); S.select([n.children![0].id]); } else if (n && (n.type === 'text' || n.type === 'heading' || n.type === 'button')) S.setState({ edit: n.id }); return; }
      if (e.key === '?') { S.setState({ modal: 'shortcuts' }); return; }
      if (e.key.startsWith('Arrow') && st.sel.length) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; const dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0; const dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0; S.begin0(); S.selNodes(st).forEach(n => { if ((n.style.mode ?? 'abs') === 'abs') S.patchNodes([n.id], { x: (Number(n.style.x ?? 0)) + dx, y: Number(n.style.y ?? 0) + dy }, 'desktop'); }); S.end0(); return; }
      if (e.shiftKey && k === 's') { S.setTool('spiral'); return; }
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
      const L = s.layout; const left = L.wins.filter(w => w.dock === 'left'); const right = L.wins.filter(w => w.dock === 'right'); const floating = L.wins.filter(w => !w.dock); const toolDock = L.tools.dock || null;
      // Room budget: the canvas always keeps CANVAS_MIN. Docked columns squeeze first, then give way to one bottom sheet.
      const toolsW = toolDock === 'left' || toolDock === 'right' ? 48 : 0;
      const topOff = toolDock === 'top' ? 48 : 0; const botOff = toolDock === 'bottom' ? 48 : 0;
      const codeOff = L.code.open && L.code.pinned ? (L.code.collapsed ? 36 : codeWidth(L.code, area.w)) : 0;
      const cols = (left.length ? 1 : 0) + (right.length ? 1 : 0);
      const mode = dockMode(area.w, cols, codeOff + toolsW); const sheet = mode === 'sheet';
      const sw = (side: 'left' | 'right') => sideWidth(L.side[side], area.w, codeOff + toolsW, cols);
      const sheetWin = sheet ? [...L.wins].sort((a, b) => b.z - a.z)[0] : null;
      const sideCol = (side: 'left' | 'right', wins: Win[]) => wins.length > 0 && !sheet && !s.preview && <Box flex="none" w={`${sw(side)}px`} h="100%" display="flex" flex-col position="relative" overflow="hidden" {...T.chrome} border-l={side === 'right' ? '1px solid' : '0'} border-r={side === 'left' ? '1px solid' : '0'}>
        <Box position="absolute" top="0" {...(side === 'left' ? { right: '-3px' } : { left: '-3px' })} w="6px" h="100%" z="5" cursor="col-resize" hover-bg="primary" onPointerDown={(e: React.PointerEvent) => { const w0 = sw(side); const sx = e.clientX; const mv = (ev: PointerEvent) => S.setSide(side, w0 + (side === 'left' ? ev.clientX - sx : sx - ev.clientX)); const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); S.fit('page'); }; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); }} />
        {wins.map(w => <Window key={w.id} win={w} area={area} variant="docked" />)}</Box>;
      return (
        <Box display="flex" flex-col w="100%" h="100%" {...T.app}>
          {!s.preview && <Header />}
          {s.preview && (
            <Row items="center" h="40px" px="3" gap="1" {...T.chrome} border-b="1px solid">
              <Txt fontSize="sm" fontWeight="600" m="0" flex="1" {...T.muted}>Preview · {BP_LABEL[s.bp]}</Txt>
              {BPS.filter(b => b === 'desktop' || s.project?.settings?.[b] !== false).map(b => <BarBtn key={b} icon={b} title={`${BP_LABEL[b]} view`} active={s.bp === b} onClick={() => S.setBp(b)} />)}
              <Box w="1px" h="18px" mx="1" {...T.divider} />
              <Btn type="button" title="Exit preview (Esc)" onClick={() => S.setPreview(false)} h="28px" px="3" rounded="lg" border="0" bg="primary" text="white" fontSize="sm" fontWeight="600" cursor="pointer">Exit preview</Btn>
            </Row>
          )}
          <Row flex="1" min-h="0" position="relative" ref={(el: HTMLDivElement | null) => { areaRef.current = el; reg('sys:area')(el); }}>
            {!s.preview && toolDock === 'left' && <ToolPalette area={area} docked="left" />}
            {sideCol('left', left)}
            {/* canvas column: the pages strip, when clipped to the top or bottom, takes its own row here and the canvas shrinks to fit */}
            <Box flex="1" min-w="0" h="100%" display="flex" flex-col position="relative">
              {!s.preview && toolDock === 'top' && <ToolPalette area={area} docked="top" />}
              {!s.preview && L.band.dock === 'top' && <PagesDock />}
              <Box flex="1" min-h="0" position="relative"><Canvas /><ZoomDock /></Box>
              {!s.preview && L.band.dock === 'bottom' && <PagesDock />}
              {!s.preview && toolDock === 'bottom' && <ToolPalette area={area} docked="bottom" />}
            </Box>
            {L.code.open && !s.preview && <CodeSplit areaW={area.w} />}
            {sideCol('right', right)}
            {!s.preview && toolDock === 'right' && <ToolPalette area={area} docked="right" />}
            {!s.preview && (() => {
              // Floating windows live over the canvas only: they must never cover a docked column or the pinned code panel.
              const leftOff = (left.length && !sheet ? sw('left') : 0) + (toolDock === 'left' ? 48 : 0);
              const rightOff = codeOff + (right.length && !sheet ? sw('right') : 0) + (toolDock === 'right' ? 48 : 0);
              const free = { w: Math.max(240, area.w - leftOff - rightOff), h: Math.max(160, area.h - topOff - botOff) };
              return <Box position="absolute" top={`${topOff}px`} left={`${leftOff}px`} w={`${free.w}px`} h={`${free.h}px`} pointerEvents="none"><Box position="relative" w="100%" h="100%" ref={reg('sys:float')}><Box pointerEvents="auto" display="contents">{!toolDock && <ToolPalette area={free} />}<PagesFloat area={free} />{sheet ? (sheetWin && <Box pointerEvents="auto" display="contents"><Window win={sheetWin} area={free} variant="sheet" /></Box>) : floating.map(w => <Box key={w.id} pointerEvents="auto" display="contents"><Window win={w} area={free} /></Box>)}<ColourPalette offsets={{ top: L.band.dock === 'top' ? pagesDockH(L) : 0, bottom: L.band.dock === 'bottom' ? pagesDockH(L) : 0 }} /></Box></Box></Box>;
            })()}
          </Row>
          {!s.preview && <DockZones />}
          {!s.preview && <DockTargets />}
          {!s.preview && <PagesGuide />}
        </Box>
      );
    })();
  return (
    <Box w="100vw" h="100vh" overflow="hidden" position="relative">
      {body}{s.screen === 'editor' && s.project && s.preview && <DevicePreview key={s.previewTick} project={s.project} getProject={() => S.getState().project!} onClose={() => S.setPreview(false)} />}{s.screen === 'editor' && s.project && <PanelHost />}<Modals />{s.screen === 'editor' && <CommandPalette />}<DialogHost /><ImportDialog /><FeedbackDialog />
      <ToastHost />
    </Box>
  );
}
export default Workspace;