import type { SiteElement, StudioPage, StudioProject } from '../types/project';
import { serializeDesignSvg } from './svg-exporter';

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function attrs(style: SiteElement['style']): string {
  const base = Object.entries(style).filter(([key]) => key !== 'md' && key !== 'lg');
  const responsive = (['md', 'lg'] as const).flatMap(breakpoint => Object.entries(style[breakpoint] || {}).map(([key, value]) => [`${breakpoint}-${key}`, value] as const));
  return [...base, ...responsive].map(([key, value]) => `${key}="${escapeHtml(value)}"`).join(' ');
}

function safeHref(value: string): string {
  const trimmed = value.trim();
  return /^(https?:|mailto:|tel:|#|\/|\.?\.?\/)/i.test(trimmed) ? trimmed : '#';
}

function renderElement(element: SiteElement, assetPaths: Map<string, string>): string {
  const style = attrs(element.style);
  const content = escapeHtml(element.content);
  switch (element.kind) {
    case 'section': return `<section ${style} display="flex" flex-col gap="4">\n  <p m="0">${content}</p>\n</section>`;
    case 'heading': return `<h1 ${style} font-size="4xl" font-weight="700" line-height="tight">${content}</h1>`;
    case 'text': return `<p ${style} font-size="lg" line-height="relaxed">${content}</p>`;
    case 'button': {
      const href = element.href ? ` href="${escapeHtml(safeHref(element.href))}"` : '';
      const tag = element.href ? 'a' : 'button';
      const type = element.href ? '' : ' type="button"';
      const textDecoration = element.href ? ' text-decoration="none"' : '';
      return `<${tag}${type}${href} ${style} display="inline-flex" items="center" justify="center" rounded="full" font-weight="600"${textDecoration}>${content}</${tag}>`;
    }
    case 'image': {
      const source = assetPaths.get(element.id) || element.src;
      if (!source) return `<div ${style} role="img" aria-label="${escapeHtml(element.alt || 'Image placeholder')}" min-h="40" display="flex" items="center" justify="center" rounded="xl"><span>${escapeHtml(element.alt || 'Add an image URL in AtomAttr Studio')}</span></div>`;
      return `<img src="${escapeHtml(source)}" alt="${escapeHtml(element.alt || '')}" ${style} max-w="full" h="auto" rounded="xl">`;
    }
  }
}

export function exportPageHtml(project: StudioProject, page: StudioPage, fileMap: Map<string, string>, assetPaths: Map<string, string>): string {
  const links = project.pages.map(target => {
    const href = fileMap.get(target.id)!;
    return `<a href="${escapeHtml(href)}" text="muted" text-decoration="none" hover-text="primary">${escapeHtml(target.name)}</a>`;
  }).join('\n        ');
  const body = page.elements.map(element => renderElement(element, assetPaths)).join('\n\n      ');
  const vectors = page.objects?.length ? `<svg xmlns="http://www.w3.org/2000/svg" position="absolute" left="0" top="0" w="1200px" h="800px" viewBox="0 0 1200 800" pointer-events="none">${serializeDesignSvg(page.objects, 1200, 800).replace(/^<\?xml[^>]*>\s*|<svg[^>]*>|<\/svg>\s*$/g, '')}</svg>` : '';
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <title>${escapeHtml(page.name)} | ${escapeHtml(project.name)}</title>
    <link rel="stylesheet" href="assets/atomattr-defaults.css">
    <script src="assets/atomattr.min.js" defer></script>
  </head>
  <body bg="white" dark-bg="gray-950" text="foreground" min-h="screen" m="0">
    <header border-b="1" border-color="gray-200" dark-border-color="gray-800" px="6" py="4">
      <nav display="flex" items="center" justify="between" gap="4" max-w="6xl" mx="auto">
        <a href="${escapeHtml(fileMap.get(page.id)!)}" font-weight="700" text="foreground" text-decoration="none">${escapeHtml(project.name)}</a>
        <div display="flex" items="center" gap="4">${links}</div>
      </nav>
    </header>
    <main display="flex" flex-col gap="6" max-w="6xl" mx="auto" px="6" py="12">
      ${body}
      ${vectors}
    </main>
  </body>
</html>`;
}

export function createExportFiles(project: StudioProject, engineSource: string, defaultsCss: string): Map<string, string | Uint8Array> {
  const files = new Map<string, string | Uint8Array>();
  const slugs = new Set<string>();
  const pageFiles = new Map<string, string>();
  const assetPaths = new Map<string, string>();
  const usedAssets = new Set<string>();
  const assetDataPaths = new Map<string, string>();
  const active = project.pages.find(page => page.id === project.activePageId) || project.pages[0];
  for (const page of project.pages) {
    let file = page === active ? 'index.html' : `${slugify(page.name)}.html`;
    const base = file.replace(/\.html$/, '');
    let suffix = 2;
    while (slugs.has(file.toLowerCase())) file = `${base}-${suffix++}.html`;
    slugs.add(file.toLowerCase());
    pageFiles.set(page.id, file);
  }
  for (const page of project.pages) {
    for (const element of page.elements) {
      if (element.asset && element.asset.dataUrl.startsWith(`data:${element.asset.mimeType};base64,`)) {
        const existingPath = assetDataPaths.get(element.asset.dataUrl);
        if (existingPath) {
          assetPaths.set(element.id, existingPath);
          continue;
        }
        const basename = element.asset.name.replace(/\.[^.]+$/, '');
        let path = `assets/${slugify(basename) || 'image'}.${extensionForMime(element.asset.mimeType)}`;
        const base = path.replace(/\.[^.]+$/, '');
        let suffix = 2;
        while (usedAssets.has(path.toLowerCase())) path = `${base}-${suffix++}.${extensionForMime(element.asset.mimeType)}`;
        usedAssets.add(path.toLowerCase());
        assetDataPaths.set(element.asset.dataUrl, path);
        assetPaths.set(element.id, path);
        const binary = atob(element.asset.dataUrl.split(',')[1]);
        const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
        files.set(path, bytes);
      }
    }
  }
  for (const page of project.pages) files.set(pageFiles.get(page.id)!, exportPageHtml(project, page, pageFiles, assetPaths));
  files.set('assets/atomattr.min.js', engineSource);
  files.set('assets/atomattr-defaults.css', defaultsCss);
  files.set('README.txt', `Exported from AtomAttr Studio.\n\nOpen index.html to view your website. The AtomAttr runtime and defaults stylesheet are included locally in assets/. Uploaded images are included under assets/.\nExternally linked image URLs still need an internet connection.\n`);
  return files;
}

function extensionForMime(mimeType: string): string {
  return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg' } as Record<string, string>)[mimeType] || 'bin';
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page';
}
