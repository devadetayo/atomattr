import { useState } from 'react';
import { Box, Btn, Row } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { IconBtn } from './ui';
import { T } from '../theme';

const ZOOMS = [10, 25, 50, 75, 100, 150, 200, 400, 800];

/** Floating zoom pill at the bottom of the workspace. Everything else lives in the header and the tool rail. */
export function ViewBar() {
  const s = useStudio(); const [zoomOpen, setZoomOpen] = useState(false);
  return (
    <Box position="absolute" left="50%" bottom="10px" transform="translateX(-50%)" z="42" {...T.panel} rounded="lg" display="flex" items="center" gap="1" px="2" h="40px" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      <IconBtn icon="minus" title="Zoom out" size={28} onClick={() => S.zoomStep(-1)} />
      <Box position="relative">
        <Btn type="button" title="Zoom level" onClick={() => setZoomOpen(!zoomOpen)} w="52px" h="28px" border="0" rounded="lg" bg="transparent" {...T.hover} {...T.text} fontSize="sm" fontWeight="600" cursor="pointer">{Math.round(s.view.zoom * 100)}%</Btn>
        {zoomOpen && <Box position="absolute" left="50%" bottom="34px" transform="translateX(-50%)" z="90" {...T.panel} p="1" w="150px" onPointerLeave={() => setZoomOpen(false)}>
          {([['Fit page', () => S.fit('page')], ['Fit width', () => S.fit('width')], ['Selection', () => S.fit('selection')], ...ZOOMS.map(z => [`${z}%`, () => S.zoomTo(z / 100)])] as [string, () => void][]).map(([l, f]) => <Row key={l} h="26px" px="2" items="center" rounded="lg" cursor="pointer" fontSize="sm" {...T.hover} onClick={() => { f(); setZoomOpen(false); }}>{l}</Row>)}
        </Box>}
      </Box>
      <IconBtn icon="plus" title="Zoom in" size={28} onClick={() => S.zoomStep(1)} />
      <IconBtn icon="fit" title="Fit page (Ctrl+0)" size={28} onClick={() => S.fit('page')} />
    </Box>
  );
}