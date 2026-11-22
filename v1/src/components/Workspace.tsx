import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import type { Win } from '../state/layout';
import { BPS, BP_LABEL } from '../document/style';
import { Canvas } from '../canvas/Canvas';
import { keys } from '../canvas/keys';
import { reg } from '../canvas/registry';
import { Welcome } from './Welcome';
import { IconBtn } from './ui';
import { T } from '../theme';
// @ts-ignore engine lives in the AtomAttr package next to this app
import { setTheme as engineSetTheme } from '../../../src/engine/generator.js';
import { ALL_TOOLS, KEYMAP } from './tools';
import { ToolPalette } from './ToolPalette';
import { Window } from './Dock';
import { Header, MenuBar, CommandPalette } from './Topbar';
import { CodeSplit, codeWidth } from './CodeDrawer';
import { ColourPalette } from './ColorDock';
import { PageBand } from './PageTabs';
import { Modals } from './Modals';

/* ---------- root ---------- */
export function Workspace() {
  const s = useStudio(); const areaRef = useRef<HTMLDivElement | null>(null); const [area, setArea] = useState({ w: 1000, h: 600 });
  useEffect(() => { document.documentElement.classList.toggle('dark', s.theme === 'dark'); try { engineSetTheme(s.theme); } catch { /* theme engine unavailable */ } }, [s.theme]);
  useEffect(() => { const el = areaRef.current; if (!el) return; const ro = new ResizeObserver(() => setArea({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el); setArea({ w: el.clientWidth, h: el.clientHeight }); return () => ro.disconnect(); }, [s.screen]);
  useEffect(() => { const t = setTimeout(() => S.fit('page'), 60); return () => clearTimeout(t); }, [s.layout.wins.map(w => `${w.dock}${w.collapsed ? 'c' : ''}`).join(), area.w, s.layout.code.open, s.layout.code.pinned, s.layout.code.collapsed, s.layout.band.open]);
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; const typing = t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable); const st = S.getState(); const mod = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
      if (st.screen !== 'editor') return;
      if (mod && k === 'k') { e.preventDefault(); S.setState({ commandOpen: true }); return; }
      if (st.commandOpen && e.key === 'Escape') { S.setState({ commandOpen: false }); e.preventDefault(); return; }
      if (typing) return;
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
        <Box display="flex" flex-col w="100%" h="100%">
          {!s.preview && <><Header /><MenuBar /></>}
          {s.preview && <Row items="center" h="36px" px="3" gap="2" {...T.chrome} border-b="1px solid"><Txt fontSize="12px" m="0" flex="1" {...T.muted}>Preview · {BP_LABEL[s.bp]}</Txt>{BPS.map(b => <IconBtn key={b} icon={b} title={BP_LABEL[b]} active={s.bp === b} size={26} onClick={() => S.setBp(b)} />)}<Btn type="button" onClick={() => S.setPreview(false)} h="26px" px="3" rounded="md" border="0" bg="primary" text="white" fontSize="12px" cursor="pointer">Exit preview</Btn></Row>}
          <Row flex="1" min-h="0" position="relative" ref={(el: HTMLDivElement | null) => { areaRef.current = el; reg('sys:area')(el); }}>
            {sideCol('left', left)}
            <Box flex="1" min-w="0" h="100%" position="relative"><Canvas /></Box>
            {L.code.open && !s.preview && <CodeSplit areaW={area.w} />}
            {sideCol('right', right)}
            {!s.preview && (() => {
              // Floating windows live over the canvas only: they must never cover a docked column or the pinned code panel.
              const leftOff = left.length ? L.side.left : 0;
              const codeOff = L.code.open && L.code.pinned ? (L.code.collapsed ? 36 : codeWidth(L.code, area.w)) : 0;
              const rightOff = codeOff + (right.length ? L.side.right : 0);
              const free = { w: Math.max(240, area.w - leftOff - rightOff), h: area.h };
              return <Box position="absolute" top="0" left={`${leftOff}px`} w={`${free.w}px`} h="100%" pointer-events="none"><Box position="relative" w="100%" h="100%"><Box pointer-events="auto" display="contents"><ToolPalette area={free} />{floating.map(w => <Box key={w.id} pointer-events="auto" display="contents"><Window win={w} area={free} /></Box>)}<ColourPalette /></Box></Box></Box>;
            })()}
          </Row>
          {!s.preview && <PageBand />}
        </Box>
      );
    })();
  return (
    <Box w="100vw" h="100vh" overflow="hidden" position="relative">
      {body}<Modals />{s.screen==='editor'&&<CommandPalette />}
      {s.toast && <Box position="fixed" bottom="56px" left="50%" transform="translateX(-50%)" z="120" px="4" py="2" rounded="lg" shadow="lg" bg={s.toast.kind === 'error' ? 'danger' : 'gray-900'} text="white" fontSize="12px" role="status">{s.toast.text}</Box>}
    </Box>
  );
}
export default Workspace;

