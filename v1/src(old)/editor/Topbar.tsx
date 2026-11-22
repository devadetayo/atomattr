import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Box, Btn, H1, Input, Row, Stack, Txt } from 'atomattr/react';
import { BAR, Divider, GHOST, I, IconButton, PANEL } from './Studio-Ui';

export type MenuItem = { label: string; onSelect: () => void; shortcut?: string; disabled?: boolean; checked?: boolean; separatorBefore?: boolean };
export type MenuDef = { label: string; items: MenuItem[] };

type Props = {
  name: string; onNameChange: (name: string) => void;
  mode: 'web' | 'design'; onModeChange: (mode: 'web' | 'design') => void;
  viewport: string; onViewportChange: (viewport: string) => void;
  preview: boolean; onPreviewChange: () => void;
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void;
  saveState: 'saved' | 'saving' | 'error';
  onExport: () => void; exportState: 'idle' | 'exporting' | 'error';
  theme: 'light' | 'dark'; onThemeToggle: () => void;
  zoom: number; onZoomChange: (zoom: number) => void;
  onResetWorkspace: () => void;
  menus: MenuDef[];
};

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, close]);
  return ref;
}

function MenuList({ items, onClose, left = '0' }: { items: MenuItem[]; onClose: () => void; left?: string }) {
  return (
    <Stack role="menu" {...PANEL} rounded="lg" p="1" minW="56" position="absolute" left={left} top="full" mt="1" z="60" gap="0">
      {items.map(item => (
        <Box key={item.label} w="full">
          {item.separatorBefore && <Box w="full" h="1px" bg="gray-200" dark-bg="gray-800" my="1" />}
          <Btn type="button" role="menuitem" disabled={item.disabled} onClick={() => { item.onSelect(); onClose(); }}
            display="flex" items="center" justify="between" gap="4" w="full" px="3" py="2" rounded="md" border="none" fontSize="sm"
            bg="transparent" text={item.disabled ? 'muted' : 'text'} opacity={item.disabled ? '0.5' : '1'} hover-bg="gray-100" dark-hover-bg="gray-800">
            <Box as="span" display="flex" items="center" gap="2"><Box as="span" w="4" display="flex" text="primary">{item.checked ? I.check : null}</Box>{item.label}</Box>
            {item.shortcut && <Box as="span" text="muted" fontSize="xs">{item.shortcut}</Box>}
          </Btn>
        </Box>
      ))}
    </Stack>
  );
}

function Dropdown({ trigger, items, align = 'left' }: { trigger: (open: boolean, toggle: () => void) => ReactNode; items: MenuItem[]; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useDismiss(open, close);
  return <Box ref={ref} position="relative">{trigger(open, () => setOpen(v => !v))}{open && <MenuList items={items} onClose={close} left={align === 'left' ? '0' : undefined} />}</Box>;
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.5];
const VIEWPORTS = [{ id: 'desktop', icon: I.desktop }, { id: 'tablet', icon: I.tablet }, { id: 'mobile', icon: I.mobile }] as const;
const STATUS = { saved: ['success', 'Saved locally'], saving: ['warning', 'Saving…'], error: ['danger', 'Save failed'] } as const;

/** Two rows: the title bar (brand, project, mode, view controls, export) and the menu bar. */
export function Topbar({ name, onNameChange, mode, onModeChange, viewport, onViewportChange, preview, onPreviewChange, canUndo, canRedo, onUndo, onRedo, saveState, onExport, exportState, theme, onThemeToggle, zoom, onZoomChange, onResetWorkspace, menus }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useDismiss(openMenu !== null, () => setOpenMenu(null));
  const [statusColor, statusText] = STATUS[saveState];
  const zoomItems: MenuItem[] = [
    ...ZOOM_STEPS.map(z => ({ label: `${Math.round(z * 100)}%`, onSelect: () => onZoomChange(z), checked: Math.abs(zoom - z) < 0.01 })),
    { label: 'Fit canvas', onSelect: () => onZoomChange(0.7), separatorBefore: true },
  ];

  return (
    <Stack as="header" {...BAR} border-b="1px solid gray-200" gap="0" position="relative" z="30" flex="none">
      <Row items="center" gap="4" px="4" h="14">
        <Row flex="1" gap="3" items="center" minW="0">
          <Box bg="primary" text="white" rounded="lg" w="8" h="8" display="flex" items="center" justify="center" flex="none" shadow="md">{I.logo}</Box>
          <H1 fontSize="sm" fontWeight="700" m="0" whitespace="nowrap">AtomAttr Studio</H1>
          <Input aria-label="Project name" title="Rename project" value={name} onChange={(e: ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
            bg="gray-100" dark-bg="gray-950" border="1px solid gray-200" dark-border-color="gray-800" rounded="lg" px="3" h="9" fontSize="sm" fontWeight="500" text="text" w="44" minW="0" />
        </Row>

        <Row role="toolbar" aria-label="Canvas controls" items="center" gap="2" flex="none">
          <Row gap="1" items="center" bg="gray-100" dark-bg="gray-950" rounded="lg" p="1" aria-label="Editor mode">
            {(['web', 'design'] as const).map(m => (
              <Btn key={m} type="button" onClick={() => onModeChange(m)} aria-pressed={mode === m} {...GHOST} px="3"
                bg={mode === m ? 'primary' : 'transparent'} dark-bg={mode === m ? 'primary' : 'transparent'} text={mode === m ? 'white' : 'muted'}
                hover-bg={mode === m ? 'primary' : 'gray-200'} dark-hover-bg={mode === m ? 'primary' : 'gray-800'}>{m === 'web' ? 'Web' : 'Design'}</Btn>
            ))}
          </Row>
          <IconButton label="Undo (Ctrl/⌘+Z)" onClick={onUndo} disabled={!canUndo}>{I.undo}</IconButton>
          <IconButton label="Redo (Ctrl/⌘+Shift+Z)" onClick={onRedo} disabled={!canRedo}>{I.redo}</IconButton>
          <Divider />
          {mode === 'web' && (
            <Row gap="1" items="center" bg="gray-100" dark-bg="gray-950" rounded="lg" p="1" aria-label="Viewport">
              {VIEWPORTS.map(v => <IconButton key={v.id} label={`${v.id[0].toUpperCase()}${v.id.slice(1)} viewport`} onClick={() => onViewportChange(v.id)} active={viewport === v.id} size="8">{v.icon}</IconButton>)}
            </Row>
          )}
          <Dropdown trigger={(open, toggle) => (
            <Btn type="button" onClick={toggle} aria-haspopup="menu" aria-expanded={open} title="Zoom"
              display="flex" items="center" justify="center" gap="1" px="2" h="9" w="20" rounded="lg" border="none" bg="transparent" text="muted" hover-bg="gray-100" dark-hover-bg="gray-800" fontSize="sm">
              {Math.round(zoom * 100)}% {I.chevron}
            </Btn>
          )} items={zoomItems} />
        </Row>

        <Row flex="1" gap="2" items="center" justify="end" minW="0">
          <Row gap="2" items="center" px="1" role="status" aria-live="polite">
            <Box w="2" h="2" rounded="full" bg={statusColor} flex="none" />
            <Txt text="muted" fontSize="xs" m="0" whitespace="nowrap">{statusText}</Txt>
          </Row>
          <Btn type="button" onClick={onPreviewChange} aria-pressed={preview} display="flex" items="center" gap="2" px="3" h="9" rounded="lg" fontSize="sm"
            border={preview ? '1px solid primary' : '1px solid gray-200'} dark-border-color={preview ? 'primary' : 'gray-800'}
            bg={preview ? 'primary/15' : 'transparent'} text={preview ? 'primary' : 'text'}
            hover-bg={preview ? 'primary/20' : 'gray-100'} dark-hover-bg={preview ? 'primary/20' : 'gray-800'}>
            {I.eye}{preview ? 'Editing' : 'Preview'}
          </Btn>
          <Btn type="button" onClick={onExport} disabled={exportState === 'exporting'}
            display="flex" items="center" gap="2" bg="primary" text="white" hover-bg="primary/90" border="none" rounded="lg" px="4" h="9" fontSize="sm" fontWeight="600" shadow="md"
            opacity={exportState === 'exporting' ? '0.7' : '1'}>
            {I.upload}{exportState === 'exporting' ? 'Exporting…' : exportState === 'error' ? 'Retry export' : 'Export'}
          </Btn>
          <IconButton label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={onThemeToggle} active>{theme === 'dark' ? I.moon : I.sun}</IconButton>
          <IconButton label="Reset workspace layout" onClick={onResetWorkspace}>{I.gear}</IconButton>
        </Row>
      </Row>

      <Row ref={menuRef} as="nav" aria-label="Menu" items="center" gap="1" px="3" h="10" border-t="1px solid gray-200" dark-border-color="gray-800" position="relative">
        {menus.map(menu => (
          <Box key={menu.label} position="relative">
            <Btn type="button" aria-haspopup="menu" aria-expanded={openMenu === menu.label}
              onClick={() => setOpenMenu(v => (v === menu.label ? null : menu.label))} onPointerEnter={() => { if (openMenu) setOpenMenu(menu.label); }}
              px="3" py="1" rounded="md" border="none" fontSize="sm"
              bg={openMenu === menu.label ? 'gray-100' : 'transparent'} dark-bg={openMenu === menu.label ? 'gray-800' : 'transparent'} text="text" hover-bg="gray-100" dark-hover-bg="gray-800">{menu.label}</Btn>
            {openMenu === menu.label && <MenuList items={menu.items} onClose={() => setOpenMenu(null)} />}
          </Box>
        ))}
      </Row>
    </Stack>
  );
}
