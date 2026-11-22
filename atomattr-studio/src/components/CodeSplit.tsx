import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { generate, TARGETS, TARGET_LABEL } from '../exporters/codegen';
import { download } from '../exporters/zip';
import { formatCode, formatLang } from '../exporters/formatCode';
import { T } from '../theme';
import { SyntaxCode } from './SyntaxCode';
import { CodeIcon } from './CodeIcons';
import { DEFAULT_THEME, THEMES, isDarkOnly, themeById, type Lang, type Theme, type Variant } from './highlight';
import { usePaint, type Paint } from './paint';
import { CUSTOM_META, CustomEditor, CustomStatus, ScopeSwitch, useCustomValue, type Scope } from './CustomCodeTab';
import type { CustomTab } from '../state/layout';
import type { Target } from '../exporters/codegen';

/* ---------------------------------------------------------------------------------------------
   Code panel. Docked: a split on the right edge that pushes the canvas left. Floating: a window you
   can drag and resize. Both collapse (rail when docked, pill when floating).
   Word wrap and Prettier are on by default. A theme picker, tab and action overflow ("⋯") menus.
   Motion uses the Web Animations API; with "reduce motion" on it falls back to short fades.
   Elements are found by data-cs attributes (not refs), so this works even if Box does not forward refs.
   --------------------------------------------------------------------------------------------- */

const MIN_W = 320, MIN_H = 220;
const PAD_X = 8;
const SLOT = 32;
const PILL_W = 260, PILL_H = 36;
const POP_W = 232;
const EASE = 'cubic-bezier(.2,.8,.2,1)';
const SPRING = 'cubic-bezier(.16,1,.3,1)';
const POP = 'cubic-bezier(.34,1.56,.64,1)';

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));
const reduced = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const find = (k: string) => ({ get current(): HTMLElement | null { return document.querySelector<HTMLElement>(`[data-cs="${k}"]`); } });
const R = { root: find('root'), body: find('body'), pop: find('pop'), tabsMore: find('tabsMore'), actsMore: find('actsMore') };

export const codeWidth = (c: { w: number }, areaW: number) => { const auto = !(c.w > 0) || c.w === 600; return Math.round(Math.min(Math.max(320, auto ? areaW * 0.42 : c.w), Math.max(320, areaW * 0.7))); };

/* ---------- motion ---------- */

type Mode = 'dock' | 'float' | 'pill' | 'rail';
const ENTER = (mode: Mode, w: number): Keyframe[] => ({
  dock: [{ width: '0px', opacity: 0 }, { width: `${w}px`, opacity: 1 }],
  float: [{ opacity: 0, transform: 'translateY(18px) scale(.96)', transformOrigin: 'top right' }, { opacity: 1, transform: 'translateY(0) scale(1)', transformOrigin: 'top right' }],
  pill: [{ opacity: 0, transform: 'scale(.8)', transformOrigin: 'top right' }, { opacity: 1, transform: 'scale(1)', transformOrigin: 'top right' }],
  rail: [{ opacity: 0, transform: 'translateX(14px)' }, { opacity: 1, transform: 'translateX(0)' }],
}[mode]);
const DURATION: Record<Mode, number> = { dock: 300, float: 340, pill: 240, rail: 220 };

function anim(el: Element | null | undefined, frames: Keyframe[], ms: number, o: { easing?: string; fill?: FillMode; delay?: number } = {}): Promise<void> {
  const node = el as HTMLElement | null | undefined;
  if (!node || typeof node.animate !== 'function') return Promise.resolve();
  const calm = reduced();
  const f: Keyframe[] = calm ? frames.map(k => ({ opacity: (k.opacity as number | undefined) ?? 1 })) : frames;
  return node.animate(f, { duration: calm ? Math.min(ms, 120) : ms, delay: o.delay ?? 0, easing: o.easing ?? EASE, fill: o.fill ?? (o.delay ? 'backwards' : 'none') }).finished.then(() => undefined, () => undefined);
}

/* ---------- preferences kept in this browser ---------- */

type Prefs = { wrap: boolean; pretty: boolean; h: number | null; theme: string };
const PREF_KEY = 'atomattr.studio.code';
const DOCK_KEY = 'atomattr.studio.code.docked';
function loadPrefs(): Prefs {
  try {
    const o = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
    return { wrap: o.wrap !== false, pretty: o.pretty !== false, h: typeof o.h === 'number' ? o.h : null, theme: typeof o.theme === 'string' ? o.theme : DEFAULT_THEME };
  } catch { return { wrap: true, pretty: true, h: null, theme: DEFAULT_THEME }; }
}

/* ---------- target helpers ---------- */

const syntaxLang = (t: string): Lang => {
  const x = t.toLowerCase();
  if (x.includes('react')) return 'jsx';
  if (x.includes('css') && !x.includes('html')) return 'css';
  return /html|vue|svelte|angular/.test(x) ? 'html' : 'text';
};
const targetIcon = (t: string) => {
  const x = t.toLowerCase();
  return x.includes('native') ? 'reactnative' : x.includes('react') ? 'react' : x.includes('vue') ? 'vue' : x.includes('svelte') ? 'svelte' : x.includes('angular') ? 'angular' : x.includes('css') ? 'css' : x.includes('html') ? 'html' : 'code';
};
const labelOf = (t: string) => (TARGET_LABEL as Record<string, string>)[t] ?? t;

function fitTabs(all: string[], active: string, budget: number): { shown: string[]; hidden: string[] } {
  const others = all.filter(t => t !== active);
  const room = budget - (34 + labelOf(active).length * 6.4);
  if (others.length * SLOT <= room) return { shown: all, hidden: [] };
  const k = Math.max(0, Math.floor((room - SLOT) / SLOT));
  const keep = new Set([active, ...others.slice(0, k)]);
  return { shown: all.filter(t => keep.has(t)), hidden: all.filter(t => !keep.has(t)) };
}

/* ---------- small pieces ---------- */

function CodeBtn({ id, icon, title, active, primary, disabled, onClick, size = 28 }: { id?: string; icon: string; title: string; active?: boolean; primary?: boolean; disabled?: boolean; onClick: (e: React.MouseEvent) => void; size?: number }) {
  return (
    <Btn type="button" data-cs-btn={id} title={title} aria-label={title} aria-pressed={primary ? undefined : active} disabled={disabled}
      onClick={(e: React.MouseEvent) => { if (!disabled) void anim(e.currentTarget as HTMLElement, [{ transform: 'scale(.8)' }, { transform: 'scale(1)' }], 200, { easing: POP }); onClick(e); }}
      w={`${size}px`} h={`${size}px`} p="0" shrink="0" display="flex" items="center" justify="center" rounded="lg" border="0"
      cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? '0.35' : '1'}
      {...(primary ? { bg: 'primary', text: 'white' } : active ? { ...T.active, ...T.text } : { bg: 'transparent', ...(disabled ? {} : T.hover), ...T.text })}>
      <CodeIcon n={icon} size={18} />
    </Btn>
  );
}

/** Light half and dark half of a theme, each with its background and three token colours. */
function Swatch({ t, paint }: { t: Theme; paint: Paint }) {
  const half = (x: Variant) => (
    <Box flex="1" h="100%" display="flex" items="center" justify="center" gap="1" {...paint.bg(x.bg)}>
      {(['keyword', 'string', 'title'] as const).map(k => <Box key={k} w="5px" h="5px" rounded="full" {...paint.bg(x.c[k])} />)}
    </Box>
  );
  return <Row w="44px" h="22px" shrink="0" rounded="lg" overflow="hidden" border="1px solid" border-color="gray-300" dark-border-color="gray-700">{half(t.light)}{half(t.dark)}</Row>;
}

type Act = { id: string; icon: string; label: string; run: (el?: HTMLElement | null) => void; active?: boolean; primary?: boolean; disabled?: boolean };
type Pop = { kind: 'tabs' | 'acts' | 'theme'; x: number; y: number; up: boolean };

/* ---------- the panel ---------- */

export function CodeSplit({ areaW }: { areaW: number }) {
  const s = useStudio(); const c = s.layout.code;
  const paint = usePaint();
  const width = codeWidth(c, areaW);
  const float = !c.pinned;
  const isCustom = String(c.target).startsWith('custom:');
  const customTab = (isCustom ? c.target : 'custom:css') as CustomTab;
  const lastGen = useRef<Target>(isCustom ? 'HTML' : (c.target as Target));
  if (!isCustom) lastGen.current = c.target as Target;
  const genTarget = lastGen.current;
  const target = String(genTarget);
  const [scope, setScope] = useState<Scope>('site');
  const cv = useCustomValue(customTab, scope);
  const mode: Mode = c.collapsed ? (float ? 'pill' : 'rail') : (float ? 'float' : 'dock');

  const [prefs, setPrefsState] = useState(loadPrefs);
  const setPrefs = (p: Partial<Prefs>) => setPrefsState(prev => ({ ...prev, ...p }));
  useEffect(() => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ } }, [prefs]);
  const th = themeById(prefs.theme);

  /* the code lives on the right band by default: pin an existing floating layout once */
  useEffect(() => {
    try { if (localStorage.getItem(DOCK_KEY)) return; localStorage.setItem(DOCK_KEY, '1'); } catch { return; }
    if (!c.pinned) S.setCode({ pinned: true });
  }, []);

  /* ----- the code itself: generated once per project/target, formatted by Prettier when it is on ----- */
  const raw = useMemo(() => generate(s.project!, genTarget), [s.project, genTarget]);
  const lang = formatLang(target);
  const [fmt, setFmt] = useState<{ src: string; lang: string; code: string } | null>(null);
  const [fmtErr, setFmtErr] = useState<string | null>(null);
  useEffect(() => {
    setFmtErr(null);
    if (!prefs.pretty || !lang) return;
    let dead = false;
    formatCode(raw.code, lang).then(
      (code: string) => { if (!dead) setFmt({ src: raw.code, lang, code }); },
      (err: unknown) => { if (!dead) { setFmt(null); setFmtErr(`Prettier could not format this output, showing it as generated.${err instanceof Error ? ` (${err.message.split('\n')[0]})` : ''}`); } },
    );
    return () => { dead = true; };
  }, [raw.code, lang, prefs.pretty]);
  const formatted = prefs.pretty && lang && fmt && fmt.src === raw.code && fmt.lang === lang ? fmt.code : null;
  const shown = formatted ?? raw.code;

  /* ----- editing (HTML and React can be applied back to the canvas) ----- */
  const editable = !isCustom && (target === 'HTML' || target === 'React');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(shown);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setEditing(false); }, [target]);
  useEffect(() => { if (!editing) setDraft(shown); }, [shown, editing]);
  const text = isCustom ? cv.value : editing ? draft : shown;
  const fileName = isCustom ? CUSTOM_META[customTab].file : raw.file;
  const formatDraft = async () => {
    if (!lang || busy) return;
    setBusy(true);
    try { setDraft(await formatCode(draft, lang)); } catch { S.toast('Prettier could not parse this code. Fix the syntax and try again.', 'error'); } finally { setBusy(false); }
  };
  const applyDraft = () => { if (S.applyCodeToCanvas(draft)) setEditing(false); };
  const onEditKey = (e: any) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); applyDraft(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const t = e.target as HTMLTextAreaElement; const a = t.selectionStart; const b = t.selectionEnd;
      const next = `${draft.slice(0, a)}  ${draft.slice(b)}`; setDraft(next);
      requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = a + 2; });
    }
    e.stopPropagation();
  };

  /* ----- where the floating window may go ----- */
  const [area, setArea] = useState({ w: areaW, h: 720 });
  useEffect(() => {
    if (!float) return;
    const parent = R.root.current?.offsetParent as HTMLElement | null; if (!parent) return;
    const read = () => setArea({ w: parent.clientWidth, h: parent.clientHeight });
    read(); const ro = new ResizeObserver(read); ro.observe(parent);
    return () => ro.disconnect();
  }, [float, c.collapsed]);
  const hpx = prefs.h ? clamp(prefs.h, MIN_H, area.h - 8) : Math.max(MIN_H, area.h - 24);
  const size = c.collapsed ? { w: PILL_W, h: PILL_H } : { w: width, h: hpx };
  const rx = clamp(c.x, 0, area.w - size.w);
  const ty = clamp(c.y, 0, area.h - size.h);

  /* drags write straight to the element while moving and commit once on release */
  useLayoutEffect(() => {
    const el = R.root.current; if (!el) return;
    el.style.right = ''; el.style.top = ''; el.style.width = ''; el.style.height = '';
  }, [rx, ty, width, hpx, mode]);

  const begin = (kind: 'move' | 'left' | 'bottom' | 'corner') => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (kind === 'move' && (e.target as HTMLElement).closest('button, input, textarea, select, a')) return;
    const el = R.root.current; if (!el) return;
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY; const w0 = width, h0 = hpx, x0 = rx, y0 = ty; const aw = area.w, ah = area.h;
    let nx = x0, ny = y0, nw = w0, nh = h0, moved = false;
    const mv = (ev: PointerEvent) => {
      moved = true; const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (kind === 'move') { nx = clamp(x0 - dx, 0, aw - size.w); ny = clamp(y0 + dy, 0, ah - size.h); el.style.right = `${nx}px`; el.style.top = `${ny}px`; }
      if (kind === 'left' || kind === 'corner') { nw = clamp(w0 - dx, MIN_W, Math.min(aw * 0.7, aw - x0)); el.style.width = `${nw}px`; }
      if (kind === 'bottom' || kind === 'corner') { nh = clamp(h0 + dy, MIN_H, ah - y0); el.style.height = `${nh}px`; }
    };
    const up = () => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      if (!moved) return;
      if (kind === 'move') S.setCode({ x: Math.round(nx), y: Math.round(ny) });
      if (nw !== w0) S.setCode({ w: Math.round(nw) });
      if (nh !== h0) setPrefs({ h: Math.round(nh) });
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  const startDockResize = (e: React.PointerEvent) => {
    if (e.button !== 0) return; e.preventDefault();
    const sx = e.clientX; const w0 = width;
    const mv = (ev: PointerEvent) => S.setCode({ w: Math.round(clamp(w0 - (ev.clientX - sx), MIN_W, areaW * 0.7)) });
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); S.fit('page'); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  /* ----- motion ----- */
  useLayoutEffect(() => { void anim(R.root.current, ENTER(mode, width), DURATION[mode], { easing: SPRING }); }, [mode]);
  const leave = (done: () => void) => {
    const el = R.root.current; if (!el) { done(); return; }
    void anim(el, [...ENTER(mode, width)].reverse(), 200, { easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).then(done);
  };

  /* switching target: the code slides in from the side the new tab sits on, and the new tab pops */
  const idx = (TARGETS as readonly string[]).map(String).indexOf(target);
  const prev = useRef({ idx, first: true });
  useEffect(() => {
    if (prev.current.first) { prev.current.first = false; prev.current.idx = idx; return; }
    const dir = idx >= prev.current.idx ? 1 : -1; prev.current.idx = idx;
    void anim(R.body.current, [{ opacity: 0, transform: `translateX(${dir * 22}px)` }, { opacity: 1, transform: 'translateX(0)' }], 260, { easing: SPRING });
    void anim(document.querySelector('[data-cs="root"] [role="tab"][aria-selected="true"]'), [{ transform: 'scale(.88)' }, { transform: 'scale(1)' }], 260, { easing: POP });
  }, [target]);
  const softFirst = useRef(true);
  useEffect(() => {
    if (softFirst.current) { softFirst.current = false; return; }
    void anim(R.body.current, [{ opacity: 0.3, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], 220, { easing: SPRING });
  }, [prefs.wrap, prefs.theme, editing]);

  /* ----- the menus: fixed-position, so they are never clipped and flip when there is no room ----- */
  const [pop, setPop] = useState<Pop | null>(null);
  const openPop = (kind: Pop['kind'], anchor: HTMLElement | null, rows: number) => {
    if (pop?.kind === kind) { setPop(null); return; }
    if (!anchor) return;
    const r = anchor.getBoundingClientRect(); const h = rows * 34 + 8;
    const below = window.innerHeight - r.bottom - 8; const up = below < h && r.top > below;
    setPop({ kind, x: clamp(r.right - POP_W, 8, window.innerWidth - POP_W - 8), y: up ? window.innerHeight - r.top + 6 : r.bottom + 6, up });
  };
  useEffect(() => { setPop(null); }, [mode]);
  useEffect(() => {
    if (!pop) return;
    const down = (e: PointerEvent) => {
      const t = e.target as Element;
      if (R.pop.current?.contains(t) || R.tabsMore.current?.contains(t) || R.actsMore.current?.contains(t) || t.closest?.('[data-cs-btn="theme"]')) return;
      setPop(null);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setPop(null); };
    document.addEventListener('pointerdown', down, true); window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', down, true); window.removeEventListener('keydown', esc); };
  }, [pop]);
  useLayoutEffect(() => {
    if (!pop) return;
    const p = R.pop.current; if (!p) return;
    const origin = pop.up ? 'bottom right' : 'top right'; const dy = pop.up ? 8 : -8;
    void anim(p, [{ opacity: 0, transform: `translateY(${dy}px) scale(.95)`, transformOrigin: origin }, { opacity: 1, transform: 'translateY(0) scale(1)', transformOrigin: origin }], 200, { easing: SPRING });
    p.querySelectorAll('[role="menuitem"]').forEach((it, i) => { void anim(it, [{ opacity: 0, transform: 'translateX(10px)' }, { opacity: 1, transform: 'translateX(0)' }], 220, { easing: SPRING, delay: 30 + i * 22 }); });
  }, [pop?.kind]);

  /* ----- toolbar contents: what is shown, what goes under "⋯" ----- */
  const acts: Record<string, Act> = {
    edit: { id: 'edit', icon: 'pencil', label: editing ? 'Cancel edit' : 'Edit code', active: editing, run: () => { if (editing) setEditing(false); else { setDraft(shown); setEditing(true); } } },
    apply: { id: 'apply', icon: 'check', label: 'Apply to canvas (Ctrl+Enter)', primary: true, run: applyDraft },
    format: { id: 'format', icon: 'format', label: editing ? 'Format with Prettier' : prefs.pretty ? 'Prettier: on' : 'Prettier: off', active: !editing && prefs.pretty && !!lang, disabled: !lang || busy, run: editing ? formatDraft : () => setPrefs({ pretty: !prefs.pretty }) },
    wrap: { id: 'wrap', icon: 'wrap', label: prefs.wrap ? 'Word wrap: on' : 'Word wrap: off', active: prefs.wrap, run: () => setPrefs({ wrap: !prefs.wrap }) },
    theme: { id: 'theme', icon: 'styles', label: `Theme: ${th.name}`, active: pop?.kind === 'theme', run: el => openPop('theme', el ?? R.actsMore.current, THEMES.length) },
    copy: { id: 'copy', icon: 'copy', label: 'Copy code', run: () => { void navigator.clipboard.writeText(text); S.toast('Copied'); } },
    download: { id: 'download', icon: 'download', label: `Download ${fileName}`, run: () => download(new Blob([text]), fileName) },
    pin: { id: 'pin', icon: 'pin', label: c.pinned ? 'Float as a window' : 'Dock to the right edge', active: c.pinned, run: () => S.setCode({ pinned: !c.pinned }) },
    collapse: { id: 'collapse', icon: 'collapse', label: 'Collapse code panel', run: () => leave(() => S.setCode({ collapsed: true })) },
    close: { id: 'close', icon: 'close', label: 'Close code panel', run: () => leave(() => S.toggleCode()) },
  };
  const barOrder = ['edit', 'apply', 'format', 'wrap', 'theme', 'copy', 'download', 'pin', 'collapse', 'close'];
  const keepOrder = ['close', 'collapse', 'pin', 'copy', 'apply', 'edit', 'theme', 'wrap', 'format', 'download']; // last in this list moves into "⋯" first
  const present = barOrder.filter(id => (id !== 'edit' || editable) && (id !== 'apply' || editing) && (!isCustom || !['edit', 'apply', 'format', 'theme'].includes(id)));

  const inner = width - PAD_X * 2 - 2 - 24;
  const minTabs = isCustom ? 150 : 34 + labelOf(target).length * 6.4 + SLOT + 8;
  const slots = Math.floor((inner - minTabs) / SLOT);
  const nAct = slots >= present.length ? present.length : Math.max(2, slots - 1);
  const keep = new Set(keepOrder.filter(id => present.includes(id)).slice(0, nAct));
  const visActs = present.filter(id => keep.has(id)); const hidActs = present.filter(id => !keep.has(id));
  const tabsBudget = inner - 8 - visActs.length * SLOT - (hidActs.length ? SLOT : 0);
  const { shown: tabsShown, hidden: tabsHidden } = fitTabs((TARGETS as readonly string[]).map(String), target, tabsBudget);
  const setTarget = (t: string) => S.setCode({ target: t as typeof c.target });

  const toolbar = (
    <Row role="toolbar" aria-label="Code panel" items="center" gap="1" h="40px" px="2" shrink="0" border-b="1px solid" {...T.hairline}
      cursor={float ? 'move' : 'default'} onPointerDown={float ? begin('move') : undefined}>
      <Box w="20px" shrink="0" display="flex" items="center" justify="center" {...T.muted} title={float ? 'Drag to move' : undefined}><CodeIcon n={float ? 'grip' : 'code'} size={16} /></Box>

      {isCustom && <ScopeSwitch scope={scope} onChange={setScope} pageName={cv.page.name} />}
      {!isCustom && <Row role="tablist" aria-label="Export target" items="center" gap="1" min-w="0">
        {tabsShown.map(t => t === target ? (
          <Btn key={t} type="button" role="tab" aria-selected title={labelOf(t)} onClick={() => setTarget(t)} h="28px" px="2" display="flex" items="center" gap="2" rounded="lg" border="0" cursor="pointer" fontSize="sm" fontWeight="600" whitespace="nowrap" {...T.active} {...T.text}>
            <CodeIcon n={targetIcon(t)} size={16} />{labelOf(t)}
          </Btn>
        ) : (
          <Btn key={t} type="button" role="tab" aria-selected={false} title={labelOf(t)} aria-label={labelOf(t)} onClick={() => setTarget(t)} w="28px" h="28px" p="0" shrink="0" display="flex" items="center" justify="center" rounded="lg" border="0" cursor="pointer" bg="transparent" {...T.hover} {...T.muted}>
            <CodeIcon n={targetIcon(t)} size={18} />
          </Btn>
        ))}
        {tabsHidden.length > 0 && (
          <Box data-cs="tabsMore" shrink="0"><CodeBtn icon="more" title={`${tabsHidden.length} more target${tabsHidden.length > 1 ? 's' : ''}`} active={pop?.kind === 'tabs'} onClick={() => openPop('tabs', R.tabsMore.current, tabsHidden.length)} /></Box>
        )}
      </Row>}

      <Box flex="1" />

      {visActs.map(id => { const a = acts[id]; return <CodeBtn key={id} id={a.id} icon={a.icon} title={a.label} active={a.active} primary={a.primary} disabled={a.disabled} onClick={e => a.run(e.currentTarget as HTMLElement)} />; })}
      {hidActs.length > 0 && (
        <Box data-cs="actsMore" shrink="0"><CodeBtn icon="more" title="More actions" active={pop?.kind === 'acts'} onClick={() => openPop('acts', R.actsMore.current, hidActs.length)} /></Box>
      )}
    </Row>
  );

  const modes: { id: 'gen' | CustomTab; label: string; n?: number }[] = [
    { id: 'gen', label: 'Generated' },
    { id: 'custom:css', label: 'CSS', n: cv.counts.css }, { id: 'custom:js', label: 'JS', n: cv.counts.js }, { id: 'custom:head', label: 'Head', n: cv.counts.head },
  ];
  const modeStrip = (
    <Row role="tablist" aria-label="Code section" items="center" gap="1" h="34px" px="2" shrink="0" border-b="1px solid" {...T.hairline}>
      {modes.map(m => { const on = m.id === 'gen' ? !isCustom : c.target === m.id; return (
        <Btn key={m.id} type="button" role="tab" aria-selected={on} onClick={() => S.setCode({ target: m.id === 'gen' ? genTarget : m.id })} h="26px" px="3" border="0" rounded="lg" cursor="pointer" fontSize="sm" fontWeight="600" display="flex" items="center" gap="1" whitespace="nowrap"
          {...(on ? { ...T.active, ...T.text } : { bg: 'transparent', ...T.hover, ...T.muted })}>
          {m.id === 'gen' ? <CodeIcon n="code" size={14} /> : null}{m.id === 'gen' ? 'Generated' : `Custom ${m.label}`}
          {m.n ? <Box as="span" w="6px" h="6px" rounded="full" bg="primary" title="Has code" /> : null}
        </Btn>
      ); })}
    </Row>
  );

  const body = (
    <Box data-cs="body" flex="1" min-h="0" display="flex" flex-col overflow="hidden">
      {isCustom ? <CustomEditor tab={customTab} scope={scope} wrap={prefs.wrap} surface={paint.surface(th)} /> : editing
        ? <Box as="textarea" value={draft} onChange={(e: any) => setDraft(e.target.value)} onKeyDown={onEditKey} spellCheck={false} aria-label={`${target} editable code`}
            flex="1" min-h="0" m="0" p="3" border="0" overflow="auto" fontSize="sm" leading="relaxed" font-mono {...paint.surface(th)}
            {...(prefs.wrap ? { whitespace: 'pre-wrap', 'overflow-wrap': 'anywhere' } : { whitespace: 'pre' })} />
        : <SyntaxCode code={shown} lang={syntaxLang(target)} wrap={prefs.wrap} theme={prefs.theme} />}
    </Box>
  );

  const status = (
    <Row items="center" gap="2" h="24px" px="3" shrink="0" border-t="1px solid" {...T.hairline}>
      {isCustom ? <CustomStatus tab={customTab} scope={scope} /> : <>
        <Txt fontSize="sm" m="0" flex="1" truncate title={fmtErr ?? undefined} {...(fmtErr ? { text: 'warning' } : T.muted)}>
          {editing ? 'Applies to this page and can be undone · Ctrl+Enter' : fmtErr ?? `${raw.file}${formatted ? ' · Prettier' : ''}${editable ? '' : ' · read-only'}`}
        </Txt>
        <Txt as="span" fontSize="sm" m="0" shrink="0" {...T.muted}>{text.split('\n').length} lines</Txt>
      </>}
    </Row>
  );

  const popover = pop && (
    <Box data-cs="pop" position="fixed" left={`${pop.x}px`} {...(pop.up ? { bottom: `${pop.y}px` } : { top: `${pop.y}px` })} z="100" w={`${POP_W}px`} p="1" {...T.panel} role="menu" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
      {pop.kind === 'tabs' && tabsHidden.map(t => (
        <Row key={t} role="menuitem" items="center" gap="2" h="34px" px="2" rounded="lg" cursor="pointer" {...T.hover} onClick={() => { setTarget(t); setPop(null); }}>
          <CodeIcon n={targetIcon(t)} size={16} /><Txt fontSize="sm" m="0" flex="1" truncate>{labelOf(t)}</Txt>
        </Row>
      ))}
      {pop.kind === 'theme' && THEMES.map(t => (
        <Row key={t.id} role="menuitem" items="center" gap="2" h="34px" px="2" rounded="lg" cursor="pointer" {...T.hover} {...(t.id === prefs.theme ? T.active : {})} onClick={() => { setPrefs({ theme: t.id }); setPop(null); }}>
          <Swatch t={t} paint={paint} />
          <Txt fontSize="sm" m="0" flex="1" truncate>{t.name}</Txt>
          {isDarkOnly(t) && <Txt as="span" fontSize="sm" m="0" {...T.muted}>dark</Txt>}
          {t.id === prefs.theme ? <Box {...T.muted} display="flex"><CodeIcon n="check" size={14} /></Box> : null}
        </Row>
      ))}
      {pop.kind === 'acts' && hidActs.map(id => { const a = acts[id]; return (
        <Row key={id} role="menuitem" items="center" gap="2" h="34px" px="2" rounded="lg" cursor={a.disabled ? 'not-allowed' : 'pointer'} opacity={a.disabled ? '0.4' : '1'} {...(a.disabled ? {} : T.hover)} onClick={() => { if (a.disabled) return; setPop(null); a.run(R.actsMore.current); }}>
          <CodeIcon n={a.icon} size={16} /><Txt fontSize="sm" m="0" flex="1" truncate>{a.label}</Txt>
          {a.active ? <Box {...T.muted} display="flex"><CodeIcon n="check" size={14} /></Box> : null}
        </Row>
      ); })}
    </Box>
  );

  /* ---------- collapsed forms ---------- */

  if (mode === 'rail') {
    return (
      <Box key="rail" data-cs="root" flex="none" w="36px" h="100%" {...T.chrome} border-l="1px solid" display="flex" justify="center" pt="1">
        <CodeBtn icon="code" title="Expand code panel" onClick={() => S.setCode({ collapsed: false })} />
      </Box>
    );
  }
  if (mode === 'pill') {
    return (
      <Row key="pill" data-cs="root" position="absolute" top={`${ty}px`} right={`${rx}px`} z="45" w={`${PILL_W}px`} h={`${PILL_H}px`} items="center" gap="1" px="2" {...T.panel} rounded="lg" cursor="move" onPointerDown={begin('move')}>
        <Box w="20px" display="flex" items="center" justify="center" {...T.muted}><CodeIcon n="grip" size={16} /></Box>
        <Txt fontSize="sm" fontWeight="700" m="0" flex="1" whitespace="nowrap">AtomAttr code</Txt>
        <CodeBtn icon="pin" title="Dock to the right edge" size={26} onClick={() => S.setCode({ pinned: true, collapsed: false })} />
        <CodeBtn icon="chevron" title="Expand code panel" size={26} onClick={() => S.setCode({ collapsed: false })} />
        <CodeBtn icon="close" title="Close code panel" size={26} onClick={() => leave(() => S.toggleCode())} />
      </Row>
    );
  }

  /* ---------- docked: a split on the right edge; the canvas keeps the left ---------- */

  if (mode === 'dock') {
    return (
      <Row key="dock" data-cs="root" h="100%" max-h="100%" flex="none" w={`${width}px`} position="relative" overflow="hidden" {...T.chrome} border-l="1px solid">
        <Box position="absolute" left="0" top="0" w="6px" h="100%" cursor="col-resize" z="5" bg="transparent" hover-bg="primary/40" title="Drag to resize" onPointerDown={startDockResize} />
        <Box display="flex" flex-col w={`${width}px`} shrink="0" min-h="0">{toolbar}{modeStrip}{body}{status}</Box>
        {popover}
      </Row>
    );
  }

  /* ---------- floating: a window you can drag by its toolbar and resize from the left, bottom and corner ---------- */

  return (
    <Box key="float" data-cs="root" position="absolute" top={`${ty}px`} right={`${rx}px`} w={`${width}px`} h={`${hpx}px`} z="45" display="flex" flex-col overflow="hidden" {...T.glass} rounded="lg">
      {toolbar}{modeStrip}{body}{status}
      <Box position="absolute" left="0" top="40px" w="6px" h="calc(100% - 52px)" cursor="col-resize" z="5" bg="transparent" hover-bg="primary/40" title="Drag to resize" onPointerDown={begin('left')} />
      <Box position="absolute" left="12px" bottom="0" w="calc(100% - 24px)" h="6px" cursor="row-resize" z="5" bg="transparent" hover-bg="primary/40" title="Drag to resize" onPointerDown={begin('bottom')} />
      <Box position="absolute" left="0" bottom="0" w="12px" h="12px" cursor="nesw-resize" z="6" bg="transparent" hover-bg="primary/40" title="Drag to resize" onPointerDown={begin('corner')} />
      {popover}
    </Box>
  );
}

export default CodeSplit;