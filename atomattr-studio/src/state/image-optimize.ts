import type { Asset, Node, Project } from '../document/types';
import { canOptimize, dataUrlBytes, fitWithin, formatBytes, keepOriginal, MAX_DIM, pickFormat, QUALITY, renameForMime, SKIP_BELOW_BYTES } from '../document/image-opt';

export type Optimized = { dataUrl: string; mime: string; name: string; w: number; h: number; before: number; after: number };

let webpOk: boolean | null = null;
const supportsWebp = () => {
  if (webpOk === null) { try { const c = document.createElement('canvas'); c.width = c.height = 1; webpOk = c.toDataURL('image/webp').startsWith('data:image/webp'); } catch { webpOk = false; } }
  return webpOk;
};
const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error('decode')); i.src = src; });
/** Samples a small copy of the picture: any non-opaque pixel means the alpha channel matters. */
function hasAlpha(img: HTMLImageElement): boolean {
  try { const s = 64; const c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d')!; x.drawImage(img, 0, 0, s, s); const d = x.getImageData(0, 0, s, s).data; for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true; } catch { return true; }
  return false;
}

/** Returns the optimized picture, or null when the original should be kept (vector/animated, tiny, or no real saving). */
export async function optimizeDataUrl(dataUrl: string, name: string, mime: string, opts: { force?: boolean } = {}): Promise<Optimized | null> {
  if (!canOptimize(mime)) return null;
  const before = dataUrlBytes(dataUrl);
  try {
    const img = await load(dataUrl); const nw = img.naturalWidth, nh = img.naturalHeight; if (!nw || !nh) return null;
    const fit = fitWithin(nw, nh, MAX_DIM);
    if (!fit.scaled && before < SKIP_BELOW_BYTES && !opts.force) return null;
    const alpha = mime !== 'image/jpeg' && hasAlpha(img);
    const target = pickFormat({ hasAlpha: alpha, webp: supportsWebp() });
    const c = document.createElement('canvas'); c.width = fit.w; c.height = fit.h; const x = c.getContext('2d'); if (!x) return null;
    if (target === 'image/jpeg') { x.fillStyle = '#ffffff'; x.fillRect(0, 0, fit.w, fit.h); }
    x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, fit.w, fit.h);
    const out = c.toDataURL(target, QUALITY); const after = dataUrlBytes(out);
    if (!out.startsWith(`data:${target}`) || keepOriginal(before, after, fit.scaled)) return null;
    return { dataUrl: out, mime: target, name: renameForMime(name, target), w: fit.w, h: fit.h, before, after };
  } catch { return null; }
}

const remap = (n: Node, from: string, to: string, ids: Set<string>): Node => {
  let out = n;
  if (n.src === from || (n.assetId && ids.has(n.assetId) && n.src?.startsWith('data:'))) out = { ...out, src: to };
  if (n.children?.length) out = { ...out, children: n.children.map(c => remap(c, from, to, ids)) };
  return out;
};

/** Optimizes every raster asset already in the project and rewrites the image nodes that carry a copy of the data. */
export async function optimizeProjectAssets(project: Project): Promise<{ project: Project; saved: number; count: number; summary: string }> {
  let pages = project.pages; let components = project.components; let saved = 0; let count = 0;
  const assets: Asset[] = [];
  for (const a of project.assets) {
    const r = await optimizeDataUrl(a.dataUrl, a.name, a.mime);
    if (!r) { assets.push(a); continue; }
    saved += r.before - r.after; count += 1;
    const ids = new Set([a.id]);
    pages = pages.map(p => ({ ...p, root: remap(p.root, a.dataUrl, r.dataUrl, ids) }));
    components = components.map(c => ({ ...c, node: remap(c.node, a.dataUrl, r.dataUrl, ids) }));
    assets.push({ ...a, dataUrl: r.dataUrl, mime: r.mime, name: r.name, w: r.w, h: r.h });
  }
  return { project: { ...project, pages, components, assets }, saved, count, summary: count ? `Optimized ${count} image${count === 1 ? '' : 's'}, saved ${formatBytes(saved)}.` : 'Images are already optimized.' };
}
