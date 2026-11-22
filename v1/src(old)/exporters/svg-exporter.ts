import type { DesignObject } from '../types/project';

const escapeXml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);
function points(object: DesignObject, star = false) {
  const count = star ? Math.max(3, object.points || 5) * 2 : Math.max(3, object.points || 6);
  const cx = object.x + object.width / 2; const cy = object.y + object.height / 2;
  const outer = Math.min(object.width, object.height) / 2; const inner = outer * (object.radius || 0.46);
  return Array.from({ length: count }, (_, i) => {
    const radius = star && i % 2 ? inner : outer; const angle = Math.PI * 2 * i / count - Math.PI / 2;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(' ');
}

export function serializeDesignSvg(objects: DesignObject[], width = 1200, height = 800): string {
  const body = objects.map(object => {
    const transform = object.rotation ? ` transform="rotate(${object.rotation} ${object.x + object.width / 2} ${object.y + object.height / 2})"` : '';
    const common = `fill="${escapeXml(object.fill)}" stroke="${escapeXml(object.stroke)}" stroke-width="${object.strokeWidth}" opacity="${object.opacity}"${transform}`;
    if (object.kind === 'rect') return `<rect x="${object.x}" y="${object.y}" width="${object.width}" height="${object.height}" ${common}/>`;
    if (object.kind === 'ellipse') return `<ellipse cx="${object.x + object.width / 2}" cy="${object.y + object.height / 2}" rx="${object.width / 2}" ry="${object.height / 2}" ${common}/>`;
    if (object.kind === 'line') return `<line x1="${object.x}" y1="${object.y}" x2="${object.x + object.width}" y2="${object.y + object.height}" stroke="${escapeXml(object.stroke)}" stroke-width="${object.strokeWidth}" opacity="${object.opacity}"${transform}/>`;
    if (object.kind === 'polygon') return `<polygon points="${points(object)}" ${common}/>`;
    if (object.kind === 'star') return `<polygon points="${points(object, true)}" ${common}/>`;
    if (object.kind === 'image') return object.src ? `<image href="${escapeXml(object.src)}" x="${object.x}" y="${object.y}" width="${object.width}" height="${object.height}" preserveAspectRatio="xMidYMid slice" opacity="${object.opacity}"${transform}/>` : `<rect x="${object.x}" y="${object.y}" width="${object.width}" height="${object.height}" fill="#eef2ff" stroke="#a5b4fc"/>`;
    return `<text x="${object.x}" y="${object.y + (object.fontSize || 32)}" font-family="Inter,system-ui,sans-serif" font-size="${object.fontSize || 32}" fill="${escapeXml(object.fill)}" opacity="${object.opacity}"${transform}>${(object.text || '').split('\n').map((line, index) => index === 0 ? escapeXml(line) : `<tspan x="${object.x}" dy="${(object.fontSize || 32) * 1.25}">${escapeXml(line)}</tspan>`).join('')}</text>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${body}\n</svg>\n`;
}

export function downloadDesignSvg(objects: DesignObject[], filename: string): void {
  const blob = new Blob([serializeDesignSvg(objects)], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
