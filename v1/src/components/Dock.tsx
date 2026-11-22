import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio, type Tool } from '../state/store';
import { DOCKERS, winBox, type DockerId, type Win } from '../state/layout';
import { BPS, BP_LABEL } from '../document/style';
import { keys } from '../canvas/keys';
import { PANELS, exportZip, downloadProject } from '../panels/Panels';
import { Welcome, NewProjectModal } from './Welcome';
import { reg, keyAtPoint, elOf } from '../canvas/registry';
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
/* ---------- docker windows ---------- */
export function Window({ win, area, docked }: { win: Win; area: { w: number; h: number }; docked?: boolean }) {
  const active = win.active; const Body = PANELS[active]; const def = DOCKERS.find(d => d.id === active)!;
  const box = winBox(win, area); const origin = useRef({ x: 0, y: 0, w: 0, h: 0 }); const tabDrag = useRef<DockerId | null>(null);
  const move = useDrag((dx, dy, e) => { const o = origin.current; const nx = o.x + dx; const left = nx + box.w / 2 < area.w / 2; S.patchWin(win.id, { ax: left ? 'l' : 'r', x: left ? Math.max(0, nx) : Math.max(0, area.w - nx - box.w), y: Math.max(0, Math.min(area.h - 34, o.y + dy)) }); void e; });
  const resize = useDrag((dx, dy) => { const o = origin.current; S.patchWin(win.id, { w: Math.max(220, o.w + (win.ax === 'l' ? dx : -dx)), h: Math.max(120, o.h + dy) }); });
  const startTab = (id: DockerId, e: React.PointerEvent) => { e.stopPropagation(); S.setActiveTab(win.id, id); if (win.tabs.length < 1) return; tabDrag.current = id; const sx = e.clientX; const sy = e.clientY; let moved = false;
    const up = (ev: PointerEvent) => { window.removeEventListener('pointerup', up); window.removeEventListener('pointermove', mv); if (!moved) return; const wk = keyAtPoint(ev.clientX, ev.clientY, 'win:', `win:${win.id}`);
      if (wk) S.mergeTab(id, wk.slice(4)); else if (win.tabs.length > 1) { const host = elOf('sys:area')!.getBoundingClientRect(); S.splitTab(id, 'l', Math.max(0, ev.clientX - host.left - 40), Math.max(0, ev.clientY - host.top - 12)); } };
    const mv = (ev: PointerEvent) => { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) moved = true; };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); };
  const style = docked ? { position: 'relative', w: '100%', flex: '1', 'min-h': '120px' } : { position: 'absolute', left: `${box.x}px`, top: `${box.y}px`, w: `${box.w}px`, h: `${box.h}px`, z: String(20 + win.z) };
  return (
    <Box {...style} {...T.panel} display="flex" flex-col overflow="hidden" rounded={docked ? 'none' : 'lg'} ref={reg(`win:${win.id}`)} onPointerDown={() => S.focusWin(win.id)} role="region" aria-label={def.title}>
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

