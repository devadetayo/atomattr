import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Badge, Btn, Input, Row, Txt } from 'atomattr/react';
import { CURSOR_EVENT } from '../registry/events';
import { BAR, I, IconButton } from './Studio-Ui';

type Props = {
  hint: string; info: string; zoom: number; onZoom: (zoom: number) => void; onFit: () => void;
  snapOn: boolean; onSnap: () => void; gridOn: boolean; onGrid: () => void; guidesOn: boolean; onGuides: () => void;
  pageLabel: string; saveState: 'saved' | 'saving' | 'error'; unit: string;
};

function Toggle({ label, title, on, onClick }: { label: string; title: string; on: boolean; onClick: () => void }) {
  return (
    <Btn type="button" onClick={onClick} aria-pressed={on} title={title} px="2" py="1" rounded="md" border="none" fontSize="xs" fontWeight="600"
      bg={on ? 'primary/15' : 'transparent'} text={on ? 'primary' : 'muted'} hover-bg={on ? 'primary/20' : 'gray-100'} dark-hover-bg={on ? 'primary/20' : 'gray-800'}>{label}</Btn>
  );
}

/** Docked status bar, CorelDRAW style: tool hint, pointer position, selection info, snapping toggles, zoom. */
export function StatusBar({ hint, info, zoom, onZoom, onFit, snapOn, onSnap, gridOn, onGrid, guidesOn, onGuides, pageLabel, saveState, unit }: Props) {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const onMove = (event: Event) => setCursor((event as CustomEvent).detail ?? null);
    window.addEventListener(CURSOR_EVENT, onMove);
    return () => window.removeEventListener(CURSOR_EVENT, onMove);
  }, []);
  const percent = Math.round(zoom * 100);
  return (
    <Row as="footer" role="status" {...BAR} border-t="1px solid gray-200" items="center" gap="4" px="3" h="9" flex="none" fontSize="xs" text="muted" overflow="hidden">
      <Txt fontSize="xs" text="muted" m="0" flex="1" minW="0" truncate>{hint}</Txt>
      <Txt fontSize="xs" text="muted" m="0" w="32" flex="none" whitespace="nowrap">{cursor ? `X ${cursor.x}   Y ${cursor.y} ${unit}` : `— ${unit}`}</Txt>
      <Txt fontSize="xs" text="text" m="0" whitespace="nowrap" truncate maxW="64" flex="none">{info}</Txt>
      <Row items="center" gap="1" flex="none">
        <Toggle label="Snap" title="Snap to grid (Ctrl+Y)" on={snapOn} onClick={onSnap} />
        <Toggle label="Grid" title="Show grid" on={gridOn} onClick={onGrid} />
        <Toggle label="Guides" title="Alignment guides while dragging" on={guidesOn} onClick={onGuides} />
      </Row>
      <Row items="center" gap="1" flex="none">
        <IconButton label="Zoom out" onClick={() => onZoom(Math.max(0.25, Math.round((zoom - 0.05) * 100) / 100))} size="6">{I.minus}</IconButton>
        <Input type="range" aria-label="Zoom" min={25} max={150} step={5} value={percent} accentColor="primary" w="28"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onZoom(Number(e.target.value) / 100)} />
        <IconButton label="Zoom in" onClick={() => onZoom(Math.min(1.5, Math.round((zoom + 0.05) * 100) / 100))} size="6">{I.plus}</IconButton>
        <Txt fontSize="xs" text="text" m="0" w="10" textAlign="right">{percent}%</Txt>
        <Btn type="button" onClick={onFit} title="Fit the page in the window" px="2" py="1" rounded="md" border="none" fontSize="xs" bg="transparent" text="muted" hover-bg="gray-100" dark-hover-bg="gray-800">Fit</Btn>
      </Row>
      <Txt fontSize="xs" text="muted" m="0" whitespace="nowrap" flex="none">{pageLabel}</Txt>
      <Badge bg={saveState === 'error' ? 'danger/10' : saveState === 'saving' ? 'warning/10' : 'success/10'} text={saveState === 'error' ? 'danger' : saveState === 'saving' ? 'warning' : 'success'} rounded="full" px="2" py="1" fontSize="xs" flex="none">
        {saveState === 'error' ? 'Save error' : saveState === 'saving' ? 'Saving…' : 'Saved'}
      </Badge>
    </Row>
  );
}
