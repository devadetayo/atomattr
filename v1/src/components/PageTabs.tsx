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
/* ---------- page band (bottom-bound) ---------- */
export function PageBand() {
  const s = useStudio(); const p = s.project!; const open = s.layout.band.open; const [rename, setRename] = useState<string | null>(null);
  const status = `${BP_LABEL[s.bp]} ${Math.round(s.view.zoom * 100)}% · ${s.sel.length ? `${s.sel.length} selected` : 'nothing selected'} · ${S.page(s).name}`;
  return (
    <Box flex="none" {...T.chrome} border-t="1px solid" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      {open && <Row items="center" gap="2" h="84px" px="3" overflow="auto">
        {p.pages.map((pg, i) => <Box key={pg.id} flex="none" w="88px" cursor="pointer" draggable onDragStart={(e: React.DragEvent) => e.dataTransfer.setData('application/x-aa-page', pg.id)} onDragOver={(e: React.DragEvent) => e.preventDefault()} onDrop={(e: React.DragEvent) => { const id = e.dataTransfer.getData('application/x-aa-page'); if (id) S.movePage(id, i); }} onClick={() => S.switchPage(pg.id)} onDoubleClick={() => setRename(pg.id)}>
          <Box h="48px" bg="white" overflow="hidden" rounded="sm" border={pg.id === p.activePageId ? '2px solid primary' : '1px solid gray-300'} dark-border-color={pg.id === p.activePageId ? 'primary' : 'gray-600'}><Box as="img" alt="" src={`data:image/svg+xml;utf8,${encodeURIComponent(thumbSvg(pg.root))}`} w="100%" h="100%" object-fit="cover" draggable={false} /></Box>
          {rename === pg.id ? <Box as="input" autoFocus defaultValue={pg.name} w="100%" h="18px" fontSize="11px" {...T.field} onBlur={(e: any) => { S.renamePage(pg.id, e.target.value); setRename(null); }} onKeyDown={(e: any) => { if (e.key === 'Enter') e.target.blur(); e.stopPropagation(); }} /> : <Txt fontSize="11px" m="0" mt="1" fontWeight={pg.id === p.activePageId ? '700' : '400'} truncate>{pg.name}</Txt>}
        </Box>)}
        <Row gap="0" flex="none"><IconBtn icon="plus" title={p.kind === 'page' ? 'Single-page project' : 'Add page'} disabled={p.kind === 'page'} onClick={() => S.addPage()} /><IconBtn icon="copy" title="Duplicate page" disabled={p.kind === 'page'} onClick={() => S.duplicatePage(p.activePageId)} /><IconBtn icon="trash" title="Delete page" danger disabled={p.pages.length < 2} onClick={() => confirm('Delete this page?') && S.deletePage(p.activePageId)} /></Row>
      </Row>}
      <Row items="center" h="24px" px="3" gap="3" border-t={open ? '1px solid' : '0'} border-color="gray-200" dark-border-color="gray-800">
        <IconBtn icon={open ? 'chevD' : 'chevU'} title={open ? 'Collapse page band' : 'Expand page band'} size={20} iconSize={12} onClick={() => S.setBand(!open)} />
        <Txt fontSize="11px" m="0" {...T.muted}>{status}</Txt><Box flex="1" /><Txt fontSize="11px" m="0" {...T.muted}>{p.kind === 'page' ? 'Page project (exports as a one-page site)' : `${p.pages.length} page${p.pages.length > 1 ? 's' : ''}`}</Txt>
      </Row>
    </Box>
  );
}

