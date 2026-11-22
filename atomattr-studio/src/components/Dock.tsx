import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StateBanner } from '../panels/StatesPanel';
import { createPortal } from 'react-dom';
import { Box, Btn, Row } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio, type DockTarget } from '../state/store';
import { DOCKERS, DOCKER_META, HEAD_H, clamp, winBox, type DockerId, type Win } from '../state/layout';
import { PANELS } from '../panels/Panels';
import { elOf, keyAtPoint, reg } from '../canvas/registry';
import { T } from '../theme';
import { ToolIcon } from './ToolIcons';

/* ---------- panel bodies ----------
   Every open panel is rendered once, here, into a DOM node that belongs to the panel and not to any window.
   A window only *adopts* that node while the panel is its active tab. Tabbing panels together, separating them
   again, docking or floating them moves the node; the React component under it is never remounted,
   so field drafts, open sections, selections and scroll position all survive. */
const slots = new Map<DockerId, HTMLDivElement>();
function panelEl(id: DockerId): HTMLDivElement {
  let el = slots.get(id);
  if (!el) {
    el = document.createElement('div');
    el.setAttribute('w', '100%'); el.setAttribute('h', '100%'); el.setAttribute('overflow-y', 'auto'); el.setAttribute('overflow-x', 'hidden');
    const node = el; node.addEventListener('scroll', () => { (node as any).__top = node.scrollTop; });
    slots.set(id, el);
  }
  return el;
}

const STATE_PANELS = ['properties', 'typography', 'fill', 'effects', 'vector'];
export function PanelHost() {
  const s = useStudio();
  const ids = [...new Set(s.layout.wins.flatMap(w => w.tabs))];
  return <>{ids.map(id => {
    const Body = PANELS[id]; if (!Body) return null;
    return createPortal(
      <Box display="contents" onPointerDown={() => { const w = S.winOf(id); if (w) S.focusWin(w.id); }}>{STATE_PANELS.includes(id) && <StateBanner />}<Body /></Box>,
      panelEl(id), id);
  })}</>;
}

/* ---------- small controls ---------- */
/** Icon button for a window header. */
function WinBtn({ icon, title, active, onClick }: { icon: string; title: string; active?: boolean; onClick: () => void }) {
  return (
    <Btn type="button" title={title} aria-label={title} aria-pressed={active} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onClick={onClick}
      w="24px" h="24px" p="0" display="flex" items="center" justify="center" rounded="lg" border="0" cursor="pointer" shrink="0"
      {...(active ? { bg: 'primary', text: 'white' } : { bg: 'transparent', ...T.hover, ...T.text })}>
      <ToolIcon n={icon} size={16} />
    </Btn>
  );
}

/* ---------- dragging ----------
   One gesture for windows and tabs. Past a small threshold:
   - a tab dragged out of a tabbed window is torn off into its own window,
   - a docked window is lifted out of its column,
   - the window then follows the pointer, always kept inside the workspace.
   Dock targets update as the pointer moves; releasing on one applies it, releasing elsewhere leaves the window floating. */
const EDGE = 96;
const sameTarget = (a: DockTarget, b: DockTarget) => (a === b) || (!!a && !!b && a.kind === b.kind && (a.kind === 'edge' ? a.side === (b as any).side : a.winId === (b as any).winId));

function startDockDrag(e: React.PointerEvent, winId: string, tab?: DockerId) {
  if (e.button !== 0) return; e.preventDefault();
  const sx = e.clientX; const sy = e.clientY; let live = false; let cancelled = false; let id = winId; let gx = 48; let gy = 16;

  const targetAt = (ev: PointerEvent): DockTarget => {
    const ar = elOf('sys:area')?.getBoundingClientRect();
    if (ar && ev.clientY >= ar.top && ev.clientY <= ar.bottom) {
      if (ev.clientX - ar.left < EDGE) return { kind: 'edge', side: 'left' };
      if (ar.right - ev.clientX < EDGE) return { kind: 'edge', side: 'right' };
    }
    const k = keyAtPoint(ev.clientX, ev.clientY, 'win:', `win:${id}`);
    const r = k ? elOf(k)?.getBoundingClientRect() : null;
    if (k && r && ev.clientY - r.top <= HEAD_H + 4) return { kind: 'tab', winId: k.slice(4) };
    return null;
  };
  const place = (ev: PointerEvent) => {
    const host = elOf('sys:float'); const w = S.getState().layout.wins.find(x => x.id === id); if (!host || !w) return;
    const r = host.getBoundingClientRect(); const box = winBox(w, { w: r.width, h: r.height });
    const nx = clamp(ev.clientX - r.left - gx, 0, Math.max(0, r.width - box.w)); const ny = clamp(ev.clientY - r.top - gy, 0, Math.max(0, r.height - box.h));
    const left = nx + box.w / 2 < r.width / 2;
    S.patchWin(id, { ax: left ? 'l' : 'r', x: left ? nx : r.width - nx - box.w, y: ny }, false);
  };
  const mv = (ev: PointerEvent) => {
    if (cancelled) return;
    if (!live) {
      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
      live = true;
      const w = S.getState().layout.wins.find(x => x.id === winId); if (!w) return;
      const r = elOf(`win:${winId}`)?.getBoundingClientRect();
      if (tab && w.tabs.length > 1) { const nid = S.tearTab(tab); if (nid) { id = nid; gx = 64; gy = 16; } }
      else {
        const fw = w.dock ? (w.floatRect?.w ?? w.w) : w.w;
        gx = r ? clamp(sx - r.left, 24, Math.max(24, fw - 90)) : 48; gy = r ? clamp(sy - r.top, 8, HEAD_H - 8) : 16;
        if (w.dock) S.floatWin(winId);
      }
      S.focusWin(id); S.setState({ dragWin: id });
    }
    place(ev);
    const t = targetAt(ev); if (!sameTarget(t, S.getState().dockTarget)) S.setState({ dockTarget: t });
  };
  const end = () => {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', end); window.removeEventListener('keydown', key);
    if (!live) return;
    const t = cancelled ? null : S.getState().dockTarget; S.endDockDrag();
    if (t?.kind === 'edge') S.dockWin(id, t.side); else if (t?.kind === 'tab') S.mergeWin(id, t.winId);
  };
  const key = (ev: KeyboardEvent) => { if (ev.key === 'Escape') { cancelled = true; end(); } };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', end); window.addEventListener('keydown', key);
}

/* ---------- window ---------- */
export type WindowVariant = 'float' | 'docked' | 'sheet';

/* ---------- tab menu ----------
   The three-dots menu of a window with several tabs. It opens in a portal on <body> with fixed coordinates: windows clip their
   contents (overflow hidden), so a menu inside one was cut off at the column edge. It stays inside the viewport, closes on an
   outside click, Esc, scroll or resize, and works with the arrow keys. */
const MENU_W = 208;
function TabMenu({ win, active, anchor, onClose }: { win: Win; active: DockerId; anchor: HTMLElement; onClose: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect(); const h = (ref.current?.offsetHeight ?? win.tabs.length * 30 + 8);
    const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
    const below = r.bottom + 6; const top = below + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 6) : below;
    setPos({ left, top });
  }, [anchor, win.tabs.length]);
  useEffect(() => {
    const out = (e: PointerEvent) => { const t = e.target as Node; if (!ref.current?.contains(t) && !anchor.contains(t)) onClose(); };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); (anchor.querySelector('button') as HTMLElement | null)?.focus(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
      const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []); if (!items.length) return;
      e.preventDefault(); const at = items.indexOf(document.activeElement as HTMLElement);
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    };
    window.addEventListener('pointerdown', out, true); window.addEventListener('keydown', key, true);
    window.addEventListener('resize', onClose); window.addEventListener('scroll', onClose, true);
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus(), 0);
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', out, true); window.removeEventListener('keydown', key, true); window.removeEventListener('resize', onClose); window.removeEventListener('scroll', onClose, true); };
  }, [anchor, onClose]);
  return createPortal(
    <Box ref={ref} role="menu" aria-label="Panel tabs" position="fixed" left={`${pos?.left ?? -9999}px`} top={`${pos?.top ?? -9999}px`} z="110" w={`${MENU_W}px`} p="1" {...T.dialog} rounded="12px"
      visibility={pos ? 'visible' : 'hidden'} animate="studio-menu-in 140ms cubic-bezier(0.2, 0.8, 0.2, 1) both" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      {win.tabs.map(t => {
        const title = DOCKERS.find(d => d.id === t)!.title; const on = t === active;
        return (
          <Btn key={t} type="button" role="menuitemradio" aria-checked={on} onClick={() => { S.setActiveTab(win.id, t); onClose(); }}
            display="flex" items="center" gap="2" w="100%" h="32px" px="2" rounded="8px" border="0" cursor="pointer" text-align="left" fontSize="sm" fontWeight={on ? '700' : '500'}
            focus-bg="gray-900/8" dark-focus-bg="white/10" {...(on ? T.active : { bg: 'transparent', ...T.hover, ...T.text })}>
            <ToolIcon n={DOCKER_META[t].icon} size={16} />
            <Box flex="1" min-w="0" truncate>{title}</Box>
            {on && <ToolIcon n="check" size={14} />}
          </Btn>
        );
      })}
    </Box>, document.body);
}

/** One window: a title bar (or tab strip) over the panel body. Floats over the canvas, sits in a docked column, or is the bottom sheet in narrow workspaces. */
export function Window({ win, area, variant = 'float' }: { win: Win; area: { w: number; h: number }; variant?: WindowVariant }) {
  const s = useStudio(); const dragging = s.dragWin === win.id;
  const active = win.active; const def = DOCKERS.find(d => d.id === active)!; const docked = variant === 'docked'; const sheet = variant === 'sheet';
  const box = winBox(win, area); const single = win.tabs.length === 1;
  const hostRef = useRef<HTMLDivElement | null>(null); const tabsRef = useRef<HTMLDivElement | null>(null);
  const [tabMenuOpen, setTabMenuOpen] = useState(false); const menuAnchor = useRef<HTMLDivElement | null>(null);
  const closeMenu = useCallback(() => setTabMenuOpen(false), []);
  // The tab menu is meaningless once the window has one tab or is collapsed.
  useEffect(() => { if (tabMenuOpen && (win.tabs.length < 2 || win.collapsed)) setTabMenuOpen(false); }, [tabMenuOpen, win.tabs.length, win.collapsed]);

  // Adopt the active panel's DOM node. Runs every render because the host remounts when the window is collapsed and expanded.
  useLayoutEffect(() => {
    const host = hostRef.current; if (!host) return; const el = panelEl(active);
    if (el.parentElement !== host) { host.replaceChildren(el); el.scrollTop = (el as any).__top ?? 0; }
  });
  // Keep the active tab in view when the strip overflows.
  useLayoutEffect(() => { const t = tabsRef.current?.querySelector('[aria-selected="true"]') as HTMLElement | null; t?.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }, [active, win.tabs.length]);

  const resize = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault(); const sx = e.clientX; const sy = e.clientY; const o = { w: box.w, h: box.h };
    const mv = (ev: PointerEvent) => {
      const maxW = win.ax === 'l' ? area.w - box.x : box.x + box.w; const maxH = area.h - box.y;
      const dx = ev.clientX - sx; const dy = ev.clientY - sy;
      S.patchWin(win.id, { w: clamp(o.w + (win.ax === 'l' ? dx : -dx), 220, Math.max(220, maxW)), h: clamp(o.h + dy, 120, Math.max(120, maxH)) }, false);
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); S.patchWin(win.id, {}); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  const frame = docked
    ? { position: 'relative', w: '100%', flex: win.collapsed ? 'none' : '1', 'min-h': win.collapsed ? '0' : '120px', ...T.chrome, ...T.hairline, 'border-b': '1px solid', 'border-t': '0', 'border-l': '0', 'border-r': '0' }
    : sheet
      ? { position: 'absolute', left: '0', bottom: '0', w: '100%', h: win.collapsed ? `${HEAD_H + 1}px` : `${Math.round(Math.min(win.h, Math.max(160, area.h * 0.45)))}px`, z: '60', ...T.glass, ...T.lifted, rounded: 'none', 'rounded-t': 'md' }
      : { position: 'absolute', left: `${box.x}px`, top: `${box.y}px`, w: `${box.w}px`, h: `${box.h}px`, z: String(dragging ? 94 : 20 + win.z), ...T.glass, ...(dragging ? { ...T.lifted, opacity: '0.95', 'border-color': 'primary', 'dark-border-color': 'primary' } : {}) };

  return (
    <Box {...frame} display="flex" flex-col overflow="hidden" ref={reg(`win:${win.id}`)} onPointerDown={() => S.focusWin(win.id)} role="region" aria-label={def.title}>
      {/* title bar: plain title for one panel, tabs for several. Drag it to move; a tab dragged out leaves the group. */}
      <Row items="center" h={`${HEAD_H}px`} flex="none" px="2" gap="1" cursor={sheet ? 'default' : dragging ? 'grabbing' : 'grab'} touch-action="none"
        onPointerDown={(e: React.PointerEvent) => { if (!sheet) startDockDrag(e, win.id); }} onDoubleClick={() => S.patchWin(win.id, { collapsed: !win.collapsed })}>
        <Row ref={tabsRef} flex="1" items="center" gap="1" min-w="0" overflow-x="hidden" overflow-y="hidden" h="100%" role="tablist" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Row role="tab" aria-selected="true" items="center" gap="1" h="100%" px="1" shrink="0" whitespace="nowrap" cursor="pointer"
            fontSize="sm" fontWeight="600" {...T.text}>
            {!sheet && <Box display="flex" shrink="0" opacity="50" title={win.dock ? 'Drag out to float this panel' : 'Drag to move. Drop on the left or right edge to dock.'} {...T.muted}><ToolIcon n="grip" size={14} /></Box>}
            {single && <ToolIcon n={DOCKER_META[active].icon} size={16} />}{def.title}
          </Row>
        </Row>
        {!sheet && win.tabs.length > 1 && (
          <Box ref={menuAnchor} position="relative" flex="none">
            <WinBtn icon="more" title="Open tab menu" active={tabMenuOpen} onClick={() => setTabMenuOpen(v => !v)} />
            {tabMenuOpen && menuAnchor.current && <TabMenu win={win} active={active} anchor={menuAnchor.current} onClose={closeMenu} />}
          </Box>
        )}
        <WinBtn icon={win.collapsed ? 'chevron' : 'collapse'} title={win.collapsed ? 'Expand' : 'Collapse'} onClick={() => S.patchWin(win.id, { collapsed: !win.collapsed })} />
        <WinBtn icon="close" title={single ? 'Close panel' : `Close ${def.title} tab`} onClick={() => S.closeDocker(active)} />
      </Row>
      {!win.collapsed && <Box h="1px" flex="none" {...T.divider} />}
      {!win.collapsed && <Box ref={hostRef} flex="1" min-h="0" position="relative" overflow="hidden" />}
      {!win.collapsed && variant === 'float' && (
        <Box position="absolute" right="0" bottom="0" w="16px" h="16px" cursor="nwse-resize" z="3" title="Resize" onPointerDown={resize} {...T.muted}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 5L5 13M13 9l-4 4" stroke="currentColor" strokeWidth="1.3" /></svg>
        </Box>
      )}
    </Box>
  );
}

/* ---------- drop targets ---------- */
/** Overlays shown while a panel is dragged: both dock edges, and the title bar of any window it could be tabbed into. */
export function DockTargets() {
  const s = useStudio(); const area = elOf('sys:area'); if (!s.dragWin || !area) return null;
  const r = area.getBoundingClientRect(); const t = s.dockTarget;
  const edge = (side: 'left' | 'right') => {
    const on = t?.kind === 'edge' && t.side === side; const w = on ? Math.min(s.layout.side[side], r.width * 0.4) : EDGE;
    return (
      <Box key={side} position="fixed" top={`${r.top}px`} left={`${side === 'left' ? r.left : r.right - w}px`} w={`${w}px`} h={`${r.height}px`} z="95" pointerEvents="none" display="flex" flex-col items="center" justify="start" pt="20"
        {...(on ? { bg: 'primary/20', 'dark-bg': 'primary/30', border: '2px solid', 'border-color': 'primary' } : { bg: 'primary/5', border: '2px dashed', 'border-color': 'primary/40' })}>
        <Row items="center" gap="1" px="3" py="1" rounded="lg" fontSize="sm" fontWeight="600" {...(on ? { bg: 'primary', text: 'white' } : { bg: 'white', 'dark-bg': 'gray-800', text: 'primary' })} shadow="md" whitespace="nowrap">
          <ToolIcon n="pin" size={14} />{side === 'left' ? 'Dock left' : 'Dock right'}
        </Row>
      </Box>
    );
  };
  const tabTarget = (() => {
    if (t?.kind !== 'tab') return null; const el = elOf(`win:${t.winId}`); const w = s.layout.wins.find(x => x.id === t.winId); if (!el || !w) return null;
    const b = el.getBoundingClientRect(); const names = w.tabs.map(id => DOCKERS.find(d => d.id === id)!.title).join(' + ');
    return (
      <>
        <Box position="fixed" top={`${b.top}px`} left={`${b.left}px`} w={`${b.width}px`} h={`${b.height}px`} z="94" pointerEvents="none" border="2px dashed" border-color="primary" bg="primary/10" rounded="lg" />
        <Box position="fixed" top={`${b.top}px`} left={`${b.left}px`} w={`${b.width}px`} h={`${HEAD_H}px`} z="95" pointerEvents="none" display="flex" items="center" justify="center" bg="primary/25" border="2px solid" border-color="primary" rounded="lg">
          <Row items="center" gap="1" px="3" py="1" rounded="lg" bg="primary" text="white" fontSize="sm" fontWeight="600" shadow="md" whitespace="nowrap" max-w="90%" overflow="hidden"><ToolIcon n="layers" size={14} />Tab with {names}</Row>
        </Box>
      </>
    );
  })();
  return <>{edge('left')}{edge('right')}{tabTarget}</>;
}
