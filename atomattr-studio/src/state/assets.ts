import type { Asset } from '../document/types';
import { uid } from '../document/tree';
import { getState, setProject, toast } from './store';
import { INPUT_LIMIT_BYTES, formatBytes } from '../document/image-opt';
import { optimizeDataUrl, optimizeProjectAssets } from './image-optimize';

const MAX_BYTES = INPUT_LIMIT_BYTES;

export function readImage(file: File): Promise<{ asset: Asset; w: number; h: number } | null> {
  return new Promise(resolve => {
    if (!file.type.startsWith('image/')) { toast(`${file.name} is not an image.`, 'error'); resolve(null); return; }
    if (file.size > MAX_BYTES) { toast(`${file.name} is larger than 25 MB. Please use a smaller image.`, 'error'); resolve(null); return; }
    const reader = new FileReader();
    reader.onerror = () => { toast(`Could not read ${file.name}.`, 'error'); resolve(null); };
    reader.onload = () => {
      const dataUrl = String(reader.result); const img = new Image();
      img.onload = async () => {
        const w = img.naturalWidth || 480, h = img.naturalHeight || 320;
        // Photos are scaled to 2400 px and re-encoded (WebP) on the way in, so the project and every export stay light.
        const opt = await optimizeDataUrl(dataUrl, file.name, file.type);
        if (opt) { toast(`Optimized ${file.name}: ${formatBytes(opt.before)} → ${formatBytes(opt.after)}`); resolve({ asset: { id: uid(), name: opt.name, mime: opt.mime, dataUrl: opt.dataUrl, w: opt.w, h: opt.h }, w: opt.w, h: opt.h }); }
        else resolve({ asset: { id: uid(), name: file.name, mime: file.type, dataUrl, w, h }, w, h });
      };
      img.onerror = () => { toast(`${file.name} could not be decoded as an image.`, 'error'); resolve(null); };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
export function registerAsset(asset: Asset): Asset {
  const s = getState(); if (!s.project) return asset;
  const dup = s.project.assets.find(a => a.dataUrl === asset.dataUrl); if (dup) return dup;
  setProject({ ...s.project, assets: [...s.project.assets, asset] }, { history: false }); return asset;
}
export function removeAsset(id: string) {
  const s = getState(); if (!s.project) return;
  const used = s.project.pages.some(p => JSON.stringify(p.root).includes(`"assetId":"${id}"`));
  if (used) { toast('That image is used on a page. Remove it from the page first.', 'error'); return; }
  setProject({ ...s.project, assets: s.project.assets.filter(a => a.id !== id) });
}
export function pickImages(multiple = false): Promise<File[]> {
  return new Promise(resolve => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.multiple = multiple;
    input.onchange = () => resolve(Array.from(input.files || [])); input.oncancel = () => resolve([]);
    input.click();
  });
}
export function pickFile(accept: string): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] || null); input.oncancel = () => resolve(null);
    input.click();
  });
}

/** Re-encodes every raster image already in the project (undoable). */
export async function optimizeAllAssets() {
  const s = getState(); if (!s.project) return;
  toast('Optimizing images…');
  const r = await optimizeProjectAssets(s.project);
  if (r.count) setProject(r.project);
  toast(r.summary);
}
