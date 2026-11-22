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
/* ---------- modals ---------- */
export function Modals() {
  const s = useStudio(); const [name, setName] = useState(s.project?.name || '');
  if (s.modal === 'new') return <NewProjectModal />;
  const Shell = ({ title, children }: { title: string; children: React.ReactNode }) => <Box position="fixed" top="0" left="0" w="100%" h="100%" z="100" display="flex" items="center" justify="center" bg="black/50" onPointerDown={() => S.setState({ modal: null })}><Box {...T.panel} p="5" w="min(480px, 94vw)" max-h="80vh" overflow="auto" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}><Row justify="between" items="center" mb="3"><Txt fontSize="16px" fontWeight="700" m="0">{title}</Txt><IconBtn icon="x" title="Close" onClick={() => S.setState({ modal: null })} /></Row>{children}</Box></Box>;
  if (s.modal === 'rename') return <Shell title="Rename project"><Input type="text" value={name} autoFocus onChange={(e: any) => setName(e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter') { S.renameProject(name); S.setState({ modal: null }); } e.stopPropagation(); }} w="100%" h="34px" px="3" {...T.field} /><Row justify="end" mt="3"><Btn type="button" onClick={() => { S.renameProject(name); S.setState({ modal: null }); }} h="32px" px="4" rounded="md" border="0" bg="primary" text="white" cursor="pointer">Rename</Btn></Row></Shell>;
  if (s.modal === 'about') return <Shell title="AtomAttr Studio"><Txt fontSize="13px" m="0" {...T.muted}>A visual website builder with vector tools. The interface is styled entirely with AtomAttr attributes. Projects are saved in this browser; export gives you a ZIP with a plain HTML/CSS site and the AtomAttr markup.</Txt></Shell>;
  if (s.modal === 'shortcuts') return <Shell title="Keyboard shortcuts"><Box display="grid" grid-cols="2" gap="1">{[...ALL_TOOLS.map(t => [t.name, t.key]), ['Undo', 'Ctrl+Z'], ['Redo', 'Ctrl+Shift+Z'], ['Group', 'Ctrl+G'], ['Ungroup', 'Ctrl+Shift+G'], ['Duplicate', 'Ctrl+D'], ['Delete', 'Del'], ['Nudge', 'Arrows (Shift ×10)'], ['Pan', 'Space + drag'], ['Zoom', 'Ctrl + wheel / pinch'], ['Fit page', 'Ctrl+0'], ['Preview', 'Ctrl+P'], ['Code panel', 'Ctrl+E']].map(([a, b]) => <Row key={a} justify="between" gap="2" py="1"><Txt fontSize="12px" m="0">{a}</Txt><Kbd>{b}</Kbd></Row>)}</Box></Shell>;
  return null;
}

