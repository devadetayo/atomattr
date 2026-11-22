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
import { SyntaxCode } from './SyntaxCode';
import { download } from '../exporters/zip';
import { thumbSvg } from '../document/thumb';
import { pickFile } from '../state/assets';
import { parseProjectFile, listRecents } from '../state/storage';
import { makeSection, makeText, makeHeading, makeButton } from '../document/factory';
import { GROUPS, ALL_TOOLS, KEYMAP, useDrag } from './tools';
/* ---------- code split ---------- */
/** Code panel width: about 42% of the editor width until the user resizes it (600 was the old fixed default). */
export const codeWidth = (c: { w: number }, areaW: number) => { const auto = !(c.w > 0) || c.w === 600; return Math.round(Math.min(Math.max(320, auto ? areaW * 0.42 : c.w), Math.max(320, areaW * 0.7))); };
export function CodeSplit({ areaW }: { areaW: number }) {
  const s = useStudio(); const c = s.layout.code; const width = codeWidth(c, areaW); const out = generate(s.project!, c.target); const w0 = useRef(c.w); const xy0=useRef({x:c.x,y:c.y}); const editable=c.target==='HTML'||c.target==='React';
  const [editing,setEditing]=useState(false);const [draft,setDraft]=useState(out.code);
  useEffect(()=>{setEditing(false);setDraft(generate(s.project!,c.target).code);},[c.target,s.project]);
  const resize = useDrag((dx) => S.setCode({ w: Math.round(Math.max(320, Math.min(areaW * 0.7, w0.current - dx))) }), () => { if(c.pinned)S.fit('page'); });
  const move = useDrag((dx,dy) => S.setCode({x:Math.max(0,xy0.current.x-dx),y:Math.max(0,xy0.current.y+dy)}));
  const float = !c.pinned;
  if(c.collapsed){
    if(c.pinned)return <Box flex="none" w="36px" h="100%" {...T.chrome} border-l="1px solid" display="flex" justify="center" pt="1"><IconBtn icon="code" title="Expand code panel" onClick={()=>S.setCode({collapsed:false})}/></Box>;
    return <Row position="absolute" top={`${c.y}px`} right={`${c.x}px`} z="45" w="260px" h="36px" items="center" gap="1" px="2" {...T.panel} shadow="xl" rounded="md"><Box flex="1" cursor="move" onPointerDown={(e:React.PointerEvent)=>{xy0.current={x:c.x,y:c.y};move(e);}}><Txt fontSize="12px" m="0" fontWeight="700">AtomAttr code</Txt></Box><IconBtn icon="pin" title="Pin code panel to the right" size={23} onClick={()=>S.setCode({pinned:true,collapsed:false})}/><IconBtn icon="chevD" title="Expand code panel" size={23} onClick={()=>S.setCode({collapsed:false})}/><IconBtn icon="x" title="Close code panel" size={23} onClick={()=>S.toggleCode()}/></Row>;
  }
  return (
    <Row h={float?"calc(100% - 24px)":"100%"} max-h="100%" flex="none" w={`${width}px`} {...T.chrome} border-l="1px solid" position={float?'absolute':'relative'} top={float?`${c.y}px`:undefined} right={float?`${c.x}px`:undefined} z={float?"45":undefined} shadow={float?'xl':undefined}>
      <Box position="absolute" left="-3px" top="0" w="6px" h="100%" cursor="col-resize" z="5" bg="transparent" hover-bg="primary" title="Drag to resize" onPointerDown={(e: React.PointerEvent) => { w0.current = width; resize(e); }} />
      <Box display="flex" flex-col w="100%" min-w="0">
        <Row items="center" gap="1" h="36px" px="2" overflow="auto" flex="none" border-b="1px solid" border-color="gray-200" dark-border-color="gray-800">
          <Box flex="none" cursor={float?'move':'default'} onPointerDown={float?(e:React.PointerEvent)=>{xy0.current={x:c.x,y:c.y};move(e);}:undefined}><Txt fontSize="11px" m="0" fontWeight="700">Code</Txt></Box>
          {TARGETS.map(t => <Btn key={t} type="button" onClick={() => S.setCode({ target: t })} h="24px" px="2" border="0" rounded="md" fontSize="11px" fontWeight="600" cursor="pointer" whitespace="nowrap" {...(c.target === t ? T.active : { bg: 'transparent', ...T.hover, ...T.muted })}>{TARGET_LABEL[t]}</Btn>)}
          <Box flex="1" />{editable&&<Btn type="button" onClick={()=>{if(editing){setDraft(out.code);setEditing(false);}else{setDraft(out.code);setEditing(true);}}} h="24px" px="2" border="0" rounded="md" fontSize="11px" cursor="pointer" {...(editing?T.active:T.card)}>{editing?'Cancel edit':'Edit code'}</Btn>}{editing&&<Btn type="button" onClick={()=>{if(S.applyCodeToCanvas(draft))setEditing(false);}} h="24px" px="2" border="0" rounded="md" bg="primary" text="white" fontSize="11px" cursor="pointer">Apply to canvas</Btn>}
          <IconBtn icon="copy" title="Copy code" size={24} onClick={() => { void navigator.clipboard.writeText(editing?draft:out.code); S.toast('Copied'); }} /><IconBtn icon="download" title={`Download ${out.file}`} size={24} onClick={() => download(new Blob([editing?draft:out.code]), out.file)} /><IconBtn icon="pin" title={c.pinned?'Unpin as floating panel':'Pin to the right edge'} active={c.pinned} size={23} onClick={()=>S.setCode({pinned:!c.pinned})}/><IconBtn icon="collapse" title="Collapse code panel" size={23} onClick={()=>S.setCode({collapsed:true})}/><IconBtn icon="x" title="Close code panel" size={23} onClick={() => S.toggleCode()} />
        </Row>
        {out.note && <Txt fontSize="11px" m="0" px="3" py="1" bg="warning/10" {...T.muted}>{out.note}</Txt>}
        {editing?<Box as="textarea" value={draft} onChange={(e:any)=>setDraft(e.target.value)} spellCheck={false} flex="1" m="0" p="3" overflow="auto" fontSize="12px" leading="normal" font-mono {...T.text} bg="gray-50" dark-bg="gray-950" whitespace="pre" aria-label={`${c.target} editable code`}/>:<SyntaxCode code={out.code}/>}
        <Txt fontSize="10px" m="0" px="3" py="1" {...T.muted}>{editing?'Changes apply to the current page and can be undone. Unknown attributes are preserved.':'Read-only. Edit HTML (AtomAttr) or React to apply code to the canvas.'}</Txt>
      </Box>
    </Row>
  );
}

