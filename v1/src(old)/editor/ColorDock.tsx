import { useEffect, useState } from 'react';
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import { BAR, Divider, FIELD, I, IconButton } from './Studio-Ui';

const STORAGE_KEY = 'atomattr-studio:color-swatches';
const DEFAULT_SWATCHES = ['#111827', '#374151', '#9ca3af', '#ffffff', '#6366f1', '#38bdf8', '#22c55e', '#facc15', '#f59e0b', '#ef4444', '#ec4899', '#a855f7'];
export const isHex = (value: string | undefined): value is string => !!value && /^#[\da-f]{6}$/i.test(value);

export type Palette = { swatches: string[]; add: (color: string) => void; remove: (color: string) => void };
export type ColorSlot = 'primary' | 'secondary';

/** One shared swatch list (saved in this browser) for the colour bar and the Colors docker. */
export function usePalette(): Palette {
  const [swatches, setSwatches] = useState<string[]>(() => {
    try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); return Array.isArray(value) ? value.filter(isHex).slice(0, 24) : DEFAULT_SWATCHES; }
    catch { return DEFAULT_SWATCHES; }
  });
  const save = (next: string[]) => { setSwatches(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} };
  return {
    swatches,
    add: color => { if (isHex(color) && swatches.length < 24 && !swatches.some(s => s.toLowerCase() === color.toLowerCase())) save([...swatches, color]); },
    remove: color => save(swatches.filter(s => s !== color)),
  };
}

type Props = {
  primary?: string; secondary?: string; labels: [string, string]; enabled: boolean; palette: Palette;
  onApply: (slot: ColorSlot, value: string) => void;
};

/** Docked colour palette, CorelDRAW style: click a swatch for the primary colour, right-click for the secondary one, Alt-click to remove. */
export function ColorDock({ primary, secondary, labels, enabled, palette, onApply }: Props) {
  const [hex, setHex] = useState(isHex(primary) ? primary : '#6366f1');
  const active = isHex(primary) ? primary : hex;
  const canSample = typeof window !== 'undefined' && 'EyeDropper' in window;
  useEffect(() => { if (isHex(primary)) setHex(primary); }, [primary]);
  const apply = (slot: ColorSlot, value: string) => { if (!enabled) return; if (slot === 'primary') setHex(value); onApply(slot, value); };
  async function sample() { try { const result = await new (window as any).EyeDropper().open(); if (result?.sRGBHex) apply('primary', result.sRGBHex); } catch { /* cancelled */ } }

  return (
    <Row role="toolbar" aria-label="Colour palette" {...BAR} border-t="1px solid gray-200" items="center" gap="3" px="3" h="11" flex="none" overflow="auto" opacity={enabled ? '1' : '0.6'}>
      <Txt fontSize="xs" fontWeight="600" text="muted" m="0" whitespace="nowrap">{enabled ? `${labels[0]} · click    ${labels[1]} · right-click` : 'Select an object to colour it'}</Txt>
      {canSample && <IconButton label="Eyedropper · sample any colour on screen" onClick={() => void sample()} size="8" disabled={!enabled}>{I.dropper}</IconButton>}
      <Input aria-label={labels[0]} type="color" value={active} disabled={!enabled} onChange={(e: ChangeEvent<HTMLInputElement>) => apply('primary', e.target.value)}
        w="8" h="8" p="0" border="0" bg="transparent" rounded="lg" cursor="pointer" flex="none" />
      <Divider />
      <Row items="center" gap="2">
        {palette.swatches.map(swatch => (
          <Btn key={swatch} type="button" disabled={!enabled}
            onClick={(e: ReactMouseEvent) => { if (e.altKey) palette.remove(swatch); else apply('primary', swatch); }}
            onContextMenu={(e: ReactMouseEvent) => { e.preventDefault(); apply('secondary', swatch); }}
            aria-label={`Apply ${swatch}`} title={`${swatch} · click: ${labels[0]} · right-click: ${labels[1]} · Alt-click: remove`}
            w="6" h="6" minW="6" p="0" rounded="full" bg={swatch} cursor="pointer" flex="none"
            border={active.toLowerCase() === swatch.toLowerCase() ? '2px solid primary' : '1px solid gray-300'} dark-border-color={active.toLowerCase() === swatch.toLowerCase() ? 'primary' : 'gray-700'} />
        ))}
        <IconButton label="Save the current colour as a swatch" onClick={() => palette.add(active)} disabled={!enabled || palette.swatches.length >= 24} size="6">{I.plus}</IconButton>
      </Row>
      <Divider />
      <Row items="center" gap="2" flex="none">
        <Box w="6" h="6" flex="none" rounded="md" border="1px solid gray-300" dark-border-color="gray-700" bg={active} aria-label={`Current ${labels[0].toLowerCase()}`} />
        <Input aria-label="Colour HEX" value={hex} placeholder="#6366f1" maxLength={7} w="24" {...FIELD} fontSize="xs" disabled={!enabled}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setHex(e.target.value)}
          onBlur={() => { if (isHex(hex)) apply('primary', hex); }}
          onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && isHex(hex)) apply('primary', hex); }} />
        <Box w="6" h="6" flex="none" rounded="md" border="1px solid gray-300" dark-border-color="gray-700" bg={isHex(secondary) ? secondary : 'transparent'} aria-label={`Current ${labels[1].toLowerCase()}`} title={`${labels[1]}: ${secondary || 'none'}`} />
      </Row>
    </Row>
  );
}
