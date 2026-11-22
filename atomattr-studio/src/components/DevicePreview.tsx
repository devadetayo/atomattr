import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type WheelEvent as RWheelEvent } from 'react';
import { Box, Btn as AtomBtn, Input, Txt } from 'atomattr/react';
import type { Project } from '../document/types';
import { buildPreviewPages, type PreviewPage } from '../exporters/preview';
import { simDark, simDarkJs, TOUCH_CSS, TOUCH_JS } from '../exporters/preview-html';
import { T as TH } from '../theme'; // not `T`: the device geometry below already has a `T` (top bezel)
import { BI } from './BarIcons';
import { AppearanceBody } from './Topbar';

/* ---------- devices ---------- */
type Kind = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'custom';
type Cam = 'island' | 'notch' | 'punch' | 'dot' | 'none';
type Dev = { id: string; label: string; group: string; kind: Kind; w: number; h: number; r: number; bx: number; bt: number; bb: number; cam: Cam; home?: boolean; bar?: boolean };

const DEVICES: Dev[] = [
  { id: 'iphone-se', label: 'iPhone SE', group: 'Phones', kind: 'phone', w: 375, h: 667, r: 6, bx: 14, bt: 62, bb: 62, cam: 'dot', home: true },
  { id: 'iphone-14', label: 'iPhone 14', group: 'Phones', kind: 'phone', w: 390, h: 844, r: 44, bx: 11, bt: 11, bb: 11, cam: 'notch', bar: true },
  { id: 'iphone-15', label: 'iPhone 15', group: 'Phones', kind: 'phone', w: 393, h: 852, r: 46, bx: 11, bt: 11, bb: 11, cam: 'island', bar: true },
  { id: 'iphone-15-pro', label: 'iPhone 15 Pro', group: 'Phones', kind: 'phone', w: 393, h: 852, r: 46, bx: 11, bt: 11, bb: 11, cam: 'island', bar: true },
  { id: 'iphone-15-pro-max', label: 'iPhone 15 Pro Max', group: 'Phones', kind: 'phone', w: 430, h: 932, r: 50, bx: 11, bt: 11, bb: 11, cam: 'island', bar: true },
  { id: 'pixel-8', label: 'Google Pixel 8', group: 'Phones', kind: 'phone', w: 412, h: 915, r: 34, bx: 8, bt: 8, bb: 8, cam: 'punch' },
  { id: 'galaxy-s24', label: 'Samsung Galaxy S24', group: 'Phones', kind: 'phone', w: 360, h: 780, r: 30, bx: 8, bt: 8, bb: 8, cam: 'punch' },
  { id: 'galaxy-s24-ultra', label: 'Galaxy S24 Ultra', group: 'Phones', kind: 'phone', w: 412, h: 915, r: 22, bx: 7, bt: 7, bb: 7, cam: 'punch' },
  { id: 'galaxy-fold', label: 'Galaxy Z Fold (folded)', group: 'Phones', kind: 'phone', w: 344, h: 882, r: 26, bx: 8, bt: 8, bb: 8, cam: 'punch' },
  { id: 'ipad-mini', label: 'iPad mini', group: 'Tablets', kind: 'tablet', w: 744, h: 1133, r: 22, bx: 20, bt: 20, bb: 20, cam: 'dot' },
  { id: 'ipad-air', label: 'iPad Air', group: 'Tablets', kind: 'tablet', w: 820, h: 1180, r: 22, bx: 20, bt: 20, bb: 20, cam: 'dot' },
  { id: 'ipad-pro-11', label: 'iPad Pro 11"', group: 'Tablets', kind: 'tablet', w: 834, h: 1194, r: 22, bx: 20, bt: 20, bb: 20, cam: 'dot' },
  { id: 'ipad-pro', label: 'iPad Pro 12.9"', group: 'Tablets', kind: 'tablet', w: 1024, h: 1366, r: 22, bx: 20, bt: 20, bb: 20, cam: 'dot' },
  { id: 'galaxy-tab', label: 'Samsung Galaxy Tab S9', group: 'Tablets', kind: 'tablet', w: 800, h: 1280, r: 16, bx: 16, bt: 16, bb: 16, cam: 'dot' },
  { id: 'macbook-air', label: 'MacBook Air 13"', group: 'Laptops', kind: 'laptop', w: 1440, h: 900, r: 8, bx: 16, bt: 26, bb: 16, cam: 'dot' },
  { id: 'macbook-pro-14', label: 'MacBook Pro 14"', group: 'Laptops', kind: 'laptop', w: 1512, h: 982, r: 8, bx: 16, bt: 26, bb: 16, cam: 'dot' },
  { id: 'macbook-pro-16', label: 'MacBook Pro 16"', group: 'Laptops', kind: 'laptop', w: 1728, h: 1117, r: 8, bx: 16, bt: 26, bb: 16, cam: 'dot' },
  { id: 'windows-laptop', label: 'Windows laptop', group: 'Laptops', kind: 'laptop', w: 1366, h: 768, r: 4, bx: 14, bt: 22, bb: 14, cam: 'dot' },
  { id: 'surface-laptop', label: 'Surface Laptop', group: 'Laptops', kind: 'laptop', w: 1504, h: 1002, r: 4, bx: 14, bt: 22, bb: 14, cam: 'dot' },
  { id: 'monitor-1080', label: 'Desktop 1080p', group: 'Desktops', kind: 'desktop', w: 1920, h: 1080, r: 4, bx: 12, bt: 12, bb: 34, cam: 'none' },
  { id: 'imac-24', label: 'iMac 24"', group: 'Desktops', kind: 'desktop', w: 2240, h: 1260, r: 4, bx: 14, bt: 14, bb: 56, cam: 'dot' },
  { id: 'monitor-1440', label: 'Desktop 1440p', group: 'Desktops', kind: 'desktop', w: 2560, h: 1440, r: 4, bx: 12, bt: 12, bb: 34, cam: 'none' },
  { id: 'custom', label: 'Custom size', group: 'Custom', kind: 'custom', w: 1280, h: 800, r: 10, bx: 2, bt: 2, bb: 2, cam: 'none' },
];
const GROUPS = ['Phones', 'Tablets', 'Laptops', 'Desktops', 'Custom'];
const ZOOMS = [25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200];

/** Rough connection profiles: bandwidth in bits per second and round-trip time in ms. */
type Net = 'off' | '4g' | 'slow4g' | '3g';
const NET: Record<Net, { label: string; note: string; bps: number; rtt: number }> = {
  off: { label: 'No throttling', note: 'Instant', bps: 0, rtt: 0 }, '4g': { label: 'Fast 4G', note: '9 Mbps', bps: 9e6, rtt: 170 },
  slow4g: { label: 'Slow 4G', note: '1.6 Mbps', bps: 1.6e6, rtt: 150 }, '3g': { label: 'Slow 3G', note: '0.8 Mbps', bps: 0.78e6, rtt: 300 },
};
/** Estimated time to load: three round trips (page, styles, images) plus the transfer time of the whole page. */
const loadTime = (net: Net, bytes: number) => (net === 'off' ? 0 : Math.min(12000, Math.round(NET[net].rtt * 3 + (bytes * 8 * 1000) / NET[net].bps)));
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

type Bg = { mode: 'dark' | 'light' | 'solid'; color: string };
const bgCss = (b: Bg) => b.mode === 'dark' ? 'radial-gradient(ellipse at 50% 28%, #2c303b 0%, #171920 58%, #0e0f13 100%)' : b.mode === 'light' ? 'radial-gradient(ellipse at 50% 28%, #ffffff 0%, #e4e8ef 62%, #d3d8e1 100%)' : b.color;

type Prefs = { device: string; landscape: boolean; bg: Bg; custom: { w: number; h: number }; touch: boolean; net: Net; dark: boolean; soft?: number };
const KEY = 'studio.devicePreview.v1';
const loadPrefs = (): Prefs => {
  const d: Prefs = { device: 'iphone-15-pro', landscape: false, bg: { mode: 'dark', color: '#20232b' }, custom: { w: 1280, h: 800 }, touch: true, net: 'off', dark: false };
  try { return { ...d, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return d; }
};

/* ---------- icons (inline SVG, stroke style) ---------- */
const Ic = ({ children, size = 20, fill }: { children: ReactNode; size?: number; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I = {
  close: <Ic><path d="M18 6 6 18M6 6l12 12" /></Ic>,
  rotateV: <Ic><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></Ic>,
  rotateH: <Ic><rect x="3" y="7" width="18" height="10" rx="2.5" /><path d="M18 11v2" /></Ic>,
  refresh: <Ic><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></Ic>,
  full: <Ic><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" /></Ic>,
  unfull: <Ic><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" /></Ic>,
  bg: <Ic><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" /></Ic>,
  plus: <Ic><path d="M12 5v14M5 12h14" /></Ic>,
  minus: <Ic><path d="M5 12h14" /></Ic>,
  fit: <Ic><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" /><rect x="8" y="8" width="8" height="8" rx="1.5" /></Ic>,
  actual: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="M8 10v4M7 11l1-1M15 10v4M14 11l1-1M11.6 11.4v.1M11.6 13.2v.1" /></svg>,
  chevron: <Ic size={16}><path d="m6 9 6 6 6-6" /></Ic>,
  check: <Ic size={16}><path d="m5 12 5 5 9-10" /></Ic>,
  touch: <Ic><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10" /><path d="M12 9.5a1.5 1.5 0 0 1 3 0V12" /><path d="M15 11a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L3.8 15.6a1.5 1.5 0 0 1 2.3-1.9L9 16" /></Ic>,
  moon: <Ic><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></Ic>,
  net: <Ic><path d="M4 20v-4M9 20v-8M14 20V9M19 20V4" /></Ic>,
  phone: <Ic size={18}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></Ic>,
  tablet: <Ic size={18}><rect x="4.5" y="3" width="15" height="18" rx="2.5" /><path d="M11 18h2" /></Ic>,
  laptop: <Ic size={18}><rect x="5" y="5" width="14" height="10" rx="1.5" /><path d="M2.5 19h19" /></Ic>,
  desktop: <Ic size={18}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M9 21h6M12 16v5" /></Ic>,
  custom: <Ic size={18}><path d="M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6" /></Ic>,
  pages: <Ic><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></Ic>,
};

/* Styling is AtomAttr attributes on these small components. Only the live device geometry stays inline, because it is computed per frame. */
/* The bars follow the Studio's light / dark mode and its theme colour: AtomAttr `dark-` variants and the `primary` token, no fixed colours.
   (The page inside the device has its own Dark switch; that one never touches the bars.) */
const BAR = { bg: 'white/45', 'dark-bg': 'gray-900/40', 'backdrop-blur': '24px', 'backdrop-saturate': '160' };
const FOCUS = { 'focus-visible-outline': '2px solid primary', 'focus-visible-outline-offset': '1px' };

const Btn = ({ t, on, act, dis, children, pressed }: { t: string; on?: () => void; act?: boolean; dis?: boolean; children: ReactNode; pressed?: boolean }) => {
  const p = pressed ?? act;
  return <AtomBtn type="button" title={t} aria-label={t} aria-pressed={p} disabled={dis} onClick={on}
    w="36px" h="36px" display="grid" place-items="center" border="0" rounded="lg" p="0" cursor={dis ? 'not-allowed' : 'pointer'} opacity={dis ? '.35' : undefined}
    {...(p ? TH.active : { bg: 'transparent', ...TH.text })} {...(dis ? {} : p ? { 'hover-bg': 'primary/25', 'dark-hover-bg': 'primary/35' } : TH.hover)}
    transition="all" duration="120" {...FOCUS}>{children}</AtomBtn>;
};
const Sep = () => <Box w="1px" h="20px" mx="4px" {...TH.divider} />;
const Cluster = (p: any) => <Box display="flex" items="center" gap="2" min-w="0" {...p} />;
const Glass = (p: any) => <Box {...TH.glass} {...p} />;
const Pop = (p: any) => <Box position="absolute" top="54px" p="8px" min-w="196px" z="5" {...TH.glassPop} rounded="14px" {...p} />;
const Group = ({ children }: { children: ReactNode }) => <Box font-size="sm" font-weight="700" tracking="0.09em" uppercase pt="6px" px="10px" pb="8px" {...TH.muted}>{children}</Box>;
const Ico = ({ children }: { children: ReactNode }) => <Txt display="inline-flex" shrink="0" opacity=".8">{children}</Txt>;
const Sub = (p: any) => <Txt as="small" opacity=".62" font-size="sm" ml="auto" pl="20px" whitespace="nowrap" {...p} />;
const Item = ({ active, children, ...rest }: any) => <AtomBtn type="button" display="flex" items="center" justify="space-between" gap="8px" w="100%" min-h="40px" border="0" rounded="10px" px="12px" py="8px" mb="2px" cursor="pointer"
  text-align="left" font-size="sm" font-family="inherit" {...(active ? { bg: 'primary', text: 'white', 'dark-text': 'white', 'hover-bg': 'primary' } : { bg: 'transparent', ...TH.hover, ...TH.text })} {...FOCUS} {...rest}>{children}</AtomBtn>;
const Trigger = ({ open, children, ...rest }: any) => <AtomBtn type="button" display="flex" items="center" gap="9px" h="38px" pl="11px" pr="9px" border="1px solid" rounded="6px" cursor="pointer"
  font-size="sm" font-weight="600" font-family="inherit" whitespace="nowrap" transition="all" duration="120" {...TH.text}
  {...(open ? { 'border-color': 'primary', bg: 'primary/15', 'dark-bg': 'primary/25' } : { 'border-color': 'gray-200', 'dark-border-color': 'gray-700', bg: 'gray-100', 'dark-bg': 'gray-800', 'hover-bg': 'gray-200', 'dark-hover-bg': 'gray-700' })} {...FOCUS} {...rest}>{children}</AtomBtn>;

export function DevicePreview({ project, getProject, onClose }: { project: Project; getProject: () => Project; onClose: () => void }) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [pages, setPages] = useState<PreviewPage[]>(() => buildPreviewPages(project));
  const [file, setFile] = useState<string>(() => { const i = Math.max(0, project.pages.findIndex(p => p.id === project.activePageId)); return buildPreviewPages(project)[i]?.file || 'index.html'; });
  const [hash, setHash] = useState('');
  const [reload, setReload] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(true);
  const [pop, setPop] = useState<null | 'bg' | 'pages' | 'dev' | 'net' | 'look' | 'dark'>(null);
  const [isFs, setIsFs] = useState(false);
  const [box, setBox] = useState({ w: 1200, h: 800 });
  const root = useRef<HTMLDivElement>(null); const stage = useRef<HTMLDivElement>(null); const frame = useRef<HTMLIFrameElement>(null);

  const dev0 = DEVICES.find(d => d.id === prefs.device) || DEVICES[0];
  const dev: Dev = dev0.kind === 'custom' ? { ...dev0, w: prefs.custom.w, h: prefs.custom.h } : dev0;
  const rotatable = dev.kind === 'phone' || dev.kind === 'tablet' || dev.kind === 'custom'; const land = rotatable && prefs.landscape;
  const sw = land ? dev.h : dev.w; const sh = land ? dev.w : dev.h;
  // Bezels: portrait uses (sides, top, bottom); landscape turns the device, so the old top and bottom become left and right.
  const L = land && dev.kind !== 'custom' ? dev.bt : dev.bx; const R = land && dev.kind !== 'custom' ? dev.bb : dev.bx;
  const T = land && dev.kind !== 'custom' ? dev.bx : dev.bt; const B = land && dev.kind !== 'custom' ? dev.bx : dev.bb;
  const ow = sw + L + R; const frameH = sh + T + B; const baseH = dev.kind === 'laptop' ? 20 : dev.kind === 'desktop' ? 78 : 0; const oh = frameH + baseH;
  const outerR = dev.kind === 'custom' ? dev.r + 2 : dev.r + Math.min(L, T);

  const save = useCallback((p: Partial<Prefs>) => setPrefs(cur => { const n = { ...cur, ...p }; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* storage may be full or blocked */ } return n; }), []);

  // Stage size, for "fit to screen".
  useLayoutEffect(() => {
    const el = stage.current; if (!el) return; const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el); setBox({ w: el.clientWidth, h: el.clientHeight }); return () => ro.disconnect();
  }, []);
  const PAD = { l: 32, r: 32, t: 108, b: 96 };
  const fitScale = Math.max(0.1, Math.min(1.5, (box.w - PAD.l - PAD.r) / (ow + 8), (box.h - PAD.t - PAD.b) / (oh + 8)));
  const scale = fit ? fitScale : zoom;
  const pct = Math.round(scale * 100);

  const setManual = (z: number) => { setFit(false); setZoom(Math.min(4, Math.max(0.1, z))); };
  const step = (dir: 1 | -1) => { const cur = Math.round(scale * 100); const next = dir > 0 ? ZOOMS.find(z => z > cur) ?? 200 : [...ZOOMS].reverse().find(z => z < cur) ?? 25; setManual(next / 100); };

  const fs = () => { const el = root.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen?.().catch(() => { /* fullscreen can be refused by the browser */ }); };
  // Clicking into the site moves focus into the frame (which never bubbles to us), so close open popovers when the window loses focus.
  useEffect(() => { const b = () => setPop(cur => (cur === 'look' ? cur : null)); window.addEventListener('blur', b); return () => window.removeEventListener('blur', b); }, []);
  useEffect(() => { const f = () => setIsFs(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f); }, []);
  useEffect(() => () => { if (document.fullscreenElement) void document.exitFullscreen(); }, []);

  const refresh = () => { setPages(buildPreviewPages(getProject())); setReload(n => n + 1); };

  // Messages from the previewed page: switch page, Esc.
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return; const d = e.data || {};
      if (d.type === 'studio-preview-go' && pages.some(p => p.file === d.file)) { setFile(d.file); setHash(d.hash || ''); setReload(n => n + 1); }
      if (d.type === 'studio-preview-esc' && !document.fullscreenElement) onClose();
    };
    window.addEventListener('message', on); return () => window.removeEventListener('message', on);
  }, [pages, onClose]);

  // Keyboard on the shell.
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      if (e.key === 'Escape' && !document.fullscreenElement) { e.stopPropagation(); if (pop) setPop(null); else onClose(); }
      else if ((e.key === '+' || e.key === '=') && !e.ctrlKey && !e.metaKey) step(1);
      else if (e.key === '-' && !e.ctrlKey && !e.metaKey) step(-1);
      else if (e.key === '0') setFit(true);
    };
    window.addEventListener('keydown', kd, true); return () => window.removeEventListener('keydown', kd, true);
  });

  const page = pages.find(p => p.file === file) || pages[0];
  const touchDev = dev.kind === 'phone' || dev.kind === 'tablet';
  const touch = touchDev && prefs.touch;
  const hasDark = !!page && page.html.includes('html.dark');
  const html = useMemo(() => {
    if (!page) return '';
    let h = page.html;
    if (prefs.dark) h = h.replace(/<html\b([^>]*)>/i, (m, a) => (/\sclass="/.test(a) ? m.replace(/class="/, 'class="dark ') : `<html${a} class="dark">`));
    const css = `${touchDev ? 'html{scrollbar-width:none}::-webkit-scrollbar{display:none}' : ''}${prefs.dark && !hasDark ? simDark(prefs.soft ?? 0.86) : ''}${touch ? TOUCH_CSS : ''}`;
    h = h.replace(/<\/head>/i, () => `<style>${css}</style>${touch ? `<script>${TOUCH_JS}</script>` : ''}</head>`);
    if (prefs.dark && !hasDark) h = h.replace(/<\/body>/i, () => `<script>${simDarkJs(prefs.soft ?? 0.86)}</script></body>`);
    return h;
  }, [page, touchDev, touch, prefs.dark, prefs.soft, hasDark]);
  // Simulated slow connection: hold a loading screen for the estimated time whenever a page (re)loads.
  const bytes = useMemo(() => (page ? page.html.length + 90 * 1024 * new Set(page.html.match(/https:\/\/images\.unsplash\.com\/[^"')\s]+/g) || []).size : 0), [page]);
  const loadMs = loadTime(prefs.net, bytes);
  const [prog, setProg] = useState(100);
  useEffect(() => {
    if (!loadMs) { setProg(100); return; }
    setProg(0); const t0 = Date.now();
    const id = setInterval(() => { const v = Math.min(100, ((Date.now() - t0) / loadMs) * 100); setProg(v); if (v >= 100) clearInterval(id); }, 60);
    return () => clearInterval(id);
  }, [file, reload, loadMs]);
  const onLoad = () => { if (!hash) return; try { frame.current?.contentDocument?.getElementById(hash)?.scrollIntoView(); } catch { /* cross-origin frames cannot be scripted */ } };

  const wheel = (e: RWheelEvent) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); step(e.deltaY < 0 ? 1 : -1); } };

  /* ---------- frame ---------- */
  const dark = '#101116';
  const ink = prefs.dark ? '#fff' : '#111'; const paper = prefs.dark ? '#0b0b0e' : '#fff';
  // What real hardware reserves above and beside the page: status bar under the camera, side insets in landscape.
  const insetTop = dev.kind === 'phone' ? (land ? 0 : { island: 52, notch: 46, punch: 36, dot: 20, none: 0 }[dev.cam]) : dev.kind === 'tablet' ? 24 : 0;
  const insetSide = dev.kind === 'phone' && land && (dev.cam === 'island' || dev.cam === 'notch') ? 52 : 0;
  const barCy = dev.kind === 'tablet' ? 12 : { island: 28, notch: 24, punch: 20, dot: 10, none: 10 }[dev.cam];
  const lf = Math.min(44, Math.max(14, 15 / scale));
  const camEl = (() => {
    if (dev.cam === 'island') return land ? <div style={{ position: 'absolute', left: 11, top: '50%', marginTop: -55, width: 32, height: 110, borderRadius: 16, background: '#000' }} /> : <div style={{ position: 'absolute', top: 11, left: '50%', marginLeft: -55, width: 110, height: 32, borderRadius: 16, background: '#000' }} />;
    if (dev.cam === 'notch') return land ? <div style={{ position: 'absolute', left: 0, top: '50%', marginTop: -78, width: 30, height: 156, borderRadius: '0 18px 18px 0', background: '#000' }} /> : <div style={{ position: 'absolute', top: 0, left: '50%', marginLeft: -78, width: 156, height: 30, borderRadius: '0 0 18px 18px', background: '#000' }} />;
    if (dev.cam === 'punch') return land ? <div style={{ position: 'absolute', left: 12, top: '50%', width: 14, height: 14, marginTop: -7, borderRadius: 7, background: '#000' }} /> : <div style={{ position: 'absolute', top: 12, left: '50%', width: 14, height: 14, marginLeft: -7, borderRadius: 7, background: '#000' }} />;
    return null;
  })();
  const sideCam = dev.cam === 'dot' ? (dev.kind === 'laptop' ? <div style={{ position: 'absolute', top: 9, left: '50%', width: 8, height: 8, marginLeft: -4, borderRadius: 4, background: '#2a2c33', boxShadow: 'inset 0 0 0 2px #181a20' }} /> : dev.kind === 'desktop' ? <div style={{ position: 'absolute', top: 5, left: '50%', width: 6, height: 6, marginLeft: -3, borderRadius: 3, background: '#2a2c33' }} /> : land && dev.kind === 'phone' ? <div style={{ position: 'absolute', left: 22, top: '50%', width: 8, height: 8, marginTop: -4, borderRadius: 4, background: '#2a2c33' }} /> : <div style={{ position: 'absolute', top: dev.kind === 'tablet' ? 7 : 26, left: '50%', width: 8, height: 8, marginLeft: -4, borderRadius: 4, background: '#2a2c33' }} />) : null;
  const homeBtn = dev.home ? (land ? <div style={{ position: 'absolute', right: 15, top: '50%', width: 38, height: 38, marginTop: -19, borderRadius: 19, border: '2px solid #3a3c44' }} /> : <div style={{ position: 'absolute', bottom: 12, left: '50%', width: 38, height: 38, marginLeft: -19, borderRadius: 19, border: '2px solid #3a3c44' }} />) : null;
  const buttons = dev.kind === 'phone' && !dev.home ? (land
    ? <>{[[70, 40], [120, 40]].map(([x, w], i) => <div key={i} style={{ position: 'absolute', top: -3, left: x, width: w, height: 3, borderRadius: 2, background: '#2b2d34' }} />)}<div style={{ position: 'absolute', bottom: -3, left: 110, width: 70, height: 3, borderRadius: 2, background: '#2b2d34' }} /></>
    : <>{[[96, 30], [140, 56], [206, 56]].map(([y, h], i) => <div key={i} style={{ position: 'absolute', left: -3, top: y, width: 3, height: h, borderRadius: 2, background: '#2b2d34' }} />)}<div style={{ position: 'absolute', right: -3, top: 170, width: 3, height: 86, borderRadius: 2, background: '#2b2d34' }} /></>) : null;
  const indicator = dev.bar ? <div style={{ position: 'absolute', bottom: 8, left: '50%', width: land ? 120 : 134, height: 5, marginLeft: land ? -60 : -67, borderRadius: 3, background: '#fff', mixBlendMode: 'difference', opacity: 0.85 }} /> : null;
  const statusBar = insetTop > 0 ? (
    <div style={{ position: 'absolute', left: 0, top: 0, width: sw, height: insetTop, background: paper, zIndex: 1, pointerEvents: 'none' }}>
      <span style={{ position: 'absolute', left: dev.kind === 'phone' ? 34 : 20, top: barCy - 9, font: '700 15px/18px system-ui,-apple-system,sans-serif', color: ink }}>9:41</span>
      <span style={{ position: 'absolute', right: dev.kind === 'phone' ? 30 : 20, top: barCy - 6, height: 12, display: 'flex', alignItems: 'flex-end', gap: 8, color: ink }}>
        <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 11 }}>{[4, 6, 8, 11].map(h => <i key={h} style={{ width: 3, height: h, borderRadius: 1, background: ink, display: 'block' }} />)}</span>
        <span style={{ width: 24, height: 11, borderRadius: 3.5, border: `1.5px solid ${ink}`, padding: 1.5, boxSizing: 'border-box', display: 'block', opacity: 0.9 }}><i style={{ display: 'block', width: '72%', height: '100%', borderRadius: 1.5, background: ink }} /></span>
      </span>
    </div>) : null;
  const loading = prog < 100 ? (
    <div role="status" aria-live="polite" style={{ position: 'absolute', inset: 0, zIndex: 2, background: paper, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: lf * 0.9, color: ink, font: `500 ${lf}px/1.35 system-ui,-apple-system,sans-serif`, textAlign: 'center', padding: `0 ${lf * 1.5}px` }}>
      <div style={{ width: '56%', height: Math.max(6, lf * 0.4), borderRadius: 99, background: prefs.dark ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.1)', overflow: 'hidden' }}><div style={{ width: `${prog}%`, height: '100%', background: 'var(--primary, #4f46e5)', borderRadius: 99 }} /></div>
      <div style={{ opacity: 0.7 }}>Loading on {NET[prefs.net].label}… about {(loadMs / 1000).toFixed(1)}s · {kb(bytes)}</div>
    </div>) : null;

  const device = (
    <div style={{ position: 'relative', width: ow, height: oh }}>
      <div style={{ position: 'relative', width: ow, height: frameH, borderRadius: dev.kind === 'laptop' ? `${outerR + 6}px ${outerR + 6}px 6px 6px` : outerR, background: dev.kind === 'custom' ? '#2a2d35' : dark, boxShadow: dev.kind === 'custom' ? '0 30px 70px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.1)' : '0 0 0 2px #3a3c45, 0 0 0 4px #0b0b0e, 0 38px 80px rgba(0,0,0,.5), inset 0 0 0 1.5px #23252c' }}>
        {buttons}
        <div style={{ position: 'absolute', left: L, top: T, width: sw, height: sh, borderRadius: dev.r, overflow: 'hidden', background: insetSide ? paper : '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,.6)' }}>
          {statusBar}
          <div style={{ position: 'absolute', left: insetSide, top: insetTop, width: sw - insetSide * 2, height: sh - insetTop }}>
            <iframe ref={frame} key={`${file}-${reload}`} title="Live preview" srcDoc={html} onLoad={onLoad} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox" style={{ width: sw - insetSide * 2, height: sh - insetTop, border: 0, display: 'block', background: '#fff' }} />
          </div>
          {loading}
          <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>{camEl}{indicator}</div>
        </div>
        {sideCam}{homeBtn}
      </div>
      {dev.kind === 'laptop' && <div style={{ position: 'absolute', left: -ow * 0.045, width: ow * 1.09, top: frameH - 1, height: baseH, borderRadius: '0 0 22px 22px', background: 'linear-gradient(180deg,#cfd2d8 0%,#a3a7af 60%,#8d9199 100%)', boxShadow: '0 22px 40px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.7)' }}><div style={{ margin: '0 auto', width: 150, height: 7, borderRadius: '0 0 10px 10px', background: 'linear-gradient(180deg,#8a8e96,#b3b7be)' }} /></div>}
      {dev.kind === 'desktop' && <>
        <div style={{ position: 'absolute', left: ow / 2 - 60, top: frameH - 1, width: 120, height: baseH - 12, background: 'linear-gradient(90deg,#8d9199,#d6d9df 45%,#8d9199)' }} />
        <div style={{ position: 'absolute', left: ow / 2 - 150, top: frameH + baseH - 16, width: 300, height: 16, borderRadius: '8px 8px 14px 14px', background: 'linear-gradient(180deg,#d6d9df,#9498a0)', boxShadow: '0 22px 40px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.7)' }} />
      </>}
    </div>
  );

  const swatch = (css: string, active: boolean, label: string, on: () => void) => <AtomBtn type="button" title={label} aria-label={label} onClick={on} w="34px" h="34px" rounded="lg" p="0" cursor="pointer" border={active ? '2px solid' : '1px solid'} border-color={active ? 'primary' : 'gray-300'} dark-border-color={active ? 'primary' : 'gray-600'} bg-image={css} />;
  const num = (v: number, on: (n: number) => void, label: string) => <Input type="number" min={200} max={4000} aria-label={label} value={v} onChange={(e: any) => on(Math.min(4000, Math.max(200, Number(e.target.value) || 200)))} w="64px" h="28px" px="8px" font-size="sm" font-family="inherit" {...TH.field} />;
  const barDown = (e: React.PointerEvent) => { e.stopPropagation(); if (!(e.target as HTMLElement).closest('[data-pop]')) setPop(null); };

  return (
    <Box ref={root} position="fixed" inset="0" z="300" font-size="sm" font-weight="500" leading="1.2" font-family='system-ui,-apple-system,"Segoe UI",sans-serif' {...TH.text} user-select="none" role="dialog" aria-label="Device preview" onPointerDown={() => pop && setPop(null)}>
      {/* background + scrolling stage */}
      <div ref={stage} onWheel={wheel} style={{ position: 'absolute', inset: 0, overflow: 'auto', background: bgCss(prefs.bg), display: 'flex', scrollbarWidth: 'thin', scrollbarColor: 'rgba(128,128,140,.45) transparent' }}>
        <div style={{ margin: 'auto', padding: `${PAD.t}px ${PAD.r}px ${PAD.b}px ${PAD.l}px`, boxSizing: 'content-box' }}>
          <div style={{ width: ow * scale, height: oh * scale, position: 'relative' }}>
            <div style={{ width: ow, height: oh, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'absolute', left: 0, top: 0 }}>{device}</div>
          </div>
        </div>
      </div>

      {/* top bar: close + device on the left, view controls in the middle, simulation controls on the right */}
      <Box {...BAR} border-b="1px solid" border-color="gray-200" dark-border-color="gray-700" position="absolute" top="0" left="0" right="0" h="60px" display="flex" items="center" justify="space-between" gap="16px" px="14px" z="4" onPointerDown={barDown}>
        <Cluster>
          <Btn t="Close preview (Esc)" on={onClose}>{I.close}</Btn>
          <Sep />
          <Box position="relative" data-pop="">
            <Trigger open={pop === 'dev'} aria-haspopup="listbox" aria-expanded={pop === 'dev'} aria-label={`Device: ${dev.label}. Change device`} onClick={() => setPop(pop === 'dev' ? null : 'dev')}>
              <Ico>{I[dev.kind]}</Ico><span>{dev.label}</span><Sub display="none" lg-display="inline" font-weight="500" font-size="sm" opacity=".6">{sw}×{sh}</Sub><Ico>{I.chevron}</Ico>
            </Trigger>
            {pop === 'dev' && <Pop role="listbox" aria-label="Devices" left="0" w="300px" max-h="min(68vh,580px)" overflow-y="auto" scrollbar-width="thin">
              {GROUPS.map(g => <div key={g}>
                <Group>{g}</Group>
                {DEVICES.filter(d => d.group === g).map(d => <div key={d.id}>
                  <Item role="option" aria-selected={prefs.device === d.id} active={prefs.device === d.id} onClick={() => { save({ device: d.id }); if (d.kind !== 'custom') setPop(null); }}>
                    <Box as="span" display="flex" items="center" gap="10px" min-w="0"><Ico>{I[d.kind]}</Ico><span>{d.label}</span></Box>
                    {d.kind === 'custom' ? null : prefs.device === d.id ? I.check : <Sub>{d.w}×{d.h}</Sub>}
                  </Item>
                  {d.kind === 'custom' && prefs.device === 'custom' && <Box display="flex" items="center" gap="6px" px="10px" pt="6px" pb="8px">
                    {num(prefs.custom.w, w => save({ custom: { ...prefs.custom, w } }), 'Width')}<Txt opacity=".6">×</Txt>{num(prefs.custom.h, h => save({ custom: { ...prefs.custom, h } }), 'Height')}
                  </Box>}
                </div>)}
              </div>)}
            </Pop>}
          </Box>
        </Cluster>

        <Cluster>
          <Btn t={rotatable ? (land ? 'Portrait' : 'Landscape') : 'This device stays in landscape'} on={() => save({ landscape: !prefs.landscape })} dis={!rotatable}>{land ? I.rotateH : I.rotateV}</Btn>
          <Btn t="Refresh preview" on={refresh}>{I.refresh}</Btn>
          {pages.length > 1 && <Box position="relative" data-pop="">
            <Btn t="Pages" on={() => setPop(pop === 'pages' ? null : 'pages')} pressed={pop === 'pages'}>{I.pages}</Btn>
            {pop === 'pages' && <Pop left="-8px">{pages.map(p => <Item key={p.file} active={p.file === file} onClick={() => { setFile(p.file); setHash(''); setReload(n => n + 1); setPop(null); }}>{p.name}</Item>)}</Pop>}
          </Box>}
        </Cluster>

        <Cluster>
          <Btn t={touchDev ? 'Touch mode: the mouse acts like a finger (drag to scroll)' : 'Touch mode applies to phones and tablets'} on={() => save({ touch: !prefs.touch })} dis={!touchDev} pressed={touch}>{I.touch}</Btn>
          <Box position="relative" data-pop="">
            <Trigger open={pop === 'net'} h="36px" {...(prefs.net !== 'off' ? { bg: 'primary/20', 'dark-bg': 'primary/30', 'border-color': 'primary', 'dark-border-color': 'primary' } : {})} aria-haspopup="menu" aria-expanded={pop === 'net'} aria-label={`Network: ${NET[prefs.net].label}`} title="Simulate a slow connection" onClick={() => setPop(pop === 'net' ? null : 'net')}>
              <Ico>{I.net}</Ico><Txt display="none" lg-display="inline" font-size="sm" font-weight="600" opacity=".85" px="4px">{NET[prefs.net].label}</Txt><Ico>{I.chevron}</Ico>
            </Trigger>
            {pop === 'net' && <Pop role="menu" right="0" min-w="250px">
              <Group>Connection</Group>
              {(Object.keys(NET) as Net[]).map(k => <Item key={k} role="menuitemradio" aria-checked={prefs.net === k} active={prefs.net === k} onClick={() => { save({ net: k }); setReload(n => n + 1); setPop(null); }}><Box flex="1">{NET[k].label}</Box>{prefs.net === k ? I.check : <Sub>{NET[k].note}</Sub>}</Item>)}
            </Pop>}
          </Box>
          <Box position="relative" data-pop="">
            <Btn t={hasDark ? 'Dark mode' : 'Dark mode (simulated: this page has no dark styles)'} on={() => setPop(pop === 'dark' ? null : 'dark')} pressed={prefs.dark || pop === 'dark'}>{I.moon}</Btn>
            {pop === 'dark' && <Pop right="-8px" w="264px" p="12px" role="dialog" aria-label="Dark mode">
              <Item active={prefs.dark} onClick={() => save({ dark: !prefs.dark })}><span>{prefs.dark ? 'Dark mode is on' : 'Turn dark mode on'}</span></Item>
              {hasDark
                ? <Txt display="block" fontSize="sm" m="0" px="2px" pt="8px" {...TH.muted} leading="snug">This page has its own dark styles (dark- attributes), so the preview uses them as written.</Txt>
                : <Box pt="10px" px="2px">
                    <Box display="flex" items="center" justify="space-between" mb="6px"><Txt fontSize="sm" fontWeight="600" {...TH.text}>Softness</Txt><Txt fontSize="sm" {...TH.muted}>{Math.round((1 - (prefs.soft ?? 0.86)) / 0.3 * 100)}%</Txt></Box>
                    <input type="range" aria-label="Dark mode softness" min={0} max={100} value={Math.round((1 - (prefs.soft ?? 0.86)) / 0.3 * 100)} onChange={e => save({ soft: Math.round((1 - Number(e.target.value) * 0.003) * 1000) / 1000 })} style={{ width: '100%', accentColor: 'var(--primary, #4f46e5)' }} />
                    <Txt display="block" fontSize="sm" m="0" pt="6px" {...TH.muted} leading="snug">This page has no dark styles, so dark mode is simulated. Higher is a softer charcoal, lower is closer to pure black. Photos are left alone.</Txt>
                  </Box>}
            </Pop>}
          </Box>
          <Sep />
          <Box position="relative" data-pop="">
            <Btn t="Appearance and theme colour (the editor, not the page)" on={() => setPop(pop === 'look' ? null : 'look')} pressed={pop === 'look'}>{BI.palette}</Btn>
            {pop === 'look' && <Pop right="-8px" w="296px" p="12px" role="dialog" aria-label="Appearance"><AppearanceBody /></Pop>}
          </Box>
          <Box position="relative" data-pop="">
            <Btn t="Background" on={() => setPop(pop === 'bg' ? null : 'bg')} pressed={pop === 'bg'}>{I.bg}</Btn>
            {pop === 'bg' && <Pop right="-8px" display="flex" gap="8px" items="center" p="10px">
              {swatch(bgCss({ mode: 'dark', color: '' }), prefs.bg.mode === 'dark', 'Dark gradient', () => save({ bg: { ...prefs.bg, mode: 'dark' } }))}
              {swatch(bgCss({ mode: 'light', color: '' }), prefs.bg.mode === 'light', 'Light gradient', () => save({ bg: { ...prefs.bg, mode: 'light' } }))}
              <Box as="label" title="Custom colour" position="relative" w="34px" h="34px" rounded="lg" overflow="hidden" cursor="pointer" bg={prefs.bg.color} border={prefs.bg.mode === 'solid' ? '2px solid' : '1px solid'} border-color={prefs.bg.mode === 'solid' ? 'primary' : 'gray-300'} dark-border-color={prefs.bg.mode === 'solid' ? 'primary' : 'gray-600'}>
                <Input type="color" aria-label="Custom background colour" value={prefs.bg.color} onChange={(e: any) => save({ bg: { mode: 'solid', color: e.target.value } })} position="absolute" inset="-6px" w="50px" h="50px" opacity="0" cursor="pointer" />
              </Box>
            </Pop>}
          </Box>
          <Btn t={isFs ? 'Exit full screen' : 'Full screen'} on={fs}>{isFs ? I.unfull : I.full}</Btn>
        </Cluster>
      </Box>

      {/* bottom floating controls */}
      <Glass position="absolute" bottom="16px" left="50%" translate-x="-50%" display="flex" items="center" gap="2" p="5px" rounded="6px" z="4" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
        <Btn t="Zoom out (-)" on={() => step(-1)}>{I.minus}</Btn>
        <AtomBtn type="button" title="Zoom level" aria-label={`Zoom ${pct}%`} onClick={() => setFit(true)} w="54px" h="36px" border="0" rounded="lg" bg="transparent" {...TH.hover} {...TH.text} font-size="sm" font-weight="600" font-family="inherit" cursor="pointer" {...FOCUS}>{pct}%</AtomBtn>
        <Btn t="Zoom in (+)" on={() => step(1)}>{I.plus}</Btn>
        <Sep />
        <Btn t="Fit to screen (0)" on={() => setFit(true)} act={fit}>{I.fit}</Btn>
        <Btn t="Actual size (100%)" on={() => setManual(1)} act={!fit && Math.abs(zoom - 1) < 0.005}>{I.actual}</Btn>
      </Glass>
    </Box>
  );
}
