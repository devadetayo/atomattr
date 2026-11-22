import { useState } from 'react';
import { Box, Row, Txt, Btn } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { paletteAtBottom } from '../state/layout';
import { T } from '../theme';
import { BI } from './BarIcons';
import { ToolIcon } from './ToolIcons';
import { Bt, Row2, Scrim } from './Topbar';

/* Floating zoom controls, bottom centre of the canvas, glass like the other floating bars.
   They can be put away: the close button (or View > Zoom controls) folds them into a small zoom chip, and the chip brings them back.
   The bar keeps clear of the colour palette: above it when the palette sits along the bottom, beside it otherwise. */
const ZOOMS = [10, 25, 50, 75, 100, 150, 200, 400, 800];

export function ZoomDock() {
  const s = useStudio(); const [open, setOpen] = useState(false);
  if (s.preview) return null;
  const shown = s.layout.zoomDock !== false;
  const pal = s.layout.palette;
  const bottom = !pal.visible ? 66 : paletteAtBottom(s.layout) ? 76 : 16; // 66: clear of the small "show palette" button
  const pct = Math.round(s.view.zoom * 100);

  if (!shown) {
    return (
      <Btn type="button" title="Show zoom controls" aria-label="Show zoom controls" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()} onClick={() => S.setZoomDock(true)}
        position="absolute" left="50%" bottom={`${bottom}px`} transform="translateX(-50%)" z="30" h="28px" px="3" display="flex" items="center" gap="2" cursor="pointer" fontSize="sm" fontWeight="600" {...T.glass} {...T.text} hover-opacity="100" opacity="80" animate="studio-pop 160ms ease-out both">
        <ToolIcon n="zoom" size={16} />{pct}%
      </Btn>
    );
  }

  const items = [['Fit page', 'fit', () => S.fit('page')], ['Fit width', 'fitwidth', () => S.fit('width')], ['Selection', 'selectall', () => S.fit('selection')], ['Actual size', 'actual', () => S.fit('actual')], ...ZOOMS.map(z => [`${z}%`, '', () => S.zoomTo(z / 100)])] as [string, string, () => void][];
  return (
    <Box position="absolute" left="50%" bottom={`${bottom}px`} transform="translateX(-50%)" z="30" display="flex" items="center" gap="2" p="5px" {...T.glass} animate="studio-pop 160ms ease-out both" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      <Bt t="Zoom out (Ctrl+-)" on={() => S.zoomStep(-1)}>{BI.minus}</Bt>
      <Box position="relative">
        <Btn type="button" title="Zoom level" aria-expanded={open} onClick={() => setOpen(!open)} w="56px" h="36px" p="0" rounded="lg" border="0" fontSize="sm" fontWeight="600" cursor="pointer" {...(open ? T.active : { bg: 'transparent', ...T.hover, ...T.text })}>{pct}%</Btn>
        {open && <>
          <Scrim onClose={() => setOpen(false)} />
          <Box position="absolute" bottom="44px" left="-60px" z="90" w="190px" max-h="60vh" overflow-y="auto" p="6px" {...T.glassPop}>
            {items.map(([l, ic, f]) => <Row2 key={l} label={l} icon={ic ? <ToolIcon n={ic} size={18} /> : undefined} onClick={() => { setOpen(false); f(); }} />)}
          </Box>
        </>}
      </Box>
      <Bt t="Zoom in (Ctrl++)" on={() => S.zoomStep(1)}>{BI.plus}</Bt>
      <Box w="1px" h="20px" mx="1" shrink="0" {...T.divider} />
      <Bt t="Fit page (Ctrl+0)" on={() => S.fit('page')}>{BI.fit}</Bt>
      <Bt t="Actual size (Ctrl+1)" on={() => S.fit('actual')}><ToolIcon n="actual" size={20} /></Bt>
      <Box w="1px" h="20px" mx="1" shrink="0" {...T.divider} />
      <Bt t="Hide zoom controls" on={() => { setOpen(false); S.setZoomDock(false); }}><ToolIcon n="close" size={18} /></Bt>
    </Box>
  );
}
