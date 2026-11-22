import type { Node, Project } from './types';
import type { QualityIssue } from './quality';
import { buildGen, type Gen } from './gen';
import { flatten } from './tree';
import { buildSiteFiles, pageFiles } from '../exporters/site';
import { dataUrlBytes } from './image-opt';

/**
 * Performance analysis of one page, measured from the real static export (HTML, CSS, scripts and image files), not guessed.
 * Load times are a simple model (round trips + transfer at fixed network speeds); they rank pages and show direction, they are
 * not a lab measurement. Sizes are as exported (uncompressed text; hosts normally gzip text, which the model allows for).
 */
export type PerfImage = { id: string; name: string; mime: string; bytes: number; w?: number; h?: number; uses: number };
export type PerfReport = {
  pageId: string; pageName: string;
  bytes: { html: number; css: number; js: number; images: number; total: number };
  requests: number; external: number; nodes: number; depth: number; images: PerfImage[];
  estimate: { fast4g: number; slow4g: number; slow3g: number };
  score: number; grade: 'good' | 'okay' | 'poor';
  issues: QualityIssue[];
};

const enc = new TextEncoder();
const size = (d: string | Uint8Array | undefined) => (d === undefined ? 0 : typeof d === 'string' ? enc.encode(d).length : d.length);
const TEXT_GZIP = 0.3;
/** [round-trip ms, bytes per ms] */
const NETS = { fast4g: [70, 1125], slow4g: [150, 200], slow3g: [400, 50] } as const;
export const loadTime = (net: keyof typeof NETS, requests: number, textBytes: number, binaryBytes: number) => { const [rtt, bw] = NETS[net]; return Math.round(rtt * (1 + Math.ceil(requests / 6)) + (textBytes * TEXT_GZIP + binaryBytes) / bw); };

function countGen(g: Gen, depth = 1): { n: number; d: number } { let n = 1, d = depth; for (const c of g.children) { const r = countGen(c, depth + 1); n += r.n; d = Math.max(d, r.d); } return { n, d }; }
const EXTERNAL = /<(?:script|link|img|iframe)\b[^>]*(?:src|href)\s*=\s*["']?(?:https?:)?\/\/[^"'\s>]+/gi;
const BLOCKING = /<script\b(?![^>]*\b(?:async|defer|type\s*=\s*["']?module)\b)[^>]*\bsrc\s*=/i;
const mb = (n: number) => (n / 1048576).toFixed(1);
const kb = (n: number) => `${Math.round(n / 1024)} KB`;

export function analyzePerformance(project: Project, pageId = project.activePageId): PerfReport {
  const page = project.pages.find(p => p.id === pageId) || project.pages[0];
  const files = buildSiteFiles(project); const by = new Map(files.map(f => [f.path, f.data] as const));
  const names = pageFiles(project); const idx = project.pages.indexOf(page); const file = names[idx];
  const html = by.get(file); const css = by.get(`css/${file.replace('.html', '')}.css`);
  const htmlText = typeof html === 'string' ? html : '';
  const scriptPaths = [...htmlText.matchAll(/<script[^>]*\bsrc="(js\/[^"]+)"/g)].map(m => m[1]);
  const js = scriptPaths.reduce((n, p) => n + size(by.get(p)), 0);

  const rootJson = JSON.stringify(page.root);
  const images: PerfImage[] = project.assets.map(a => ({ a, uses: rootJson.split(`"${a.id}"`).length - 1 })).filter(x => x.uses > 0)
    .map(({ a, uses }) => ({ id: a.id, name: a.name, mime: a.mime, bytes: dataUrlBytes(a.dataUrl), w: a.w, h: a.h, uses }));
  const imageBytes = images.reduce((n, i) => n + i.bytes, 0);
  const external = (htmlText.match(EXTERNAL) || []).length;

  const gen = buildGen(page.root, 'desktop', 'export', [], null, null, project); const { n: nodes, d: depth } = countGen(gen);
  const bytes = { html: size(html), css: size(css), js, images: imageBytes, total: size(html) + size(css) + js + imageBytes };
  const requests = 1 + 1 + scriptPaths.length + images.length + external; // document, stylesheet, scripts, images, third-party
  const text = bytes.html + bytes.css + bytes.js;
  const estimate = { fast4g: loadTime('fast4g', requests, text, imageBytes), slow4g: loadTime('slow4g', requests, text, imageBytes), slow3g: loadTime('slow3g', requests, text, imageBytes) };

  const issues: QualityIssue[] = []; let penalty = 0;
  const add = (rule: string, message: string, severity: QualityIssue['severity'] = 'warning', cost = 0, id?: string) => { issues.push({ rule, message, severity, pageId: page.id, ...(id ? { id } : {}) }); penalty += cost; };

  const weightMb = bytes.total / 1048576;
  if (weightMb > 3) add('perf-weight', `Page weight is ${mb(bytes.total)} MB. Aim for under 1.5 MB.`, 'error', 30);
  else if (weightMb > 1.5) add('perf-weight', `Page weight is ${mb(bytes.total)} MB. Aim for under 1.5 MB.`, 'warning', 18);
  else if (weightMb > 0.75) penalty += 6;

  const nodesFor = (assetId: string): Node | undefined => flatten(page.root).find(n => n.assetId === assetId);
  for (const i of images) {
    const n = nodesFor(i.id);
    if (i.bytes > 1_000_000) add('perf-image-large', `${i.name} is ${kb(i.bytes)}. Large images dominate load time.`, 'error', 8, n?.id);
    else if (i.bytes > 300_000) add('perf-image-large', `${i.name} is ${kb(i.bytes)}. Try Optimize all in Assets.`, 'warning', 4, n?.id);
    if (i.bytes > 150_000 && /^image\/(png|jpe?g)$/i.test(i.mime)) add('perf-image-format', `${i.name} is a ${i.mime.split('/')[1].toUpperCase()}; WebP is usually 25–35% smaller.`, 'warning', 2, n?.id);
    if ((i.w || 0) > 2400) add('perf-image-dimensions', `${i.name} is ${i.w}px wide; 2400px is plenty for any screen.`, 'warning', 2, n?.id);
  }
  const everything = JSON.stringify(project.pages) + JSON.stringify(project.components);
  const unused = project.assets.filter(a => !everything.includes(`"${a.id}"`));
  if (unused.length) add('perf-unused-assets', `${unused.length} image${unused.length === 1 ? '' : 's'} (${kb(unused.reduce((n, a) => n + dataUrlBytes(a.dataUrl), 0))}) in Assets are not used on any page. They are left out of exports but make the project file heavier.`, 'warning', 0);

  if (nodes > 3000) add('perf-dom-size', `${nodes.toLocaleString()} elements on this page. Very large pages render slowly on phones.`, 'error', 12);
  else if (nodes > 1500) add('perf-dom-size', `${nodes.toLocaleString()} elements on this page. Over about 1,500 starts to slow phones.`, 'warning', 6);
  if (depth > 32) add('perf-dom-depth', `Elements are nested ${depth} levels deep (aim for under 32).`, 'warning', 3);
  if (requests > 40) add('perf-requests', `${requests} requests to load this page.`, 'warning', 4);

  const head = [project.custom?.head, page.custom?.head].filter(Boolean).join('\n');
  if (BLOCKING.test(head)) add('perf-blocking-script', 'A script in your custom head HTML has no async or defer, so it blocks the page from rendering.', 'warning', 6);
  if (external) add('perf-external', `${external} third-party resource${external === 1 ? '' : 's'} (fonts, scripts, embeds) are not measured here and add to load time.`, 'warning', Math.min(8, external * 2));
  const customJs = size(project.custom?.js) + size(page.custom?.js);
  if (customJs > 50_000) add('perf-custom-js', `Custom JavaScript is ${kb(customJs)}. Consider minifying it.`, 'warning', 3);
  const embeds = flatten(page.root).filter(n => n.type === 'embed').length;
  if (embeds > 3) add('perf-embeds', `${embeds} custom HTML embeds. Each usually pulls in its own scripts.`, 'warning', 3);

  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  return { pageId: page.id, pageName: page.name, bytes, requests, external, nodes, depth, images, estimate, score, grade: score >= 85 ? 'good' : score >= 60 ? 'okay' : 'poor', issues };
}
