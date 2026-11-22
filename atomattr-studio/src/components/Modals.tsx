import { BETA } from '../state/diagnostics';
import { openFeedback } from './FeedbackDialog';
import { langValid } from '../document/lang';
import { useEffect, useState } from 'react';
import { Box, Btn, Input, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { NewProjectModal } from './Welcome';
import { WhatsNewModal } from './WhatsNew';
import { ToolIcon } from './ToolIcons';
import { Kbd } from './ui';
import { T } from '../theme';
import { ALL_TOOLS } from './tools';

/** Shared dialog frame: title bar, divider, scrolling body, optional footer. Esc or a click outside closes it. */
function Shell({ title, children, footer, w = 480 }: { title: string; children: React.ReactNode; footer?: React.ReactNode; w?: number }) {
  const close = () => S.setState({ modal: null });
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') S.setState({ modal: null }); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  return (
    <Box position="fixed" top="0" left="0" w="100%" h="100%" z="100" display="flex" items="center" justify="center" {...T.overlay} onPointerDown={close}>
      <Box {...T.panel} rounded="lg" w={`min(${w}px, 94vw)`} max-h="80vh" display="flex" flex-col overflow="hidden" role="dialog" aria-modal="true" aria-label={title} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
        <Row items="center" h="44px" flex="none" px="4" gap="2">
          <Txt fontSize="sm" fontWeight="700" m="0" flex="1" truncate>{title}</Txt>
          <Btn type="button" title="Close (Esc)" aria-label="Close" onClick={close} w="28px" h="28px" p="0" display="flex" items="center" justify="center" rounded="lg" border="0" cursor="pointer" shrink="0" bg="transparent" {...T.hover} {...T.text}><ToolIcon n="close" size={18} /></Btn>
        </Row>
        <Box h="1px" flex="none" {...T.divider} />
        <Box flex="1" min-h="0" overflow="auto" p="4">{children}</Box>
        {footer && <><Box h="1px" flex="none" {...T.divider} /><Row justify="end" items="center" gap="2" p="3" flex="none">{footer}</Row></>}
      </Box>
    </Box>
  );
}

const GhostBtn = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <Btn type="button" onClick={onClick} h="32px" px="4" rounded="lg" border="0" bg="transparent" {...T.hover} {...T.text} fontSize="sm" fontWeight="600" cursor="pointer">{children}</Btn>
);
const PrimaryBtn = ({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
  <Btn type="button" onClick={onClick} disabled={disabled} h="32px" px="4" rounded="lg" border="0" bg="primary" text="white" fontSize="sm" fontWeight="600" cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? '0.5' : '1'}>{children}</Btn>
);

/* ---------- rename ---------- */
function RenameModal() {
  const s = useStudio(); const [name, setName] = useState(s.project?.name || '');
  const ok = name.trim().length > 0;
  const done = () => { if (!ok) return; S.renameProject(name.trim()); S.setState({ modal: null }); };
  return (
    <Shell title="Rename project" footer={<><GhostBtn onClick={() => S.setState({ modal: null })}>Cancel</GhostBtn><PrimaryBtn onClick={done} disabled={!ok}>Rename</PrimaryBtn></>}>
      <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Project name</Txt>
      <Input type="text" value={name} autoFocus aria-label="Project name" onFocus={(e: any) => e.target.select()} onChange={(e: any) => setName(e.target.value)}
        onKeyDown={(e: any) => { if (e.key === 'Enter') done(); else if (e.key === 'Escape') S.setState({ modal: null }); e.stopPropagation(); }}
        w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
    </Shell>
  );
}

/* ---------- keyboard shortcuts ---------- */
const GENERAL: [string, string][] = [
  ['New project', 'Ctrl+N'], ['Save', 'Ctrl+S'], ['Command palette', 'Ctrl+K'], ['Undo', 'Ctrl+Z'], ['Redo', 'Ctrl+Shift+Z'],
  ['Select all', 'Ctrl+A'], ['Group', 'Ctrl+G'], ['Ungroup', 'Ctrl+Shift+G'], ['Duplicate', 'Ctrl+D'], ['Delete', 'Del'],
  ['Nudge', 'Arrows (Shift ×10)'], ['Pan', 'Space + drag'], ['Zoom', 'Ctrl + wheel / pinch'], ['Fit page', 'Ctrl+0'], ['Fit width', 'Ctrl+9'],
  ['Preview', 'Ctrl+P'], ['Code panel', 'Ctrl+E'],
];
const Heading = ({ children }: { children: React.ReactNode }) => <Txt fontSize="sm" fontWeight="700" m="0" mb="1" {...T.muted}>{children}</Txt>;

function ShortcutsModal() {
  return (
    <Shell title="Keyboard shortcuts" w={600}>
      <Heading>Tools</Heading>
      <Box display="grid" grid-cols="2" gap="1" mb="4">
        {ALL_TOOLS.map(t => <Row key={t.id} items="center" gap="2" h="30px" px="2"><ToolIcon n={t.icon} size={20} /><Txt fontSize="md" m="0" flex="1" truncate>{t.name}</Txt><Kbd>{t.key}</Kbd></Row>)}
      </Box>
      <Heading>General</Heading>
      <Box display="grid" grid-cols="2" gap="1">
        {GENERAL.map(([a, b]) => <Row key={a} items="center" gap="2" h="30px" px="2"><Txt fontSize="md" m="0" flex="1" truncate>{a}</Txt><Kbd>{b}</Kbd></Row>)}
      </Box>
    </Shell>
  );
}

/* ---------- about ---------- */
function AboutModal() {
  return (
    <Shell title={`AtomAttr Studio · Beta ${BETA.version}`} footer={<><GhostBtn onClick={() => S.setState({ modal: 'whats-new' })}>Release notes</GhostBtn><GhostBtn onClick={() => { S.setState({ modal: null }); openFeedback(); }}>Send feedback</GhostBtn><GhostBtn onClick={() => S.setState({ modal: 'shortcuts' })}>Keyboard shortcuts</GhostBtn></>}>
      <Txt fontSize="sm" m="0" {...T.muted}>A visual website builder with vector tools. The interface is styled entirely with AtomAttr attributes. Projects are saved in this browser; export gives you a ZIP with a plain HTML/CSS site and the AtomAttr markup.</Txt>
    </Shell>
  );
}

/* ---------- page templates ---------- */
function PageTemplateModal() {
  const s = useStudio();
  const [selected, setSelected] = useState<'blank' | 'landing' | 'features' | 'contact'>('landing');
  const [name, setName] = useState('');
  const templates = [
    { id: 'blank', name: 'Blank page', blurb: 'A clean start.' },
    { id: 'landing', name: 'Landing', blurb: 'Hero, features and CTA.' },
    { id: 'features', name: 'Feature grid', blurb: 'Benefits and proof points.' },
    { id: 'contact', name: 'Contact', blurb: 'Message and form.' },
  ] as const;
  return (
    <Shell title="Add page" w={620} footer={<><GhostBtn onClick={() => S.setState({ modal: null })}>Cancel</GhostBtn><PrimaryBtn onClick={() => S.createPageFromTemplate(selected, name.trim() || undefined)}>Create page</PrimaryBtn></>}>
      <Box display="flex" flex-col gap="4">
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Page name</Txt>
          <Input type="text" value={name} placeholder="Page 2" onChange={(e: any) => setName(e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter') S.createPageFromTemplate(selected, name.trim() || undefined); else if (e.key === 'Escape') S.setState({ modal: null }); e.stopPropagation(); }} w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
        </Box>
        <Box display="grid" grid-cols="2" gap="3">
          {templates.map(t => (
            <Btn key={t.id} type="button" onClick={() => setSelected(t.id)} w="100%" p="0" display="flex" flex-col overflow="hidden" text-align="center" cursor="pointer" rounded="lg" bg="white" dark-bg="gray-900" border="2px solid" {...(selected === t.id ? { 'border-color': 'primary' } : { 'border-color': 'gray-200', 'dark-border-color': 'gray-700' })} {...T.text}>
              <Box w="100%" h="92px" display="flex" items="center" justify="center" overflow="hidden" bg="gray-900/5" dark-bg="white/6" text="gray-500"><ToolIcon n={t.id === 'blank' ? 'file' : t.id === 'landing' ? 'home' : t.id === 'features' ? 'layers' : 'sliders'} size={32} /></Box>
              <Box w="100%" px="3" py="2" min-h="48px" display="flex" flex-col items="center" justify="center">
                <Txt fontSize="sm" fontWeight="500" m="0" w="100%" truncate>{t.name}</Txt>
                <Txt fontSize="sm" m="0" mt="1px" w="100%" truncate {...T.muted}>{t.blurb}</Txt>
              </Box>
            </Btn>
          ))}
        </Box>
      </Box>
    </Shell>
  );
}

/* ---------- project settings ---------- */
function ProjectModal() {
  const s = useStudio();
  const project = s.project;
  const [name, setName] = useState(project?.name || '');
  const [siteName, setSiteName] = useState(project?.site?.name || project?.name || '');
  const [siteDescription, setSiteDescription] = useState(project?.site?.description || '');
  const [baseUrl, setBaseUrl] = useState(project?.site?.baseUrl || '');
  const [socialImage, setSocialImage] = useState(project?.site?.socialImage || '');
  const [lang, setLang] = useState(project?.site?.lang || '');
  const [tablet, setTablet] = useState(project?.settings?.tablet ?? true);
  const [mobile, setMobile] = useState(project?.settings?.mobile ?? true);
  const [autoStack, setAutoStack] = useState(project?.settings?.autoStack ?? true);

  useEffect(() => {
    if (!project) return;
    setName(project.name);
    setSiteName(project.site?.name || project.name);
    setSiteDescription(project.site?.description || '');
    setBaseUrl(project.site?.baseUrl || '');
    setSocialImage(project.site?.socialImage || '');
    setLang(project.site?.lang || '');
    setTablet(project.settings?.tablet ?? true);
    setMobile(project.settings?.mobile ?? true);
    setAutoStack(project.settings?.autoStack ?? true);
  }, [project?.id, project?.name, project?.site?.name, project?.site?.description, project?.site?.baseUrl, project?.site?.socialImage, project?.site?.lang, project?.settings?.tablet, project?.settings?.mobile, project?.settings?.autoStack]);

  const save = () => {
    S.saveProjectSettings({
      name,
      settings: { tablet, mobile, autoStack },
      site: {
        name: siteName.trim() || name.trim() || 'Untitled',
        description: siteDescription.trim(),
        baseUrl: baseUrl.trim(),
        socialImage: socialImage.trim(),
        lang: langValid(lang) ? lang.trim() : '',
      },
    });
    S.setState({ modal: null });
  };

  if (!project) return null;

  return (
    <Shell title="Project settings" footer={<><GhostBtn onClick={() => S.setState({ modal: null })}>Cancel</GhostBtn><PrimaryBtn onClick={save}>Save</PrimaryBtn></>}>
      <Box display="flex" flex-col gap="3">
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Project name</Txt>
          <Input type="text" value={name} autoFocus aria-label="Project name" onFocus={(e: any) => e.target.select()} onChange={(e: any) => setName(e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter') save(); else if (e.key === 'Escape') S.setState({ modal: null }); e.stopPropagation(); }} w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
        </Box>
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Site metadata</Txt>
          <Box display="flex" flex-col gap="2">
            <Box>
              <Txt fontSize="sm" m="0" mb="1" {...T.muted}>Site name</Txt>
              <Input type="text" value={siteName} onChange={(e: any) => setSiteName(e.target.value)} w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
            </Box>
            <Box>
              <Txt fontSize="sm" m="0" mb="1" {...T.muted}>Site description</Txt>
              <Box as="textarea" value={siteDescription} onChange={(e: any) => setSiteDescription(e.target.value)} w="100%" min-h="70px" p="2" fontSize="sm" {...T.field} />
            </Box>
            <Box>
              <Txt fontSize="sm" m="0" mb="1" {...T.muted}>Base URL</Txt>
              <Input type="text" value={baseUrl} onChange={(e: any) => setBaseUrl(e.target.value)} placeholder="https://example.com" w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
            </Box>
            <Box>
              <Txt fontSize="sm" m="0" mb="1" {...T.muted}>Language</Txt>
              <Input type="text" value={lang} onChange={(e: any) => setLang(e.target.value)} placeholder="en" aria-label="Page language" aria-invalid={!!lang && !langValid(lang)} w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
              <Txt fontSize="sm" leading="snug" m="0" mt="1" {...(lang && !langValid(lang) ? { text: 'danger' } : T.muted)}>{lang && !langValid(lang) ? 'Use a language code such as en, fr or pt-BR.' : 'Written on every page as <html lang>. Screen readers pick their voice from it.'}</Txt>
            </Box>
            <Box>
              <Txt fontSize="sm" m="0" mb="1" {...T.muted}>Social image URL</Txt>
              <Input type="text" value={socialImage} onChange={(e: any) => setSocialImage(e.target.value)} placeholder="https://example.com/og-image.jpg" w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
            </Box>
          </Box>
        </Box>
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Responsive defaults</Txt>
          <Box display="flex" flex-col gap="2">
            <Row items="center" justify="between" gap="2">
              <Txt fontSize="sm" m="0" {...T.text}>Tablet layout</Txt>
              <Btn type="button" onClick={() => setTablet(!tablet)} h="28px" px="2" rounded="lg" border="0" cursor="pointer" {...(tablet ? T.active : T.card)}>{tablet ? 'On' : 'Off'}</Btn>
            </Row>
            <Row items="center" justify="between" gap="2">
              <Txt fontSize="sm" m="0" {...T.text}>Mobile layout</Txt>
              <Btn type="button" onClick={() => setMobile(!mobile)} h="28px" px="2" rounded="lg" border="0" cursor="pointer" {...(mobile ? T.active : T.card)}>{mobile ? 'On' : 'Off'}</Btn>
            </Row>
            <Row items="center" justify="between" gap="2">
              <Txt fontSize="sm" m="0" {...T.text}>Auto-stack free layout</Txt>
              <Btn type="button" onClick={() => setAutoStack(!autoStack)} h="28px" px="2" rounded="lg" border="0" cursor="pointer" {...(autoStack ? T.active : T.card)}>{autoStack ? 'On' : 'Off'}</Btn>
            </Row>
          </Box>
        </Box>
      </Box>
    </Shell>
  );
}

/* ---------- site navigation ---------- */
function SiteNavModal() {
  const s = useStudio();
  const pages = s.project?.pages ?? [];
  const normalizeSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'page';
  const [draft, setDraft] = useState(() => pages.map(page => ({
    id: page.id,
    navLabel: page.navLabel ?? page.name,
    slug: page.slug ?? normalizeSlug(page.name),
    inNav: page.inNav ?? true,
    parentId: page.parentId ?? null,
    order: page.order ?? 0,
    sharedSection: page.sharedSection ?? null,
  })));

  useEffect(() => {
    setDraft(pages.map(page => ({
      id: page.id,
      navLabel: page.navLabel ?? page.name,
      slug: page.slug ?? normalizeSlug(page.name),
      inNav: page.inNav ?? true,
      parentId: page.parentId ?? null,
      order: page.order ?? 0,
      sharedSection: page.sharedSection ?? null,
    })));
  }, [pages.map(page => page.id).join(','), pages.map(page => page.name).join(','), pages.map(page => page.navLabel ?? page.name).join(','), pages.map(page => page.slug ?? page.name).join(','), pages.map(page => page.parentId ?? '').join(','), pages.map(page => page.sharedSection ?? '').join(',')]);

  const save = () => {
    const cleaned = draft.map(item => ({
      id: item.id,
      navLabel: item.navLabel.trim() || 'Untitled',
      slug: item.slug.trim() || 'page',
      inNav: !!item.inNav,
      parentId: item.parentId ?? null,
      order: typeof item.order === 'number' ? item.order : 0,
      sharedSection: item.sharedSection ?? null,
    }));
    S.saveSiteNavigation(cleaned);
    if (s.project) {
      const header = draft.find(item => item.sharedSection === 'header')?.id ?? null;
      const footer = draft.find(item => item.sharedSection === 'footer')?.id ?? null;
      S.setProject({ ...s.project, globalHeaderPageId: header, globalFooterPageId: footer });
    }
    S.setState({ modal: null });
  };

  if (!pages.length) return null;

  return (
    <Shell title="Site blueprint" w={760} footer={<><GhostBtn onClick={() => S.setState({ modal: null })}>Cancel</GhostBtn><PrimaryBtn onClick={save}>Save</PrimaryBtn></>}>
      <Box display="flex" flex-col gap="4">
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Global shared sections</Txt>
          <Row gap="2" wrap="wrap">
            <Box flex="1" min-w="180px">
              <Txt fontSize="sm" m="0" mb="1" {...T.muted}>Header</Txt>
              <Box as="select" value={draft.find(item => item.sharedSection === 'header')?.id ?? ''} onChange={(e: any) => setDraft(prev => prev.map(item => item.id === e.target.value ? { ...item, sharedSection: 'header' } : item.id === (prev.find(p => p.sharedSection === 'header')?.id ?? '') && item.sharedSection === 'header' ? { ...item, sharedSection: null } : item))} w="100%" h="34px" px="3" fontSize="sm" {...T.field}>
                <option value="">None</option>
                {pages.map(page => <option key={page.id} value={page.id}>{page.navLabel ?? page.name}</option>)}
              </Box>
            </Box>
            <Box flex="1" min-w="180px">
              <Txt fontSize="sm" m="0" mb="1" {...T.muted}>Footer</Txt>
              <Box as="select" value={draft.find(item => item.sharedSection === 'footer')?.id ?? ''} onChange={(e: any) => setDraft(prev => prev.map(item => item.id === e.target.value ? { ...item, sharedSection: 'footer' } : item.id === (prev.find(p => p.sharedSection === 'footer')?.id ?? '') && item.sharedSection === 'footer' ? { ...item, sharedSection: null } : item))} w="100%" h="34px" px="3" fontSize="sm" {...T.field}>
                <option value="">None</option>
                {pages.map(page => <option key={page.id} value={page.id}>{page.navLabel ?? page.name}</option>)}
              </Box>
            </Box>
          </Row>
        </Box>
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="2" {...T.muted}>Page structure</Txt>
          <Box display="flex" flex-col gap="2">
            {draft.map((item, index) => (
              <Box key={item.id} display="grid" grid-cols="1.6fr 1fr auto auto" gap="2" p="2" rounded="lg" bg="gray-900/5" dark-bg="white/6">
                <Box>
                  <Txt fontSize="sm" m="0" mb="1" {...T.muted}>Page {index + 1}</Txt>
                  <Input type="text" value={item.navLabel} onChange={(e: any) => setDraft(prev => prev.map(p => p.id === item.id ? { ...p, navLabel: e.target.value } : p))} w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
                </Box>
                <Box>
                  <Txt fontSize="sm" m="0" mb="1" {...T.muted}>Slug</Txt>
                  <Input type="text" value={item.slug} onChange={(e: any) => setDraft(prev => prev.map(p => p.id === item.id ? { ...p, slug: e.target.value } : p))} w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
                </Box>
                <Box>
                  <Txt fontSize="sm" m="0" mb="1" {...T.muted}>Parent</Txt>
                  <Box as="select" value={item.parentId ?? ''} onChange={(e: any) => setDraft(prev => prev.map(p => p.id === item.id ? { ...p, parentId: e.target.value || null } : p))} w="100%" h="34px" px="3" fontSize="sm" {...T.field}>
                    <option value="">Top level</option>
                    {pages.filter(page => page.id !== item.id).map(page => <option key={page.id} value={page.id}>{page.navLabel ?? page.name}</option>)}
                  </Box>
                </Box>
                <Box display="flex" items="end" justify="center" h="100%">
                  <Btn type="button" onClick={() => setDraft(prev => prev.map(p => p.id === item.id ? { ...p, inNav: !p.inNav } : p))} h="34px" px="3" rounded="lg" border="0" cursor="pointer" {...(item.inNav ? T.active : T.card)}>{item.inNav ? 'In nav' : 'Hidden'}</Btn>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Shell>
  );
}

/* ---------- page settings ---------- */
function PageModal() {
  const s = useStudio();
  const pg = s.project?.pages.find(p => p.id === s.project?.activePageId) ?? s.project?.pages[0];
  const [name, setName] = useState(pg?.name || '');
  const [title, setTitle] = useState(pg?.seo?.title || '');
  const [description, setDescription] = useState(pg?.seo?.description || '');
  const [socialTitle, setSocialTitle] = useState(pg?.seo?.socialTitle || '');
  const [socialDescription, setSocialDescription] = useState(pg?.seo?.socialDescription || '');
  const [socialImage, setSocialImage] = useState(pg?.seo?.socialImage || '');
  const [width, setWidth] = useState(String(pg?.width ?? pg?.root.style.w ?? 1440));
  const [height, setHeight] = useState(String(pg?.height ?? pg?.root.style.h ?? 1200));
  const [theme, setTheme] = useState<'light' | 'dark'>(s.project?.pageTheme || 'light');

  useEffect(() => {
    if (!pg) return;
    setName(pg.name);
    setTitle(pg.seo?.title || '');
    setDescription(pg.seo?.description || '');
    setSocialTitle(pg.seo?.socialTitle || '');
    setSocialDescription(pg.seo?.socialDescription || '');
    setSocialImage(pg.seo?.socialImage || '');
    setWidth(String(pg.width ?? pg.root.style.w ?? 1440));
    setHeight(String(pg.height ?? pg.root.style.h ?? 1200));
    setTheme(s.project?.pageTheme || 'light');
  }, [pg?.id, s.project?.pageTheme]);

  if (!pg) return null;

  const save = () => {
    const nextName = name.trim() || pg.name;
    const nextWidth = Math.max(1, Number(width) || Number(pg.width ?? pg.root.style.w ?? 1440));
    const nextHeight = Math.max(1, Number(height) || Number(pg.height ?? pg.root.style.h ?? 1200));
    const nextSeo = {
      ...(pg.seo || {}),
      ...(title.trim() ? { title: title.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(socialTitle.trim() ? { socialTitle: socialTitle.trim() } : {}),
      ...(socialDescription.trim() ? { socialDescription: socialDescription.trim() } : {}),
      ...(socialImage.trim() ? { socialImage: socialImage.trim() } : {}),
    };
    if (!title.trim()) delete nextSeo.title;
    if (!description.trim()) delete nextSeo.description;
    if (!socialTitle.trim()) delete nextSeo.socialTitle;
    if (!socialDescription.trim()) delete nextSeo.socialDescription;
    if (!socialImage.trim()) delete nextSeo.socialImage;
    S.setPageSettings(pg.id, { name: nextName, seo: nextSeo, width: nextWidth, height: nextHeight });
    if ((s.project?.pageTheme || 'light') !== theme) S.setPageTheme(theme);
    S.setState({ modal: null });
  };

  return (
    <Shell title="Page settings" footer={<><GhostBtn onClick={() => S.setState({ modal: null })}>Cancel</GhostBtn><PrimaryBtn onClick={save}>Save</PrimaryBtn></>}>
      <Box display="flex" flex-col gap="3">
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Page name</Txt>
          <Input type="text" value={name} autoFocus aria-label="Page name" onFocus={(e: any) => e.target.select()} onChange={(e: any) => setName(e.target.value)} onKeyDown={(e: any) => { if (e.key === 'Enter') save(); else if (e.key === 'Escape') S.setState({ modal: null }); e.stopPropagation(); }} w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
        </Box>
        <Row gap="2">
          <Box flex="1">
            <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Width</Txt>
            <Input type="number" min={320} step={10} value={width} onChange={(e: any) => setWidth(e.target.value)} w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
          </Box>
          <Box flex="1">
            <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Height</Txt>
            <Input type="number" min={300} step={10} value={height} onChange={(e: any) => setHeight(e.target.value)} w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
          </Box>
        </Row>
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Page appearance</Txt>
          <Row gap="1">
            {(['light', 'dark'] as const).map(value => (
              <Btn key={value} type="button" onClick={() => setTheme(value)} h="30px" px="3" rounded="lg" border="0" cursor="pointer" {...(theme === value ? T.active : T.card)}>{value[0].toUpperCase() + value.slice(1)}</Btn>
            ))}
          </Row>
        </Box>
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>SEO title</Txt>
          <Input type="text" value={title} onChange={(e: any) => setTitle(e.target.value)} w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
        </Box>
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>SEO description</Txt>
          <Box as="textarea" value={description} onChange={(e: any) => setDescription(e.target.value)} w="100%" min-h="90px" p="2" fontSize="sm" {...T.field} />
        </Box>
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Social title</Txt>
          <Input type="text" value={socialTitle} onChange={(e: any) => setSocialTitle(e.target.value)} w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
        </Box>
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Social description</Txt>
          <Box as="textarea" value={socialDescription} onChange={(e: any) => setSocialDescription(e.target.value)} w="100%" min-h="90px" p="2" fontSize="sm" {...T.field} />
        </Box>
        <Box>
          <Txt fontSize="sm" fontWeight="600" m="0" mb="1" {...T.muted}>Social image URL</Txt>
          <Input type="text" value={socialImage} onChange={(e: any) => setSocialImage(e.target.value)} placeholder="https://example.com/share.png" w="100%" h="34px" px="3" fontSize="sm" {...T.field} />
        </Box>
      </Box>
    </Shell>
  );
}

/* ---------- switch ---------- */
export function Modals() {
  const s = useStudio();
  switch (s.modal) {
    case 'new': return <NewProjectModal />;
    case 'rename': return <RenameModal />;
    case 'project': return <ProjectModal />;
    case 'site-nav': return <SiteNavModal />;
    case 'page-template': return <PageTemplateModal />;
    case 'page': return <PageModal />;
    case 'shortcuts': return <ShortcutsModal />;
    case 'about': return <AboutModal />;
    case 'whats-new': return <WhatsNewModal />;
    default: return null;
  }
}