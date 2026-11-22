import type { Node, Project } from './types';
import { activePage } from './tree';

/** Small SVG preview of a page, drawn from the document model (not a screenshot). Used on the welcome screen. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export function thumbSvg(root: Node, width = 1440): string {
  const out: string[] = []; let maxY = 600;
  const draw = (n: Node, ox: number, oy: number, ref: number, fw: number, fh: number) => {
    if (n.hidden) return;
    const w = typeof n.style.w === 'number' ? n.style.w : fw; const h = typeof n.style.h === 'number' ? n.style.h : fh;
    const x = ox + (n.style.mode === 'flow' ? 0 : Number(n.style.x ?? 0)); const y = oy + (n.style.mode === 'flow' ? 0 : Number(n.style.y ?? 0));
    maxY = Math.max(maxY, y + h);
    if (n.type === 'text' || n.type === 'heading') { const fs = n.style.fontSize || 18; out.push(`<rect x="${x}" y="${y}" width="${Math.min(w, (n.text?.length || 8) * fs * 0.5)}" height="${Math.max(8, fs * 0.7)}" rx="4" fill="${esc(n.style.color || '#6b7280')}" opacity=".55"/>`); return; }
    if (n.type === 'shape' && n.shape === 'ellipse') out.push(`<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${esc(n.style.fill || '#999')}"/>`);
    else if (n.style.fill || n.type === 'image' || n.type === 'button') out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${n.style.radius || 0}" fill="${esc(n.style.fill || (n.type === 'image' ? '#d1d5db' : 'none'))}"/>`);
    const kids = n.children || []; let cursor = y + (n.style.pad || 0);
    kids.forEach(k => {
      if (k.style.mode === 'flow') { const kh = typeof k.style.h === 'number' ? k.style.h : 40; draw(k, x + (n.style.pad || 0), cursor, w, w - (n.style.pad || 0) * 2, kh); cursor += kh + (n.style.gap || 0); }
      else draw(k, x, y, w, w, h);
    });
  };
  const rootW = width; let cursor = 0;
  (root.children || []).forEach(sec => { const h = typeof sec.style.h === 'number' ? sec.style.h : 400; draw(sec, 0, cursor, rootW, rootW, h); cursor += h; });
  const H = Math.max(maxY, cursor, 600);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rootW} ${H}" preserveAspectRatio="xMidYMin slice"><rect width="${rootW}" height="${H}" fill="${esc(root.style.fill || '#fff')}"/>${out.join('')}</svg>`;
}
export function makeThumb(project: Project): string | undefined {
  try { return `data:image/svg+xml;utf8,${encodeURIComponent(thumbSvg(activePage(project).root))}`; } catch { return undefined; }
}
