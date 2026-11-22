import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { listRecents, parseProjectFile } from '../state/storage';
import { openProjectFromDisk } from '../state/project-file';
import { PRESETS, newProject, type PresetId } from '../document/factory';
import { buildGen } from '../document/gen';
import { RenderTree } from '../canvas/Render';
import { pickFile } from '../state/assets';
import { T } from '../theme';
import { ToolIcon } from './ToolIcons';
import { Checkbox, IconBtn, Logo } from './ui';
import { deleteProjectWithConfirm } from '../state/confirm';

type Kind = 'website' | 'page';

const KINDS: { k: Kind; icon: string; title: string; hint: string }[] = [
  { k: 'website', icon: 'layers', title: 'Website', hint: 'Several pages, shared assets and export' },
  { k: 'page', icon: 'file', title: 'Page', hint: 'One page, exported as a one-page site' },
];

/* ------------------------------------------------------------------ */
/* shared pieces — module level so they never remount between renders  */
/* ------------------------------------------------------------------ */

const bar = { rounded: 'sm', bg: 'gray-300', 'dark-bg': 'gray-600' };

/** Tiny wireframe used as a stand-in preview; cycles through four layouts. */
function Wire({ v }: { v: number }) {
  switch (v % 4) {
    case 0:
      return (
        <Box w="100%" py="3" display="flex" items="center" justify="center" text="gray-400">
          <ToolIcon n="plus" size={60} />
        </Box>
      );
    case 1:
      return (
        <Box w="100%" p="3" display="flex" gap="2" items="center" justify="center">
          <ToolIcon n="panel" size={60} />
        </Box>
      );
    case 2:
      return (
        <Box w="100%" p="3" display="flex" flex-col items="center" justify="center" gap="2">
          <ToolIcon n="layers" size={60} />
        </Box>
      );
    default:
      return (
        <Box w="100%" p="3" display="flex" flex-col items="center" justify="center" gap="2">
          <ToolIcon n="grid" size={60} />
        </Box>
      );
  }
}

function Check({ v, on, label }: { v: boolean; on: (b: boolean) => void; label: string }) {
  return <Checkbox checked={v} onChange={on} label={label} />;
}

const Rule = () => <Box h="1px" w="100%" shrink="0" {...T.divider} />;

/** Section heading, used above every card grid. */
function SectionTitle({ id, children }: { id: string; children: any }) {
  return <Txt as="h3" id={id} fontSize="sm" fontWeight="700" m="0" mb="3" {...T.text}>{children}</Txt>;
}

/**
 * Card: icon/preview and label stacked in one rounded box, inset from the edges.
 * Pass `selected` for a radio-style pick card; omit it for a plain action card.
 */
/** Live miniature of a starting template: the real page, rendered at 1440px and scaled to the card. */
function TemplateThumb({ id }: { id: PresetId }) {
  const box = useRef<HTMLDivElement | null>(null); const [k, setK] = useState(0.2);
  const built = useMemo(() => {
    try { const p = newProject('', 'website', id); return { gen: buildGen(p.pages[0].root, 'desktop', 'editor', [], null, null, p as any) }; } catch { return null; }
  }, [id]);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const fit = () => setK(el.clientWidth / 1440); fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, []);
  return (
    <Box ref={box} position="relative" w="100%" h="150px" overflow="hidden" rounded="8px" bg="gray-900/6" dark-bg="white/8" aria-hidden="true">
      {built && <Box position="absolute" left="0" top="0" w="1440px" pointer-events="none" transform-origin="top left" transform={`scale(${k})`}>
        <RenderTree g={built.gen} editId={null} interactive={false} register={false} onCommit={() => {}} onCancel={() => {}} />
      </Box>}
    </Box>
  );
}

function PickCard({ selected, onClick, label, hint, children }: { selected?: boolean; onClick: () => void; label: string; hint?: string; children: any }) {
  const isRadio = selected !== undefined;
  return (
    <Btn
      type="button" onClick={onClick}
      {...(isRadio ? { role: 'radio', 'aria-checked': selected } : {})}
      position="relative" w="full" p="3" display="flex" flex-col items="stretch" gap="3" text-align="left" cursor="pointer" overflow="hidden"
      {...T.tile} {...(selected ? T.tileOn : {})} {...T.text}
    >
      <Box w="100%" display="flex" items="center" justify="center" text="gray-500" dark-text="gray-400" min-h="64px">{children}</Box>
      <Box w="100%" display="flex" flex-col gap="1px" min-w="0">
        <Txt as="span" display="block" fontSize="sm" fontWeight="600" m="0" w="100%" truncate {...T.text}>{label}</Txt>
        {hint && <Txt as="span" display="block" fontSize="xs" m="0" w="100%" truncate {...T.muted}>{hint}</Txt>}
      </Box>
      {selected && <Box position="absolute" top="2" right="2" w="22px" h="22px" rounded="full" display="flex" items="center" justify="center" bg="primary" text="white" shadow="0 2px 8px color-mix(in srgb, var(--primary) 50%, transparent)" aria-hidden="true"><ToolIcon n="check" size={13} /></Box>}
    </Btn>
  );
}

const grid = { display: 'grid', 'grid-cols': '2', 'sm-grid-cols': '3', gap: '4' };

/* ------------------------------------------------------------------ */
/* New project modal                                                   */
/* ------------------------------------------------------------------ */

export function NewProjectModal() {
  const [kind, setKind] = useState<Kind>('website');
  const [name, setName] = useState('');
  const [preset, setPreset] = useState<PresetId>('finance');
  const [tablet, setTablet] = useState(true);
  const [mobile, setMobile] = useState(true);
  const [auto, setAuto] = useState(true);

  const close = () => S.setState({ modal: null });
  const create = () => S.createProject(name.trim(), kind, preset, { tablet, mobile, autoStack: auto });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') S.setState({ modal: null }); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Box position="fixed" top="0" left="0" w="100%" h="100%" z="100" display="flex" items="center" justify="center" p="3" {...T.overlay} animate="studio-fade 140ms ease-out both" onPointerDown={close}>
      <Box
        role="dialog" aria-modal="true" aria-label="New project"
        w="min(800px, 100%)" h="min(595px, 100%)"
        display="flex" flex-col overflow="hidden" {...T.dialog} animate="studio-pop 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both"
        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
      >
        {/* title bar */}
        <Row items="center" h="44px" shrink="0" px="4" gap="2">
          <Txt fontSize="lg" fontWeight="700" m="0" flex="1" truncate {...T.text}>New project</Txt>
          <Btn type="button" title="Close (Esc)" aria-label="Close" onClick={close} w="28px" h="28px" p="0" display="flex" items="center" justify="center" rounded="lg" border="0" cursor="pointer" shrink="0" bg="transparent" {...T.hover} {...T.text} dark-text="#fff"><ToolIcon n="close" size={18} /></Btn>
        </Row>
        <Rule />

        {/* content: single column, no sidebar */}
        <Box flex="1" min-h="0" overflow="auto" px="6" py="5" display="flex" flex-col gap="6">
          <Box as="section" aria-labelledby="type-h">
            <SectionTitle id="type-h">Project type</SectionTitle>
            <Box role="radiogroup" aria-label="Project type" {...grid}>
              {KINDS.map(o => (
                <PickCard key={o.k} selected={kind === o.k} onClick={() => setKind(o.k)} label={o.title} hint={o.hint}>
                  <ToolIcon n={o.icon} size={60} />
                </PickCard>
              ))}
            </Box>
          </Box>

          <Box as="section" aria-labelledby="start-h">
            <SectionTitle id="start-h">Starting point</SectionTitle>
            <Box role="radiogroup" aria-label="Starting point" {...grid}>
              {PRESETS.map((p, i) => (
                <PickCard key={p.id} selected={preset === p.id} onClick={() => setPreset(p.id)} label={p.name} hint={p.blurb}>
                  <TemplateThumb id={p.id} />
                </PickCard>
              ))}
            </Box>
          </Box>

          <Box as="section" aria-labelledby="resp-h">
            <SectionTitle id="resp-h">Responsive</SectionTitle>
            <Row gap="5" wrap="wrap" items="center">
              <Check v={tablet} on={setTablet} label="Tablet layout (768px)" />
              <Check v={mobile} on={setMobile} label="Mobile layout (390px)" />
              <Check v={auto} on={setAuto} label="Stack free-positioned sections on small screens" />
            </Row>
          </Box>
        </Box>

        {/* footer */}
        <Rule />
        <Row items="center" justify="between" gap="3" px="4" h="60px" shrink="0">
          <Row items="center" gap="2" min-w="0">
            <Txt as="span" fontSize="sm" fontWeight="600" m="0" shrink="0" {...T.muted}>Name</Txt>
            <Input
              type="text" value={name} placeholder="Untitled" autoFocus aria-label="Project name"
              onChange={(e: any) => setName(e.target.value)}
              onKeyDown={(e: any) => { if (e.key === 'Enter') create(); e.stopPropagation(); }}
              w="min(240px, 36vw)" h="34px" px="3" fontSize="sm" {...T.field}
            />
          </Row>
          <Row gap="2" shrink="0">
            <Btn type="button" onClick={close} h="32px" px="4" fontSize="sm" {...T.card} {...T.hover} {...T.text} fontWeight="600" cursor="pointer">Cancel</Btn>
            <Btn type="button" onClick={create} h="32px" px="4" rounded="lg" border="0" bg="primary" text="white" fontSize="sm" fontWeight="600" cursor="pointer">Create project</Btn>
          </Row>
        </Row>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Welcome / home                                                      */
/* ------------------------------------------------------------------ */

function HomeNavItem({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <Btn
      type="button" onClick={onClick} aria-current={active ? 'page' : undefined}
      w="100%" h="36px" px="2" display="flex" items="center" gap="2" text-align="left" cursor="pointer" rounded="lg" border="0"
      {...(active ? T.active : { bg: 'transparent', ...T.hover, ...T.text })}
    >
      <ToolIcon n={icon} size={20} /><Txt fontSize="md" m="0" flex="1" truncate>{label}</Txt>
    </Btn>
  );
}

export function Welcome() {
  const s = useStudio();
  const [tick, setTick] = useState(0);
  const recents = listRecents(); void tick; void s.recentsTick;

  const newProject = () => S.setState({ modal: 'new' });
  const open = async () => {
    const p = await openProjectFromDisk();
    if (!p) { S.toast('That file is not an AtomAttr Studio project.', 'error'); return; }
    S.openImported(p);
  };
  const remove = (id: string, projectName: string) => {
    deleteProjectWithConfirm(id, projectName).then(done => { if (done) setTick(t => t + 1); });
  };
  const themeIcon = s.theme === 'dark' ? 'sun' : 'moon';
  
  return (
    <Box w="100%" h="100%" display="flex" flex-col {...T.app}>

      {/* top band: brand (+ quick actions on small screens) */}
      <Box as="header" py="3" px="5" display="flex" items="center" justify="between" shrink="0" {...T.chrome} border-b="1px solid">
        <Row items="center" gap="2">
          <Logo size={32} /><Txt fontSize="17px" fontWeight="700" m="0" whitespace="nowrap" {...T.text}>AtomAttr Studio</Txt>
        </Row>
        <Row items="center" gap="2">
          <Box display="block" md-display="none">
            <Btn type="button" onClick={newProject} h="32px" px="4" rounded="6px" border="0" bg="primary" text="white" fontSize="sm" fontWeight="600" cursor="pointer">New project</Btn>
          </Box>
          <IconBtn icon={themeIcon} title="Toggle light / dark" onClick={S.toggleTheme} size={32} iconSize={18} />
        </Row>
      </Box>

      <Box flex="1" min-h="0" display="flex">

        {/* sidebar: pill actions then nav */}
        <Box as="nav" aria-label="Main" w="240px" shrink="0" px="5" py="6" display="none" md-display="flex" flex-col gap="5" overflow="auto">
          <Box display="flex" flex-col items="start" gap="3">
            <Btn type="button" onClick={newProject} h="40px" px="6" rounded="6px" border="0" bg="primary" text="white" fontSize="sm" fontWeight="600" cursor="pointer" w="full">New project</Btn>
            <Btn type="button" onClick={open} h="40px" px="6" rounded="6px" border="1px solid" border-color="primary" bg="transparent" text="primary" fontSize="sm" fontWeight="600" cursor="pointer" w="full">Open</Btn>
          </Box>
          <Rule />
          <Box display="flex" flex-col gap="1">
            <HomeNavItem icon="home" label="Home" active />
          </Box>
        </Box>

        {/* main: section headings over card grids */}
        <Box as="main" flex="1" min-w="0" overflow="auto">
          <Box max-w="960px" mx="auto" px="6" py="6" display="flex" flex-col gap="6">

            <Box as="section" aria-labelledby="presets-h">
              <SectionTitle id="presets-h">Start a new website</SectionTitle>
              <Box {...grid}>
                {PRESETS.map((p, i) => (
                  <PickCard key={p.id} onClick={() => S.createProject('', 'website', p.id)} label={p.name}>
                    <TemplateThumb id={p.id} />
                  </PickCard>
                ))}
              </Box>
            </Box>

            <Box as="section" aria-labelledby="recent-h">
              <SectionTitle id="recent-h">Recent</SectionTitle>

              {recents.length ? (
                <Box w="full" gap="6" display="grid" grid-cols="3">
                  {recents.map(r => (
                    <Box key={r.id} position="relative">
                      <PickCard
                        onClick={() => S.openSaved(r.id)}
                        label={r.name}
                        hint={`${r.kind === 'website' ? 'Website' : 'Page'} · ${r.pages} page${r.pages > 1 ? 's' : ''} · ${new Date(r.updatedAt).toLocaleDateString()}`}
                      >
                        {r.thumb
                          ? <Box as="img" src={r.thumb} alt="" max-w="100%" max-h="100%" w="100%" h="40" p="2" object-fit="cover" />
                          : <Box display="flex" items="center" justify="center" w="100%" h="40" ><Logo size={34} /></Box>}
                      </PickCard>
                      <Box position="absolute" top="2" right="2">
                        <IconBtn icon="trash" title="Delete project" danger size={28} onClick={(e) => { e.stopPropagation(); remove(r.id, r.name); }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Txt fontSize="sm" m="0" {...T.muted}>No saved projects yet. Projects you create are kept in this browser and appear here. Use Open to load a .ast file.</Txt>
              )}
            </Box>

          </Box>
        </Box>
      </Box>
    </Box>
  );
}