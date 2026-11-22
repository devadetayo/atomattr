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
export function ToolPalette({ area }: { area: { w: number; h: number } }) {
  const s = useStudio(); const pos = s.layout.tools; const [fly, setFly] = useState<number | null>(null); const [last, setLast] = useState<Record<number, Tool>>({});
  const start = useRef(pos); const grip = useDrag((dx, dy) => S.setToolsPos(Math.max(0, Math.min(area.w - 60, start.current.x + dx)), Math.max(0, Math.min(area.h - 120, start.current.y + dy))));
  return (
    <Box position="absolute" left={`${pos.x}px`} top={`${pos.y}px`} z="40" {...T.panel} p="1" display="flex" flex-col gap="1" w="44px" role="toolbar" aria-label="Tools">
      <Box h="14px" display="flex" items="center" justify="center" cursor="move" {...T.muted} title="Drag to move the tool palette" onPointerDown={(e: React.PointerEvent) => { start.current = S.getState().layout.tools; grip(e); }}><Ic n="grip" size={14} /></Box>
      {GROUPS.map((g, i) => {
        const cur = g.find(t => t.id === s.tool) || g.find(t => t.id === last[i]) || g[0]; const active = g.some(t => t.id === s.tool);
        return (
          <Box key={i} position="relative">
            <IconBtn icon={cur.icon} title={`${cur.name} (${cur.key})`} active={active} size={36} iconSize={18} onClick={() => { setLast({ ...last, [i]: cur.id }); S.setTool(cur.id); setFly(null); }} onContextMenu={(e: React.MouseEvent) => { e.preventDefault(); g.length > 1 && setFly(fly === i ? null : i); }} />
            {g.length > 1 && <Box position="absolute" right="0" bottom="0" w="12px" h="12px" cursor="pointer" {...T.muted} display="flex" items="center" justify="center" title="More tools" onClick={() => setFly(fly === i ? null : i)}><Ic n="chevR" size={9} /></Box>}
            {fly === i && <Box position="absolute" left="46px" top="0" z="50" {...T.panel} p="1" w="210px" onPointerLeave={() => setFly(null)}>{g.map(t => <Row key={t.id} items="center" gap="2" h="30px" px="2" rounded="md" cursor="pointer" {...(s.tool === t.id ? T.active : T.hover)} onClick={() => { setLast({ ...last, [i]: t.id }); S.setTool(t.id); setFly(null); }}><Ic n={t.icon} size={15} /><Txt fontSize="12px" m="0" flex="1">{t.name}</Txt><Kbd>{t.key}</Kbd></Row>)}</Box>}
          </Box>
        );
      })}
    </Box>
  );
}

