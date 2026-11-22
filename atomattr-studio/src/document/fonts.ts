import type { Project } from './types';

/* Web fonts. Three ways in: a Google Fonts family by name, any stylesheet URL (Bunny Fonts, Adobe Fonts, your own CDN),
   or an uploaded font file that travels inside the project. Exports get the matching <link> / @font-face in <head>. */

export type WebFont = {
  id: string; family: string; kind: 'google' | 'css' | 'file';
  /** google: weights to load. file: the single weight the file covers. */
  weights?: number[]; italic?: boolean;
  /** css: stylesheet address. */
  url?: string;
  /** file: the font as a data URL, plus its CSS format() name. */
  dataUrl?: string; format?: string;
};

export const FAMILY_OK = /^[A-Za-z0-9][A-Za-z0-9 _-]{0,59}$/;
export const isHttps = (u: string) => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };
export const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
export const WEIGHT_NAME: Record<number, string> = { 100: 'Thin', 200: 'Extra light', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold', 900: 'Black' };

/** The CSS font-family value to store on a node. */
export const familyValue = (f: Pick<WebFont, 'family'>, fallback = 'sans-serif') => `"${f.family}", ${fallback}`;

/** One Google Fonts stylesheet address for every Google family in the list. */
export function googleHref(fonts: WebFont[]): string {
  const g = fonts.filter(f => f.kind === 'google'); if (!g.length) return '';
  const parts = g.map(f => {
    const w = [...new Set(f.weights?.length ? f.weights : [400, 700])].sort((a, b) => a - b);
    const fam = f.family.trim().replace(/ +/g, '+');
    return f.italic ? `family=${fam}:ital,wght@${[...w.map(x => `0,${x}`), ...w.map(x => `1,${x}`)].join(';')}` : `family=${fam}:wght@${w.join(';')}`;
  });
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`;
}

const cssStr = (s: string) => s.replace(/["\\\n]/g, '');
export const fontFaceCss = (f: WebFont) => f.kind === 'file' && f.dataUrl && /^data:/.test(f.dataUrl)
  ? `@font-face{font-family:"${cssStr(f.family)}";src:url(${f.dataUrl}) format("${cssStr(f.format || 'woff2')}");font-weight:${f.weights?.[0] || 400};font-style:${f.italic ? 'italic' : 'normal'};font-display:swap}` : '';

/** The <head> markup for a project's web fonts. Empty when it has none. */
export function fontHead(project: Pick<Project, 'webFonts'>): string {
  const fonts = project.webFonts || []; if (!fonts.length) return '';
  const out: string[] = []; const g = googleHref(fonts); const css = fonts.filter(f => f.kind === 'css' && f.url && isHttps(f.url));
  if (g || css.length) out.push('<link rel="preconnect" href="https://fonts.googleapis.com">', '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
  if (g) out.push(`<link rel="stylesheet" href="${g}">`);
  for (const f of css) out.push(`<link rel="stylesheet" href="${f.url!.replace(/"/g, '%22')}">`);
  const faces = fonts.map(fontFaceCss).filter(Boolean).join('\n'); if (faces) out.push(`<style>\n${faces}\n</style>`);
  return out.join('\n');
}

/** Keeps the editor (and so the canvas) in step with the project's fonts. */
export function applyEditorFonts(project: Pick<Project, 'webFonts'> | null | undefined) {
  if (typeof document === 'undefined') return;
  const fonts = project?.webFonts || []; const head = document.head;
  const set = (id: string, make: () => HTMLElement | null) => { document.getElementById(id)?.remove(); const el = make(); if (el) { el.id = id; head.appendChild(el); } };
  const mk = (href: string) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; return l; };
  const g = googleHref(fonts); set('aa-webfont-google', () => (g ? mk(g) : null));
  fonts.filter(f => f.kind === 'css' && f.url && isHttps(f.url)).forEach((f, i) => set(`aa-webfont-css-${i}`, () => mk(f.url!)));
  for (let i = fonts.filter(f => f.kind === 'css').length; document.getElementById(`aa-webfont-css-${i}`); i++) document.getElementById(`aa-webfont-css-${i}`)!.remove();
  const faces = fonts.map(fontFaceCss).filter(Boolean).join('\n');
  set('aa-webfont-files', () => { if (!faces) return null; const s = document.createElement('style'); s.textContent = faces; return s; });
}

export const formatOf = (name: string): string | null => {
  const e = name.toLowerCase().split('.').pop();
  return e === 'woff2' ? 'woff2' : e === 'woff' ? 'woff' : e === 'ttf' ? 'truetype' : e === 'otf' ? 'opentype' : null;
};
