import { useEffect, useRef, useState } from 'react';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio, type Tool } from '../state/store';
import { DOCKERS, winBox, type DockerId, type Win } from '../state/layout';
import { BPS, BP_LABEL } from '../document/style';
import { keys } from '../canvas/keys';
import { PANELS, exportZip, downloadProject } from '../panels/Panels';
import { Welcome, NewProjectModal } from './Welcome';
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
/* ---------- colour palette ---------- */
export function ColourPalette() {
  const s = useStudio(); const pal = s.layout.palette; const sel = S.selNodes(s); const target = s.paint.target; const [hex, setHex] = useState('');
  const apply = (c: string) => { S.pushRecentColor(c); if (sel.length) S.patchNodes(s.sel, target === 'fill' ? { fill: c } : { stroke: c, strokeWidth: sel[0].style.strokeWidth || 2 }); else S.toast('Select an object to colour it.'); };
  const cur = sel[0]?.style[target === 'fill' ? 'fill' : 'stroke'];
  if (!pal.visible) return <IconBtn icon="palette" title="Show colour palette" position="absolute" left="50%" bottom="8px" z="40" {...T.panel} onClick={() => S.setPalette({ visible: true })} size={32} />;
  return (
    <Box position="absolute" left="50%" bottom="8px" z="40" {...T.panel} px="2" py="1" max-w="92%" ml="0" transform="translateX(-50%)">
      <Row items="center" gap="2">
        <Box position="relative" w="34px" h="30px" flex="none" title="Fill / stroke. Click to switch.">
          <Box position="absolute" left="0" top="0" w="20px" h="20px" rounded="sm" border={target === 'fill' ? '2px solid primary' : '1px solid gray-400'} bg={sel[0]?.style.fill || 'transparent'} cursor="pointer" onClick={() => S.setState({ paint: { target: 'fill' } })} z={target === 'fill' ? '2' : '1'} />
          <Box position="absolute" left="10px" top="8px" w="20px" h="20px" rounded="sm" border={target === 'stroke' ? '3px solid' : '3px solid'} border-color={sel[0]?.style.stroke || 'gray-400'} bg="transparent" cursor="pointer" onClick={() => S.setState({ paint: { target: 'stroke' } })} z={target === 'stroke' ? '2' : '1'} />
        </Box>
        <Row gap="1" overflow="auto" max-w="440px">{[...SWATCHES, ...s.project!.colors].map(c => <Box key={c} w="20px" h="20px" flex="none" rounded="sm" border="1px solid gray-300" dark-border-color="gray-600" cursor="pointer" bg={c} title={c} onClick={() => apply(c)} />)}</Row>
        {s.recentColors.length > 0 && <Row gap="1" pl="2" border-l="1px solid" border-color="gray-300" dark-border-color="gray-600" title="Recent">{s.recentColors.slice(0, 6).map(c => <Box key={c} w="16px" h="16px" rounded="full" cursor="pointer" bg={c} border="1px solid gray-300" onClick={() => apply(c)} />)}</Row>}
        <Input type="text" value={hex} placeholder={cur || '#hex'} aria-label="Hex colour" onChange={(e: any) => setHex(e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter' && /^#?[0-9a-f]{3,8}$/i.test(hex)) { apply(hex.startsWith('#') ? hex : `#${hex}`); setHex(''); } e.stopPropagation(); }} w="76px" h="26px" px="2" fontSize="11px" {...T.field} />
        <IconBtn icon="eyedropper" title="Eyedropper" size={26} onClick={() => S.setTool('eyedropper')} /><IconBtn icon="x" title="Hide palette" size={26} onClick={() => S.setPalette({ visible: false })} />
      </Row>
    </Box>
  );
}

