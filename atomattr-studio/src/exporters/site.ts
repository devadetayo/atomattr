import { langOf } from '../document/lang';
import type { Page, Project } from '../document/types';
import { bindNode, bind, buildGen } from '../document/gen';
import { itemFile, itemRow, itemSlugs, slugFieldOf } from '../document/cms';
import { assetNamesFor, generate, markupLines, rebaseAssets, withAutoAssets } from './codegen';
import { cssFor, indexGen } from './css';
import { dataUrlToBytes, makeZip, type ZipFile } from './zip';
import { usesBehavior } from '../document/behavior';
import { behaviorCss, BEHAVIOR_JS } from './behavior-runtime';
import type { Gen } from '../document/gen';
import { customCss, customScriptFiles, headBlock, safeInline } from './custom-code';

const slug = (s: string, fb: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fb;
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (t: string) => esc(t).replace(/"/g, '&quot;');

/** Page file names: the first page is index.html, the rest are unique slugs. */
export function pageFiles(project: Project): string[] {
  const used = new Set<string>(['index']);
  return project.pages.map((p, i) => { if (i === 0) return 'index.html'; let s = slug(p.name, `page-${i + 1}`); let n = s; let k = 2; while (used.has(n)) n = `${s}-${k++}`; used.add(n); return `${n}.html`; });
}


/** What the site export writes: every normal page once, and every Item page once per published item of its collection. */
export function siteOutputs(project: Project, names: string[]): { page: Page; file: string; proj: Project }[] {
  const out: { page: Page; file: string; proj: Project }[] = [];
  project.pages.forEach((pg, i) => {
    if (!pg.templateOf) { out.push({ page: pg, file: names[i], proj: project }); return; }
    const c = project.collections?.find(x => x.id === pg.templateOf); if (!c) return;
    const slugs = itemSlugs(c); const tf = slugFieldOf(c);
    c.items.forEach((it, n) => {
      if (it.draft) return;
      const row = itemRow(c, it, n, slugs); const seo = pg.seo || {}; const title = (tf && row[tf.key]) || pg.name;
      const page: Page = { ...pg, templateOf: undefined, name: title, root: bindNode(pg.root, row, `item${n}`), seo: { ...seo, title: bind(seo.title, row) || `${title} · ${project.name}`, description: bind(seo.description, row), socialTitle: bind(seo.socialTitle, row), socialDescription: bind(seo.socialDescription, row), socialImage: bind(seo.socialImage, row) } };
      out.push({ page, file: itemFile(c, slugs.get(it.id)!), proj: { ...project, pages: project.pages.map(x => (x.id === pg.id ? page : x)) } });
    });
  });
  return out;
}

export function buildSiteFiles(input: Project): ZipFile[] {
  const project = withAutoAssets(input);
  const assets = assetNamesFor(project); const files: ZipFile[] = []; const names = pageFiles(project);
  siteOutputs(project, names).forEach(({ page, file, proj }) => {
    const root = buildGen(page.root, 'desktop', 'export', [], null, null, project);
    const cls = new Map<Gen, string>(); indexGen(root).forEach(({ gen, cls: c }) => cls.set(gen, c));
    const css = `${file.replace('.html', '')}.css`;
    const body = markupLines(root, 2, assets, cls, project).join('\n');
    const nav = project.pages.length > 1 ? '' : ''; const interactive = usesBehavior(page.root);
    const scripts = customScriptFiles(project, file, page); const head = headBlock(project, page);
    const customScripts = [scripts.shared, scripts.own?.path].filter(Boolean).map(src => `\n<script src="${src}" defer></script>`).join('');
    const pageTitle = page.seo?.title || `${page.name} · ${project.name}`;
    const pageDescription = page.seo?.description || '';
    const socialTitle = page.seo?.socialTitle || pageTitle;
    const socialDescription = page.seo?.socialDescription || pageDescription || project.site?.description || '';
    const socialImage = page.seo?.socialImage || project.site?.socialImage || '';
    const canonicalUrl = project.site?.baseUrl ? project.site.baseUrl.replace(/\/$/, '') : '';
    files.push({ path: file, data: `<!doctype html>\n<html lang="${langOf(project)}">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <meta name="description" content="${escAttr(pageDescription)}" />\n  <meta property="og:title" content="${escAttr(socialTitle)}" />\n  <meta property="og:description" content="${escAttr(socialDescription)}" />\n  <meta property="og:type" content="website" />\n  <meta property="og:site_name" content="${escAttr(project.site?.name || project.name || 'AtomAttr site')}" />\n  ${canonicalUrl ? `<meta property="og:url" content="${escAttr(canonicalUrl)}" />` : ''}\n  ${socialImage ? `<meta property="og:image" content="${escAttr(socialImage)}" />` : ''}\n  <meta name="twitter:card" content="summary_large_image" />\n  <meta name="twitter:title" content="${escAttr(socialTitle)}" />\n  <meta name="twitter:description" content="${escAttr(socialDescription)}" />\n  ${socialImage ? `<meta name="twitter:image" content="${escAttr(socialImage)}" />` : ''}\n  <title>${esc(pageTitle)}</title>\n  <link rel="stylesheet" href="css/${css}" />\n${head ? head + '\n' : ''}  <script>const savedTheme=localStorage.getItem('atomattr-page-theme');if(savedTheme==='dark'||(savedTheme!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');</script>\n</head>\n<body>${nav}\n${body}${interactive ? '\n<script src="js/behavior.js" defer></script>' : ''}${customScripts}\n</body>\n</html>\n` });
    files.push({ path: `css/${css}`, data: cssFor(root, true, "../") + (interactive ? `\n/* Menus, dropdowns, tabs and dialogs (see js/behavior.js) */\n${behaviorCss([page.root])}\n` : '') + (customCss(project, page) ? `\n/* Custom CSS */\n${safeInline(customCss(project, page), 'style')}\n` : '') });
    if (scripts.own) files.push({ path: scripts.own.path, data: `// Custom JavaScript for ${page.name}\n${scripts.own.code}\n` });
    files.push({ path: `atomattr/${file}`, data: rebaseAssets(generate(proj, 'HTML', assets, page.id).code, '../') });
  });
  if (project.pages.some(pg => usesBehavior(pg.root))) files.push({ path: 'js/behavior.js', data: `// Menus, dropdowns, tabs and dialogs. Reads the data-ast-* attributes in the pages.\n${BEHAVIOR_JS}\n` });
  if (project.custom?.js?.trim()) files.push({ path: 'js/custom.js', data: `// Custom JavaScript (all pages)\n${project.custom.js.trim()}\n` });
  project.assets.forEach(a => { const path = assets.get(a.id); if (path && !/^https?:/i.test(a.dataUrl)) files.push({ path, data: dataUrlToBytes(a.dataUrl) }); });
  files.push({ path: 'project.json', data: generate(project, 'JSON', assets).code });
  files.push({ path: 'README.txt', data: `${project.name}\n\nindex.html + css/ + assets/ is a plain static site: open index.html or upload the folder anywhere.\natomattr/ holds the same pages as AtomAttr markup (needs the AtomAttr runtime).\nAll asset paths are relative (atomattr/ pages use ../assets/).\n${project.pages.some(p => p.templateOf) ? 'Pages named after a collection (for example blog-my-post.html) were made from an Item page, one per published item.\n' : ''}` });
  return files;
}
export const buildSiteZip = (project: Project) => makeZip(buildSiteFiles(project));
