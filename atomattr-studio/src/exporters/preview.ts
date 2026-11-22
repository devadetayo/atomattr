import type { Project } from '../document/types';
import { buildSiteFiles, pageFiles } from './site';
import { previewSafe } from './custom-code';

/** One page of the project as a single, self-contained HTML document (CSS, behaviour script and images inlined) for the device preview. */
export type PreviewPage = { file: string; name: string; html: string };

const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif', mp4: 'video/mp4', webm: 'video/webm', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf' };
const b64 = (u: Uint8Array) => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const safeScript = (js: string) => js.replace(/<\/script/gi, '<\\/script');

/** Runs inside the previewed page: hash links scroll, page links ask the preview to switch page, external links open a new tab, forms do not navigate away. */
const bridge = (files: string[]) => `<script>(function(){var pages=${JSON.stringify(files)};
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a||e.defaultPrevented)return;var h=a.getAttribute('href')||'';
if(h===''||h==='#'){e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});return;}
if(h.charAt(0)==='#'){e.preventDefault();var t=document.getElementById(h.slice(1))||document.querySelector('[name="'+h.slice(1)+'"]');if(t)t.scrollIntoView({behavior:'smooth'});return;}
var file=h.split('#')[0].replace(/^\\.\\//,'');
if(pages.indexOf(file)>-1){e.preventDefault();parent.postMessage({type:'studio-preview-go',file:file,hash:h.split('#')[1]||''},'*');return;}
e.preventDefault();if(/^(https?:)?\\/\\//.test(h))window.open(h,'_blank','noopener');},true);
document.addEventListener('submit',function(e){e.preventDefault();},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape')parent.postMessage({type:'studio-preview-esc'},'*');},true);
})();</script>`;

export function buildPreviewPages(project: Project): PreviewPage[] {
  const files = buildSiteFiles(project);
  const byPath = new Map(files.map(f => [f.path, f.data] as const));
  const names = pageFiles(project);
  const asset = (m: string, q: string, path: string) => {
    const d = byPath.get(path.replace(/^\.\.\//, '')); if (!(d instanceof Uint8Array)) return m;
    return `${q}data:${MIME[path.split('.').pop()!.toLowerCase()] || 'application/octet-stream'};base64,${b64(d)}`;
  };
  const inlineAssets = (t: string) => t.replace(/(["'(=])((?:\.\.\/)?assets\/[^"')\s>]+)/g, (m, q, p) => asset(m, q, p));
  const behavior = byPath.get('js/behavior.js');
  return project.pages.map((page, i) => {
    let html = String(byPath.get(names[i]) ?? '');
    const css = String(byPath.get(`css/${names[i].replace('.html', '')}.css`) ?? '');
    html = html.replace(/<link[^>]*href="css\/[^"]+"[^>]*>/, () => `<style>${inlineAssets(css).replace(/<\/style/gi, '<\\/style')}</style>`);
    html = inlineAssets(previewSafe(html));
    if (typeof behavior === 'string') html = html.replace(/<script[^>]*src="js\/behavior\.js"[^>]*><\/script>/, () => `<script>${safeScript(behavior)}</script>`);
    const tail = bridge(names);
    html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, () => `${tail}</body>`) : html + tail;
    return { file: names[i], name: page.name, html };
  });
}
