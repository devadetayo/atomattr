import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { T } from '../theme';
import { ToolIcon } from './ToolIcons';
import { NumField, SelectField } from './ui';
import { DEVICES, DEVICE_GROUPS, deviceById, frameFor, type Device } from '../state/devices';
import { buildPreviewHtml, hasDarkStyles, pageForHref } from '../exporters/preview-html';

/* ---------- preferences (remembered between sessions; the preview works without storage) ---------- */
type Prefs = { device: string; landscape: boolean; zoom: 'fit' | number; dark: boolean; frame: boolean; compare: boolean; set: string[]; rw: number; rh: number; touch: boolean; net: Net };
const DEFAULTS: Prefs = { device: 'iphone-15-pro', landscape: false, zoom: 'fit', dark: false, frame: true, compare: false, set: ['iphone-15-pro', 'ipad-air', 'macbook-air-13'], rw: 820, rh: 700, touch: true, net: 'off' };
type Net = 'off' | '4g' | 'slow4g' | '3g';
/** Rough connection profiles: bandwidth in bits per second and round-trip time in ms. */
const NET: Record<Net, { label: string; bps: number; rtt: number }> = { off: { label: 'No throttling', bps: 0, rtt: 0 }, '4g': { label: 'Fast 4G', bps: 9e6, rtt: 170 }, slow4g: { label: 'Slow 4G', bps: 1.6e6, rtt: 150 }, '3g': { label: 'Slow 3G', bps: 0.78e6, rtt: 300 } };
const NET_OPTS: [string, string][] = (Object.keys(NET) as Net[]).map(k => [k, NET[k].label]);
/** Estimated time to load: three round trips (page, styles, images) plus the transfer time of the whole page. */
const loadTime = (net: Net, bytes: number) => (net === 'off' ? 0 : Math.min(12000, Math.round(NET[net].rtt * 3 + (bytes * 8 * 1000) / NET[net].bps)));
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const KEY = 'atomattr-studio.preview';
function loadPrefs(): Prefs { try { const raw = localStorage.getItem(KEY); return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS; } catch { return DEFAULTS; } }
function savePrefs(p: Prefs) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable: fine */ } }

const iconFor = (d: Device) => (d.kind === 'phone' ? 'mobile' : d.kind === 'tablet' ? 'tablet' : d.kind === 'responsive' ? 'plus' : 'desktop');
const r3 = (n: number) => String(Math.round(n * 1000) / 1000);
const canRotate = (d: Device) => d.kind === 'phone' || d.kind === 'tablet';
const ZOOM_OPTS: [string, string][] = [['fit', 'Fit'], ['0.25', '25%'], ['0.5', '50%'], ['0.75', '75%'], ['1', '100%'], ['1.25', '125%']];

/** The screen size the page sees, after rotation. */
function screenOf(d: Device, landscape: boolean, rw: number, rh: number) {
  if (d.kind === 'responsive') return { w: rw, h: rh };
  return landscape && canRotate(d) ? { w: d.h, h: d.w } : { w: d.w, h: d.h };
}

/** Overall footprint of a framed device in CSS px, before scaling. */
function footprint(d: Device, landscape: boolean, frame: boolean, rw: number, rh: number) {
  const sc = screenOf(d, landscape, rw, rh); const f = frame ? frameFor(d, landscape) : { t: 0, r: 0, b: 0, l: 0, radius: 0, base: 0 };
  const ov = frame && d.kind === 'laptop' ? 24 : 0;
  return { sc, f, ov, w: sc.w + f.l + f.r + ov * 2, h: sc.h + f.t + f.b + f.base };
}

/* ---------- one device: frame, cut-outs, buttons, and the live page ---------- */
function DeviceView({ d, landscape, frame, html, z, rw, rh, onResize, reload, dark, loadMs, netLabel, bytes }: { d: Device; dark: boolean; loadMs: number; netLabel: string; bytes: number; landscape: boolean; frame: boolean; html: string; z: number; rw: number; rh: number; onResize?: (w: number, h: number) => void; reload: number }) {
  const { sc, f, ov, w, h } = footprint(d, landscape, frame, rw, rh);
  const [dragging, setDragging] = useState(false);
  const phone = d.kind === 'phone'; const tablet = d.kind === 'tablet'; const laptop = d.kind === 'laptop'; const desktop = d.kind === 'desktop'; const resp = d.kind === 'responsive';
  const bodyW = sc.w + f.l + f.r; const bodyH = sc.h + f.t + f.b;
  const screenRadius = phone || tablet ? d.radius || 30 : laptop ? 6 : desktop ? 4 : 0;
  const cut = frame ? d.cutout : 'none';
  const drag = (axis: 'x' | 'y' | 'xy') => (e: React.PointerEvent) => {
    e.preventDefault(); const x0 = e.clientX, y0 = e.clientY, w0 = sc.w, h0 = sc.h; setDragging(true);
    const mv = (ev: PointerEvent) => onResize?.(axis === 'y' ? w0 : Math.max(240, Math.round(w0 + (ev.clientX - x0) / z)), axis === 'x' ? h0 : Math.max(240, Math.round(h0 + (ev.clientY - y0) / z)));
    const up = () => { setDragging(false); window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  const portrait = !(landscape && canRotate(d));
  // Simulated slow connection: hold a loading screen for the estimated time whenever the page (re)loads.
  const [pct, setPct] = useState(100);
  useEffect(() => {
    if (!loadMs) { setPct(100); return; }
    setPct(0); const t0 = Date.now();
    const id = setInterval(() => { const v = Math.min(100, ((Date.now() - t0) / loadMs) * 100); setPct(v); if (v >= 100) clearInterval(id); }, 60);
    return () => clearInterval(id);
  }, [html, reload, loadMs]);
  // The bar above the page that real hardware reserves (status bar, menu bar), so the page never sits under the camera cut-out.
  const bar = !frame ? 0 : phone ? (portrait ? (cut === 'island' ? 52 : cut === 'punch' ? 38 : cut === 'notch' ? 48 : 22) : 0) : tablet ? 24 : laptop && cut === 'notch' ? 26 : 0;
  // In landscape iPhones inset the page on both sides, clear of the island / notch.
  const side = frame && phone && !portrait && (cut === 'island' || cut === 'notch') ? 54 : 0;
  const barBg = dark ? 'gray-950' : 'white'; const barFg = dark ? 'white' : 'gray-900';
  return (
    <Box position="relative" flex="none" w={`${Math.round(w * z)}px`} h={`${Math.round(h * z)}px`}>
      <Box position="absolute" top="0" left="0" w={`${w}px`} h={`${h}px`} scale={r3(z)} transformOrigin="0 0">
        {/* body */}
        <Box position="absolute" top="0" left={`${ov}px`} w={`${bodyW}px`} h={`${bodyH}px`} rounded={frame ? `${f.radius}px` : '0'}
          {...(frame ? { bg: 'gray-950', border: '2px solid', 'border-color': 'gray-700', shadow: '2xl' } : { shadow: 'xl', border: '1px solid', 'border-color': 'gray-300' })} />
        {/* side buttons */}
        {frame && phone && (portrait
          ? <>
            <Box position="absolute" top="130px" left={`${ov - 3}px`} w="4px" h="48px" rounded="sm" bg="gray-700" />
            <Box position="absolute" top="196px" left={`${ov - 3}px`} w="4px" h="48px" rounded="sm" bg="gray-700" />
            <Box position="absolute" top="170px" left={`${ov + bodyW - 1}px`} w="4px" h="84px" rounded="sm" bg="gray-700" />
          </>
          : <>
            <Box position="absolute" left="130px" top="-3px" w="48px" h="4px" rounded="sm" bg="gray-700" />
            <Box position="absolute" left="196px" top="-3px" w="48px" h="4px" rounded="sm" bg="gray-700" />
            <Box position="absolute" left="170px" top={`${bodyH - 1}px`} w="84px" h="4px" rounded="sm" bg="gray-700" />
          </>)}
        {/* screen */}
        <Box position="absolute" top={`${f.t}px`} left={`${ov + f.l}px`} w={`${sc.w}px`} h={`${sc.h}px`} overflow="hidden" bg={side ? barBg : 'white'} rounded={`${screenRadius}px`}>
          {bar > 0 && <Box position="absolute" top="0" left="0" w={`${sc.w}px`} h={`${bar}px`} bg={laptop ? 'gray-200' : barBg} z="1">
            {!laptop && <Txt position="absolute" m="0" fontSize="sm" fontWeight="700" text={barFg} top={`${cut === 'island' ? 17 : cut === 'punch' ? 11 : cut === 'notch' ? 14 : 3}px`} left={`${phone ? 34 : 18}px`}>9:41</Txt>}
            {!laptop && <Box position="absolute" right={`${phone ? 30 : 18}px`} top={`${cut === 'island' ? 22 : cut === 'punch' ? 15 : cut === 'notch' ? 19 : 6}px`} w="24px" h="11px" rounded="sm" border="1.5px solid" border-color={barFg} p="1.5px"><Box w="70%" h="100%" bg={barFg} rounded="sm" /></Box>}
          </Box>}
          <Box position="absolute" top={`${bar}px`} left={`${side}px`} w={`${sc.w - side * 2}px`} h={`${sc.h - bar}px`}><Box as="iframe" key={reload} title={`${d.name} preview`} srcDoc={html} sandbox="allow-scripts allow-popups" w={`${sc.w - side * 2}px`} h={`${sc.h - bar}px`} border="0" display="block" bg="white" pointerEvents={dragging ? 'none' : 'auto'} /></Box>
          {/* cut-outs sit over the page like real hardware */}
          {pct < 100 && <Box position="absolute" top="0" left="0" w="100%" h="100%" z="2" display="flex" flex-col items="center" justify="center" gap="3" bg={dark ? 'gray-950' : 'white'} aria-live="polite">
            <Box w="55%" h="6px" rounded="full" bg="gray-200" dark-bg="gray-700" overflow="hidden"><Box h="100%" w={`${Math.round(pct)}%`} bg="primary" /></Box>
            <Txt fontSize="sm" m="0" text={dark ? 'gray-300' : 'gray-600'} align="center" px="4">Loading on {netLabel}… {(loadMs / 1000).toFixed(1)}s estimated · {kb(bytes)}</Txt>
          </Box>}
          {cut === 'island' && <Box position="absolute" rounded="full" bg="black" pointerEvents="none" z="3" {...(portrait ? { top: '11px', left: `${sc.w / 2 - 62}px`, w: '124px', h: '36px' } : { left: '11px', top: `${sc.h / 2 - 62}px`, w: '36px', h: '124px' })} />}
          {cut === 'punch' && <Box position="absolute" rounded="full" bg="black" pointerEvents="none" z="3" {...(phone ? (portrait ? { top: '14px', left: `${sc.w / 2 - 8}px`, w: '16px', h: '16px' } : { left: '14px', top: `${sc.h / 2 - 8}px`, w: '16px', h: '16px' }) : { top: '10px', left: `${sc.w / 2 - 5}px`, w: '10px', h: '10px' })} />}
          {cut === 'notch' && phone && <Box position="absolute" bg="black" pointerEvents="none" z="3" {...(portrait ? { top: '0', left: `${sc.w / 2 - 82}px`, w: '164px', h: '30px', 'rounded-b': '18px' } : { left: '0', top: `${sc.h / 2 - 82}px`, w: '30px', h: '164px', 'rounded-r': '18px' })} />}
          {cut === 'notch' && laptop && <Box position="absolute" top="0" left={`${sc.w / 2 - 70}px`} w="140px" h="22px" bg="black" rounded-b="10px" pointerEvents="none" z="3" />}
          {frame && phone && d.home && <Box position="absolute" bottom="8px" left={`${sc.w / 2 - 67}px`} w="134px" h="5px" rounded="full" bg="gray-900/55" pointerEvents="none" z="3" />}
        </Box>
        {/* front camera on tablets and laptops without a notch */}
        {frame && tablet && <Box position="absolute" rounded="full" bg="gray-700" {...(portrait ? { top: '8px', left: `${ov + bodyW / 2 - 4}px`, w: '8px', h: '8px' } : { left: '8px', top: `${bodyH / 2 - 4}px`, w: '8px', h: '8px' })} />}
        {frame && laptop && d.cutout !== 'notch' && <Box position="absolute" top="6px" left={`${ov + bodyW / 2 - 3}px`} w="6px" h="6px" rounded="full" bg="gray-700" />}
        {/* the foot of a laptop (keyboard deck) and of a desktop (stand) */}
        {frame && laptop && <>
          <Box position="absolute" top={`${bodyH - 2}px`} left="0" w={`${bodyW + ov * 2}px`} h={`${f.base}px`} bg="gray-300" rounded-b="22px" shadow="lg" border="1px solid" border-color="gray-400" />
          <Box position="absolute" top={`${bodyH - 2}px`} left={`${ov + bodyW / 2 - 60}px`} w="120px" h="9px" bg="gray-400" rounded-b="10px" />
        </>}
        {frame && desktop && <>
          <Box position="absolute" top={`${bodyH - 2}px`} left={`${bodyW / 2 - 55}px`} w="110px" h={`${f.base - 12}px`} bg="gray-300" border-x="1px solid" border-color="gray-400" />
          <Box position="absolute" top={`${bodyH + f.base - 16}px`} left={`${bodyW / 2 - 120}px`} w="240px" h="14px" bg="gray-300" rounded="full" border="1px solid" border-color="gray-400" shadow="md" />
        </>}
        {/* drag handles for the free-size viewport */}
        {resp && <>
          <Box position="absolute" top="0" left={`${sc.w}px`} w="14px" h={`${sc.h}px`} cursor="ew-resize" onPointerDown={drag('y')} hover-bg="primary/30" title="Drag to resize" />
          <Box position="absolute" top={`${sc.h}px`} left="0" w={`${sc.w}px`} h="14px" cursor="ns-resize" onPointerDown={drag('x')} hover-bg="primary/30" title="Drag to resize" />
          <Box position="absolute" top={`${sc.h}px`} left={`${sc.w}px`} w="18px" h="18px" rounded-br="8px" cursor="nwse-resize" onPointerDown={drag('xy')} bg="primary" title="Drag to resize" />
        </>}
      </Box>
    </Box>
  );
}

/* ---------- the stage ---------- */
export function PreviewStage() {
  const s = useStudio(); const project = s.project!;
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs); const [pop, setPop] = useState(false); const [popAt, setPopAt] = useState({ x: 12, y: 44 }); const [reload, setReload] = useState(0);
  const patch = (p: Partial<Prefs>) => setPrefs(cur => { const next = { ...cur, ...p }; savePrefs(next); return next; });
  const stageRef = useRef<HTMLDivElement | null>(null); const [box, setBox] = useState({ w: 800, h: 600 });
  useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el); setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // links inside the page: other pages switch the preview, external links open a new tab, anchors scroll inside the page
  useEffect(() => {
    const on = (ev: MessageEvent) => {
      const m = ev.data; if (!m || m.ast !== 'nav' || typeof m.href !== 'string') return;
      const id = pageForHref(S.getState().project!, m.href);
      if (id) { S.switchPage(id); return; }
      if (/^(https?:|mailto:|tel:)/i.test(m.href)) window.open(m.href, '_blank', 'noopener,noreferrer');
    };
    window.addEventListener('message', on); return () => window.removeEventListener('message', on);
  }, []);

  const dev = deviceById(prefs.device);
  const list: Device[] = prefs.compare ? prefs.set.map(deviceById) : [dev];
  const tick = s.previewTick;
  // phones and tablets hide the scrollbar like real touch devices; laptops and desktops keep theirs
  const htmlTouch = useMemo(() => buildPreviewHtml(project, { dark: prefs.dark, hideScrollbar: true, intercept: true, touch: prefs.touch }), [project, prefs.dark, prefs.touch, tick]);
  const darkNative = useMemo(() => hasDarkStyles(project), [project, tick]);
  const htmlDesk = useMemo(() => buildPreviewHtml(project, { dark: prefs.dark, hideScrollbar: false, intercept: true }), [project, prefs.dark, tick]);
  const htmlFor = (d: Device) => (d.kind === 'phone' || d.kind === 'tablet' ? htmlTouch : htmlDesk);

  const GAP = 56; const PAD = 28; const LABEL = 30;
  const fps = list.map(d => footprint(d, prefs.landscape, prefs.frame, prefs.rw, prefs.rh));
  const maxH = Math.max(...fps.map(f => f.h));
  const sumW = fps.reduce((a, f) => a + f.w, 0); const fitZ = Math.min(1, (box.w - PAD * 2 - GAP * (fps.length - 1)) / sumW, (box.h - PAD * 2 - LABEL) / maxH);
  const z = prefs.zoom === 'fit' ? Math.max(0.1, fitZ) : prefs.zoom;

  const pickDevice = (d: Device) => {
    if (prefs.compare) { patch({ set: prefs.set.includes(d.id) ? (prefs.set.length > 1 ? prefs.set.filter(x => x !== d.id) : prefs.set) : [...prefs.set, d.id] }); return; }
    patch({ device: d.id, landscape: canRotate(d) ? prefs.landscape : false }); setPop(false);
  };
  const pill = (on: boolean) => (on ? { bg: 'primary', text: 'white' } : { bg: 'transparent', ...T.hover, ...T.text });
  const Tool = ({ label, on, onClick, title, disabled }: { label: string; on?: boolean; onClick: () => void; title: string; disabled?: boolean }) => (
    <Btn type="button" title={title} aria-pressed={on} disabled={disabled} onClick={onClick} h="28px" px="2" rounded="lg" border="0" fontSize="sm" fontWeight="600" cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? '0.4' : '1'} shrink="0" {...pill(!!on)}>{label}</Btn>
  );
  const pages = project.pages;

  return (
    <Box display="flex" flex-col w="100%" h="100%" min-w="0">
      {/* toolbar */}
      <Row items="center" h="44px" px="3" gap="2" {...T.chrome} border-b="1px solid" shrink="0" wrap={false} overflow-x="auto">
        <Box position="relative" shrink="0">
          <Btn type="button" aria-expanded={pop} aria-label="Choose device" onClick={(e: React.MouseEvent<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); setPopAt({ x: Math.max(8, Math.min(r.left, window.innerWidth - 308)), y: r.bottom + 4 }); setPop(!pop); }} h="30px" px="2" rounded="lg" border="1px solid" cursor="pointer" display="flex" items="center" gap="2" {...T.hover} {...T.text} bg="transparent" {...T.hairline}>
            <ToolIcon n={prefs.compare ? 'desktop' : iconFor(dev)} size={18} />
            <Txt fontSize="sm" fontWeight="600" m="0" whitespace="nowrap">{prefs.compare ? `Compare · ${prefs.set.length} devices` : dev.name}</Txt>
            {!prefs.compare && <Txt fontSize="sm" m="0" whitespace="nowrap" {...T.muted}>{dev.kind === 'responsive' ? `${prefs.rw}×${prefs.rh}` : prefs.landscape && canRotate(dev) ? `${dev.h}×${dev.w}` : `${dev.w}×${dev.h}`}</Txt>}
            <ToolIcon n="chevron" size={14} />
          </Btn>
          {pop && <>
            <Box position="fixed" inset="0" z="89" onClick={() => setPop(false)} />
            <Box position="fixed" left={`${popAt.x}px`} top={`${popAt.y}px`} z="90" {...T.panel} p="1" w="300px" max-h={`${Math.max(240, (typeof window === 'undefined' ? 700 : window.innerHeight) - popAt.y - 16)}px`} overflow-y="auto" aria-label="Devices">
              {prefs.compare && <Txt fontSize="sm" m="0" px="2" py="1" {...T.muted}>Tick the devices to show side by side.</Txt>}
              {DEVICE_GROUPS.map(g => <Box key={g}>
                <Txt fontSize="sm" fontWeight="600" m="0" px="2" pt="2" pb="1" {...T.label}>{g}</Txt>
                {DEVICES.filter(d => d.group === g).map(d => {
                  const on = prefs.compare ? prefs.set.includes(d.id) : prefs.device === d.id;
                  return <Row key={d.id} items="center" gap="2" h="30px" px="2" rounded="lg" cursor="pointer" {...(on && !prefs.compare ? T.active : T.hover)} onClick={() => pickDevice(d)}>
                    <ToolIcon n={iconFor(d)} size={18} />
                    <Txt fontSize="sm" m="0" flex="1" truncate>{d.name}</Txt>
                    <Txt fontSize="sm" m="0" {...T.muted}>{d.kind === 'responsive' ? 'any' : `${d.w}×${d.h}`}</Txt>
                    {prefs.compare && <Txt fontSize="sm" m="0" w="14px" text="primary" fontWeight="700">{on ? '✓' : ''}</Txt>}
                  </Row>;
                })}
              </Box>)}
            </Box>
          </>}
        </Box>
        {!prefs.compare && dev.kind === 'responsive' && <Row items="center" gap="1" shrink="0"><Box w="64px"><NumField value={prefs.rw} min={240} onCommit={v => patch({ rw: Math.max(240, Math.round(v)) })} /></Box><Txt fontSize="sm" m="0" {...T.muted}>×</Txt><Box w="64px"><NumField value={prefs.rh} min={240} onCommit={v => patch({ rh: Math.max(240, Math.round(v)) })} /></Box></Row>}
        <Tool label="Rotate" title="Rotate between portrait and landscape" on={prefs.landscape} disabled={!prefs.compare && !canRotate(dev)} onClick={() => patch({ landscape: !prefs.landscape })} />
        <Box w="1px" h="18px" shrink="0" {...T.divider} />
        <Tool label="Compare" title="Show several devices side by side" on={prefs.compare} onClick={() => patch({ compare: !prefs.compare })} />
        <Tool label="Frame" title="Draw the device frame" on={prefs.frame} onClick={() => patch({ frame: !prefs.frame })} />
        <Tool label="Dark" title={darkNative ? 'Preview with dark mode on' : 'This page has no dark styles, so dark mode is simulated'} on={prefs.dark} onClick={() => patch({ dark: !prefs.dark })} />
        {prefs.dark && !darkNative && <Txt fontSize="sm" m="0" shrink="0" whitespace="nowrap" {...T.muted}>simulated</Txt>}
        <Tool label="Touch" title="Phones and tablets: mouse acts like a finger (drag to scroll)" on={prefs.touch} onClick={() => patch({ touch: !prefs.touch })} />
        <Box w="1px" h="18px" shrink="0" {...T.divider} />
        <Box w="150px" shrink="0"><SelectField value={prefs.net} options={NET_OPTS} onChange={v => patch({ net: v as Net })} /></Box>
        <Box w="92px" shrink="0"><SelectField value={prefs.zoom === 'fit' ? 'fit' : String(prefs.zoom)} options={ZOOM_OPTS} onChange={v => patch({ zoom: v === 'fit' ? 'fit' : Number(v) })} /></Box>
        <Txt fontSize="sm" m="0" shrink="0" {...T.muted}>{Math.round(z * 100)}%</Txt>
        <Tool label="Reload" title="Reload the page inside the device" onClick={() => setReload(r => r + 1)} />
        {pages.length > 1 && <Box w="150px" shrink="0"><SelectField value={project.activePageId} options={pages.map(p => [p.id, p.name] as [string, string])} onChange={id => S.switchPage(id)} /></Box>}
        <Box flex="1" />
        <Btn type="button" title="Exit preview (Esc)" onClick={() => S.setPreview(false)} h="28px" px="3" rounded="lg" border="0" bg="primary" text="white" fontSize="sm" fontWeight="600" cursor="pointer" shrink="0">Exit preview</Btn>
      </Row>

      {/* stage: scales to fit, scrolls when zoomed in or when many devices are compared */}
      <Box ref={stageRef} flex="1" min-h="0" overflow="auto" bg="gray-100" dark-bg="gray-900" bg-image="radial-gradient(circle, rgba(120,120,140,0.30) 1px, transparent 1px)" bg-size="20px 20px">
        <Box display="flex" items="center" justify="center" min-w="100%" min-h="100%" p={`${PAD}px`} gap={`${GAP}px`} w="fit-content">
          {list.map((d, i) => {
            const f = fps[i];
            return <Box key={d.id + i} display="flex" flex-col items="center" gap="2" flex="none">
              <Txt fontSize="sm" fontWeight="600" m="0" whitespace="nowrap" {...T.muted}>{d.name} · {f.sc.w}×{f.sc.h}</Txt>
              <DeviceView d={d} landscape={prefs.landscape} frame={prefs.frame} html={htmlFor(d)} z={z} rw={prefs.rw} rh={prefs.rh} reload={reload} dark={prefs.dark} loadMs={loadTime(prefs.net, new Blob([htmlFor(d)]).size)} netLabel={NET[prefs.net].label} bytes={new Blob([htmlFor(d)]).size} onResize={(w, h) => patch({ rw: w, rh: h })} />
            </Box>;
          })}
        </Box>
      </Box>
    </Box>
  );
}
