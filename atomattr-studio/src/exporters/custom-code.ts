import type { CustomCode, Page, Project } from '../document/types';
import { scaleVars } from '../document/scales';
import { analyticsHead } from '../document/analytics';
import { fontHead } from '../document/fonts';

/**
 * Custom CSS, JS and HTML.
 *
 * Exports include them as written. The Studio's own previews run in the Studio's origin, so they never execute project JS or
 * head HTML (a project file from someone else could carry anything): previews drop those parts, show custom CSS, and show
 * `embed` nodes inside a sandboxed iframe that has no access to the Studio.
 */
export const HEAD_START = '<!--ast-custom-head-->'; export const HEAD_END = '<!--/ast-custom-head-->';
export const EMBED_START = '<!--ast-embed-->'; export const EMBED_END = '<!--/ast-embed-->';

export const hasCustom = (c?: CustomCode) => !!(c && (c.css?.trim() || c.js?.trim() || c.head?.trim()));
const join = (...parts: Array<string | undefined>) => parts.map(p => p?.trim()).filter(Boolean).join('\n\n');

export const customCss = (project: Project, page?: Page) => join(scaleVars(project.scale), project.custom?.css, page?.custom?.css);
export const customHead = (project: Project, page?: Page) => join(fontHead(project), analyticsHead(project.analytics), project.custom?.head, page?.custom?.head);

/** Markers inside user content could end a protected region early, so they are removed from anything user-written. */
export const scrub = (text: string) => [HEAD_START, HEAD_END, EMBED_START, EMBED_END].reduce((t, m) => t.split(m).join(''), text);
/** Keeps a script or style body from closing its own tag. */
export const safeInline = (text: string, tag: 'script' | 'style') => text.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);

export const headBlock = (project: Project, page?: Page) => { const h = customHead(project, page); return h ? `${HEAD_START}\n${scrub(h)}\n${HEAD_END}` : ''; };
export const embedBlock = (html: string, indent = '') => `${indent}${EMBED_START}\n${scrub(html)}\n${indent}${EMBED_END}`;

/** Files a project adds to the static site: js/custom.js (project level) and js/<page>.js (page level). */
export function customScriptFiles(project: Project, pageFile: string, page: Page): { shared?: string; own?: { path: string; code: string } } {
  const own = page.custom?.js?.trim();
  return { shared: project.custom?.js?.trim() ? 'js/custom.js' : undefined, own: own ? { path: `js/${pageFile.replace(/\.html$/, '')}.js`, code: own } : undefined };
}

const attr = (t: string) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
/** Preview-safe HTML: removes custom head HTML and custom script tags, and swaps each embed for a sandboxed iframe. */
export function previewSafe(html: string): string {
  return html
    .replace(/<!--ast-custom-head-->[\s\S]*?<!--\/ast-custom-head-->/g, '')
    .replace(/<script\b[^>]*\bsrc="js\/(?:custom|[^"]+)\.js"[^>]*><\/script>/g, m => (/js\/behavior\.js/.test(m) ? m : ''))
    .replace(/<!--ast-embed-->([\s\S]*?)<!--\/ast-embed-->/g, (_m, inner: string) => `<iframe sandbox="allow-scripts" referrerpolicy="no-referrer" style="border:0;width:100%;height:100%;min-height:80px;display:block" srcdoc="${attr(inner)}"></iframe>`);
}
