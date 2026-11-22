import { useState } from 'react';
import { Box, Btn, H1, Input, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { listRecents, deleteProject, parseProjectFile } from '../state/storage';
import { PRESETS, type PresetId } from '../document/factory';
import { pickFile } from '../state/assets';
import { T } from '../theme';
import { Ic } from './Icons';
import { IconBtn, Label } from './ui';

export function NewProjectModal() {
  const [kind, setKind] = useState<'website' | 'page'>('website'); const [name, setName] = useState(''); const [preset, setPreset] = useState<PresetId>('landing');
  const [tablet, setTablet] = useState(true); const [mobile, setMobile] = useState(true); const [auto, setAuto] = useState(true);
  const create = () => S.createProject(name, kind, preset, { tablet, mobile, autoStack: auto });
  const Card = ({ k, icon, title, hint }: { k: 'website' | 'page'; icon: string; title: string; hint: string }) => (
    <Btn type="button" onClick={() => setKind(k)} flex="1" p="3" text-align="left" cursor="pointer" rounded="lg" border="2px solid" {...(kind === k ? { 'border-color': 'primary', bg: 'primary/10', 'dark-bg': 'gray-800' } : { 'border-color': 'gray-200', 'dark-border-color': 'gray-700', bg: 'transparent' })} {...T.text}><Ic n={icon} size={22} /><Txt fontSize="14px" fontWeight="700" m="0" mt="1">{title}</Txt><Txt fontSize="11px" m="0" {...T.muted}>{hint}</Txt></Btn>);
  const Check = ({ v, on, label }: { v: boolean; on: (b: boolean) => void; label: string }) => <Row as="label" items="center" gap="2" fontSize="12px" cursor="pointer"><Box as="input" type="checkbox" checked={v} onChange={(e: any) => on(e.target.checked)} />{label}</Row>;
  return (
    <Box position="fixed" top="0" left="0" w="100%" h="100%" z="100" display="flex" items="center" justify="center" bg="black/50" onPointerDown={() => S.setState({ modal: null })}>
      <Box role="dialog" aria-label="New project" w="min(560px, 94vw)" p="5" {...T.panel} display="flex" flex-col gap="3" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
        <Txt fontSize="18px" fontWeight="700" m="0">New project</Txt>
        <Row gap="2"><Card k="website" icon="layers" title="Website" hint="Several pages, shared assets and export." /><Card k="page" icon="file" title="Page" hint="One page. Exported as a one-page website." /></Row>
        <Box><Label>Name</Label><Input type="text" value={name} placeholder="Untitled" autoFocus onChange={(e: any) => setName(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && create()} w="100%" h="34px" px="3" mt="1" fontSize="13px" {...T.field} /></Box>
        <Box><Label>Start from</Label><Box display="grid" grid-cols="2" gap="2" mt="1">{PRESETS.map(p => <Btn key={p.id} type="button" onClick={() => setPreset(p.id)} p="2" text-align="left" cursor="pointer" rounded="md" border="1px solid" {...(preset === p.id ? { 'border-color': 'primary', bg: 'primary/10', 'dark-bg': 'gray-800' } : { 'border-color': 'gray-200', 'dark-border-color': 'gray-700', bg: 'transparent' })} {...T.text}><Txt fontSize="12px" fontWeight="600" m="0">{p.name}</Txt><Txt fontSize="11px" m="0" {...T.muted}>{p.blurb}</Txt></Btn>)}</Box></Box>
        <Box><Label>Responsive</Label><Box display="flex" flex-col gap="1" mt="1"><Check v={tablet} on={setTablet} label="Tablet layout (768px)" /><Check v={mobile} on={setMobile} label="Mobile layout (390px)" /><Check v={auto} on={setAuto} label="Stack free-positioned sections automatically on small screens" /></Box></Box>
        <Row justify="end" gap="2"><Btn type="button" onClick={() => S.setState({ modal: null })} h="34px" px="4" {...T.card} cursor="pointer">Cancel</Btn><Btn type="button" onClick={create} h="34px" px="4" rounded="md" border="0" bg="primary" text="white" fontWeight="600" cursor="pointer">Create</Btn></Row>
      </Box>
    </Box>
  );
}

export function Welcome() {
  const s = useStudio(); const [tick, setTick] = useState(0); const recents = listRecents(); void tick;
  const open = async () => { const f = await pickFile('.json,application/json'); if (!f) return; const p = parseProjectFile(await f.text()); if (!p) { S.toast('That file is not an AtomAttr Studio project.', 'error'); return; } S.openProject(p); };
  return (
    <Box w="100%" h="100%" overflow="auto" bg="#fff" dark-bg="grey-950">
      <Box w="full" mx="auto" px="5" py="6" display="flex" flex-col gap="5">
        <Row items="center" justify="between"><Row items="center" gap="3"><Box w="40px" h="40px" rounded="lg" bg="primary" text="white" display="flex" items="center" justify="center"><Ic n="shapes" size={22} /></Box><Box><H1 fontSize="22px" m="0">AtomAttr Studio</H1><Txt fontSize="12px" m="0" {...T.muted}>Design websites visually. Export attribute-driven code.</Txt></Box></Row>
          <IconBtn icon={s.theme === 'dark' ? 'sun' : 'moon'} title="Toggle light / dark" onClick={S.toggleTheme} size={34} iconSize={18} /></Row>
        <Row gap="3"><Btn type="button" onClick={() => S.setState({ modal: 'new' })} h="40px" px="5" rounded="lg" border="0" bg="primary" text="white" fontWeight="600" cursor="pointer"><Row items="center" gap="2"><Ic n="plus" size={16} />New project</Row></Btn>
          <Btn type="button" onClick={open} h="40px" px="5" {...T.card} fontWeight="600" cursor="pointer"><Row items="center" gap="2"><Ic n="folder" size={16} />Open project file</Row></Btn></Row>
        <Box><Txt fontSize="14px" fontWeight="700" m="0" mb="2">Recent projects</Txt>
          {!recents.length ? <Box {...T.card} p="5" text-align="center"><Txt fontSize="13px" m="0" {...T.muted}>No saved projects yet. Projects you create are saved in this browser and appear here.</Txt></Box>
            : <Box display="grid" grid-cols="2" md-grid-cols="3" gap="3">{recents.map(r => <Box key={r.id} {...T.card} overflow="hidden" cursor="pointer" onClick={() => S.openSaved(r.id)}>
              <Box h="120px" bg="white" overflow="hidden">{r.thumb ? <Box as="img" src={r.thumb} alt="" w="100%" h="100%" object-fit="cover" /> : null}</Box>
              <Row items="center" justify="between" p="2"><Box min-w="0"><Txt fontSize="13px" fontWeight="600" m="0" truncate>{r.name}</Txt><Txt fontSize="11px" m="0" {...T.muted}>{r.kind === 'website' ? 'Website' : 'Page'} · {r.pages} page{r.pages > 1 ? 's' : ''} · {new Date(r.updatedAt).toLocaleDateString()}</Txt></Box>
                <IconBtn icon="trash" title="Delete project" danger size={26} onClick={(e) => { e.stopPropagation(); if (confirm(`Delete “${r.name}”? This cannot be undone.`)) { deleteProject(r.id); setTick(t => t + 1); } }} /></Row></Box>)}</Box>}</Box>
        <Box><Txt fontSize="14px" fontWeight="700" m="0" mb="2">Templates <Txt as="span" fontSize="11px" {...T.muted}>bundled starters, not your work</Txt></Txt>
          <Box display="grid" grid-cols="2" md-grid-cols="4" gap="3">{PRESETS.map(p => <Btn key={p.id} type="button" onClick={() => S.createProject('', 'website', p.id)} p="3" text-align="left" cursor="pointer" {...T.card} {...T.text}><Txt fontSize="13px" fontWeight="600" m="0">{p.name}</Txt><Txt fontSize="11px" m="0" {...T.muted}>{p.blurb}</Txt></Btn>)}</Box></Box>
      </Box>
    </Box>
  );
}
