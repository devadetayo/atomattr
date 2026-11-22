import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as RPE, ReactNode } from 'react';
import { Badge, Box, Btn, Row, Stack, Txt } from 'atomattr/react';
import { I, IconButton, PANEL, WELL } from './Studio-Ui';

export type PanelId = 'properties' | 'styles' | 'typography' | 'colors' | 'transform' | 'layers' | 'align' | 'shapes' | 'assets' | 'presets';

/** The bento launcher: two rows of tiles. A tile opens or closes its docker. */
export const BENTO_ROWS: PanelId[][] = [['properties', 'styles', 'typography', 'colors', 'transform'], ['layers', 'align', 'shapes', 'assets', 'presets']];
export const PANEL_TITLES: Record<PanelId, string> = { properties: 'Properties', styles: 'Styles', typography: 'Typography', colors: 'Colors', transform: 'Transform', layers: 'Layers', align: 'Align & Arrange', shapes: 'Shapes', assets: 'Assets', presets: 'Sections & Presets' };
const TILE_LABELS: Record<PanelId, string> = { ...PANEL_TITLES, align: 'Align', presets: 'Presets' };

type PanelState = { open: boolean; pinned: boolean; x: number; y: number; w: number; h: number };
type PanelsState = { panels: Record<PanelId, PanelState>; order: PanelId[] };

const KEY = 'atomattr-studio:panels';
const ALL: PanelId[] = ['properties', 'styles', 'typography', 'colors', 'transform', 'layers', 'align', 'shapes', 'assets', 'presets'];
const OPEN_BY_DEFAULT: PanelId[] = ['properties', 'layers'];
const MIN_W = 260;
const MIN_H = 160;

function defaults(): PanelsState {
  const panels = {} as Record<PanelId, PanelState>;
  for (const id of ALL) panels[id] = { open: OPEN_BY_DEFAULT.includes(id), pinned: true, x: 0, y: 0, w: 320, h: 360 };
  return { panels, order: [...ALL] };
}
function load(): PanelsState {
  const base = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!saved?.panels) return base;
    for (const id of ALL) if (saved.panels[id]) base.panels[id] = { ...base.panels[id], ...saved.panels[id] };
    return base;
  } catch { return base; }
}

/** Dock state lives above the Dock so the toolbar, menus and left rail can open and close dockers too. */
export function usePanels() {
  const [state, setState] = useState<PanelsState>(load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }, [state]);
  useEffect(() => {
    const reset = () => setState(defaults());
    window.addEventListener('atomattr-studio:reset-workspace', reset);
    return () => window.removeEventListener('atomattr-studio:reset-workspace', reset);
  }, []);
  const patch = (id: PanelId, change: Partial<PanelState>) => setState(s => ({ ...s, panels: { ...s.panels, [id]: { ...s.panels[id], ...change } } }));
  const front = (id: PanelId) => setState(s => (s.order[s.order.length - 1] === id ? s : { ...s, order: [...s.order.filter(item => item !== id), id] }));
  const toggle = (id: PanelId) => setState(s => ({ ...s, panels: { ...s.panels, [id]: { ...s.panels[id], open: !s.panels[id].open } } }));
  return { state, patch, front, toggle };
}
export type Panels = ReturnType<typeof usePanels>;

export type PanelDef = { id: PanelId; icon: ReactNode; badge?: ReactNode; render: () => ReactNode };

function Tile({ def, open, onToggle }: { def: PanelDef; open: boolean; onToggle: () => void }) {
  return (
    <Btn type="button" onClick={onToggle} aria-pressed={open} title={`${open ? 'Close' : 'Open'} ${PANEL_TITLES[def.id]}`}
      display="flex" flex-col items="center" justify="center" gap="1" px="1" py="2" rounded="lg" border="none" fontSize="xs" minW="0"
      bg={open ? 'primary/15' : 'gray-100'} dark-bg={open ? 'primary/15' : 'gray-800'} text={open ? 'primary' : 'muted'}
      hover-bg={open ? 'primary/20' : 'gray-200'} dark-hover-bg={open ? 'primary/20' : 'gray-700'}>
      <Box as="span" display="flex" aria-hidden="true">{def.icon}</Box>
      <Box as="span" truncate maxW="full">{TILE_LABELS[def.id]}</Box>
      {def.badge !== undefined && <Badge bg="gray-200" dark-bg="gray-950" text="muted" rounded="full" px="2" fontSize="xs">{def.badge}</Badge>}
    </Btn>
  );
}

type WindowProps = { def: PanelDef; state: PanelState; z: number; panels: Panels };

/** One docker. Pinned: a card in the right-hand column. Unpinned: a floating window you can drag by its header and resize from its corner. */
function PanelWindow({ def, state, z, panels }: WindowProps) {
  const ref = useRef<HTMLElement>(null);
  const move = useRef<{ dx: number; dy: number } | null>(null);
  const size = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const floating = !state.pinned;
  const { id } = def;

  function togglePin() {
    const rect = ref.current?.getBoundingClientRect();
    if (state.pinned && rect) panels.patch(id, { pinned: false, x: Math.max(8, Math.round(rect.left)), y: Math.max(8, Math.round(rect.top)), w: Math.max(MIN_W, Math.round(rect.width)), h: Math.min(Math.max(MIN_H, Math.round(rect.height)), 520) });
    else panels.patch(id, { pinned: true });
    panels.front(id);
  }
  function startMove(event: RPE) {
    if (!floating || (event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    move.current = { dx: event.clientX - state.x, dy: event.clientY - state.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function doMove(event: RPE) {
    const m = move.current;
    if (!m) return;
    panels.patch(id, { x: Math.max(0, Math.min(window.innerWidth - 80, event.clientX - m.dx)), y: Math.max(0, Math.min(window.innerHeight - 48, event.clientY - m.dy)) });
  }
  function startResize(event: RPE) {
    event.preventDefault(); event.stopPropagation();
    size.current = { x: event.clientX, y: event.clientY, w: state.w, h: state.h };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function doResize(event: RPE) {
    const s = size.current;
    if (!s) return;
    panels.patch(id, { w: Math.max(MIN_W, s.w + event.clientX - s.x), h: Math.max(MIN_H, s.h + event.clientY - s.y) });
  }
  const end = () => { move.current = null; size.current = null; };

  return (
    <Box ref={ref} as="section" aria-label={PANEL_TITLES[id]} {...PANEL} display="flex" flex-col overflow="hidden"
      {...(floating
        ? { position: 'fixed', left: `${state.x}px`, top: `${state.y}px`, w: `${state.w}px`, h: `${state.h}px`, maxW: 'calc(100vw - 16px)', maxH: 'calc(100vh - 16px)', z: String(40 + z) }
        : { w: 'full', flex: 'none' })}
      onPointerDown={floating ? () => panels.front(id) : undefined}>
      <Row items="center" justify="between" gap="2" px="3" py="2" border-b="1px solid gray-200" dark-border-color="gray-800" flex="none"
        cursor={floating ? 'grab' : undefined} touchAction="none" onPointerDown={startMove} onPointerMove={doMove} onPointerUp={end} onPointerCancel={end}>
        <Row items="center" gap="2" minW="0" text="muted">
          <Box as="span" display="flex" aria-hidden="true">{def.icon}</Box>
          <Txt fontSize="sm" fontWeight="700" text="text" m="0" truncate>{PANEL_TITLES[id]}</Txt>
        </Row>
        <Row gap="1" flex="none">
          <IconButton label={state.pinned ? `Unpin ${PANEL_TITLES[id]} (float it)` : `Pin ${PANEL_TITLES[id]} to the dock`} onClick={togglePin} active={state.pinned} size="7">{I.pin}</IconButton>
          <IconButton label={`Close ${PANEL_TITLES[id]}`} onClick={() => panels.patch(id, { open: false })} size="7">{I.close}</IconButton>
        </Row>
      </Row>
      <Box p="3" overflow={floating ? 'auto' : undefined} flex={floating ? '1' : undefined} minH="0">{def.render()}</Box>
      {floating && (
        <Box position="absolute" right="0" bottom="0" w="4" h="4" cursor="nwse-resize" touchAction="none" aria-label={`Resize ${PANEL_TITLES[id]}`}
          bg="gray-200" dark-bg="gray-700" rounded="sm" onPointerDown={startResize} onPointerMove={doResize} onPointerUp={end} onPointerCancel={end} />
      )}
    </Box>
  );
}

/**
 * Right-hand dock. The column on the right holds the bento launcher and every pinned docker, and keeps a right-hand
 * padding boundary so it never sits on top of the canvas. Unpinned dockers float over everything and drag freely.
 */
export function Dock({ panels, defs }: { panels: Panels; defs: PanelDef[] }) {
  const { state } = panels;
  const byId = (id: PanelId) => defs.find(def => def.id === id)!;
  const pinned = defs.filter(def => state.panels[def.id].open && state.panels[def.id].pinned);
  const floating = defs.filter(def => state.panels[def.id].open && !state.panels[def.id].pinned);
  return (
    <>
      <Stack as="aside" aria-label="Dockers" {...WELL} border-l="1px solid gray-200" w="384px" flex="none" gap="3" p="3" overflow="auto" maxW="calc(100vw - 24px)">
        <Box {...PANEL} p="2">
          <Stack gap="2">
            <Txt fontSize="xs" fontWeight="700" text="muted" m="0" px="1">Dockers</Txt>
            {BENTO_ROWS.map(row => (
              <Box key={row.join('-')} display="grid" grid-cols={String(row.length)} gap="2">
                {row.map(id => <Tile key={id} def={byId(id)} open={state.panels[id].open} onToggle={() => panels.toggle(id)} />)}
              </Box>
            ))}
          </Stack>
        </Box>
        {pinned.map(def => <PanelWindow key={def.id} def={def} state={state.panels[def.id]} z={state.order.indexOf(def.id)} panels={panels} />)}
      </Stack>
      {floating.map(def => <PanelWindow key={def.id} def={def} state={state.panels[def.id]} z={state.order.indexOf(def.id)} panels={panels} />)}
    </>
  );
}
