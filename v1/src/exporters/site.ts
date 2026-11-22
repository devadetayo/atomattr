import type { Project } from '../document/types';
import { buildGen } from '../document/gen';
import { assetNamesFor, generate, markupLines } from './codegen';
import { cssFor, indexGen } from './css';
import { dataUrlToBytes, makeZip, type ZipFile } from './zip';
import type { Gen } from '../document/gen';

const slug = (s: string, fb: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fb;
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (t: string) => esc(t).replace(/"/g, '&quot;');

/** Page file names: the first page is index.html, the rest are unique slugs. */
export function pageFiles(project: Project): string[] {
  const used = new Set<string>(['index']);
  return project.pages.map((p, i) => { if (i === 0) return 'index.html'; let s = slug(p.name, `page-${i + 1}`); let n = s; let k = 2; while (used.has(n)) n = `${s}-${k++}`; used.add(n); return `${n}.html`; });
}

export function buildSiteFiles(project: Project): ZipFile[] {
  const assets = assetNamesFor(project); const files: ZipFile[] = []; const names = pageFiles(project);
  project.pages.forEach((page, i) => {
    const root = buildGen(page.root, 'desktop', 'export', [], null, null, project);
    const cls = new Map<Gen, string>(); indexGen(root).forEach(({ gen, cls: c }) => cls.set(gen, c));
    const css = `${names[i].replace('.html', '')}.css`;
    const body = markupLines(root, 2, assets, cls, project).join('\n');
    const nav = project.pages.length > 1 ? '' : '';
    files.push({ path: names[i], data: `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <meta name="description" content="${escAttr(page.seo?.description || '')}" />\n  <title>${esc(page.seo?.title || `${page.name} · ${project.name}`)}</title>\n  <link rel="stylesheet" href="css/${css}" />\n  <script>const savedTheme=localStorage.getItem('atomattr-page-theme');if(savedTheme==='dark'||(savedTheme!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');</script>\n</head>\n<body>${nav}\n${body}\n</body>\n</html>\n` });
    files.push({ path: `css/${css}`, data: cssFor(root) });
    files.push({ path: `atomattr/${names[i]}`, data: generate(project, 'HTML', assets, page.id).code });
  });
  project.assets.forEach(a => { const path = assets.get(a.id); if (path) files.push({ path, data: dataUrlToBytes(a.dataUrl) }); });
  files.push({ path: 'project.json', data: generate(project, 'JSON', assets).code });
  files.push({ path: 'README.txt', data: `${project.name}\n\nindex.html + css/ + assets/ is a plain static site: open index.html or upload the folder anywhere.\natomattr/ holds the same pages as AtomAttr markup (needs the AtomAttr runtime).\nAll asset paths are relative.\n` });
  return files;
}
export const buildSiteZip = (project: Project) => makeZip(buildSiteFiles(project));
