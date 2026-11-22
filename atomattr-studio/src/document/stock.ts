/**
 * Built-in artwork. Nothing here is downloaded: every picture is generated as an SVG data URI from a palette and a seed,
 * so templates, the Fill panel's library and exports all work offline and never show a broken image.
 * Swap any of it for your own photography in the Assets panel.
 */

export type ArtKind = 'mesh' | 'dunes' | 'arches' | 'product' | 'portrait' | 'city' | 'glow' | 'waves' | 'blocks';
export type Palette = string[];

/** Small deterministic random generator, so the same seed always draws the same picture. */
function rng(seed: number) {
  let t = (seed * 2654435761) >>> 0;
  return () => { t += 0x6d2b79f5; let x = t; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}

const W = 1600; const H = 1000;
const f = (n: number) => Math.round(n * 10) / 10;

function hexToRgb(h: string): [number, number, number] {
  let x = h.replace('#', ''); if (x.length === 3) x = x.split('').map(c => c + c).join('');
  const n = parseInt(x.slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a); const y = hexToRgb(b);
  return `#${[0, 1, 2].map(i => Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, '0')).join('')}`;
}
const lighten = (c: string, t: number) => mix(c, '#ffffff', t);
const darken = (c: string, t: number) => mix(c, '#000000', t);

/** Film grain and a soft vignette, laid over every picture so flat gradients read as photographs. */
function finish(seed: number, vignette = 0.28, grain = 0.1): string {
  return `<filter id="gr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${seed % 97}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 ${grain} 0"/></filter>
<radialGradient id="vg" cx="50%" cy="46%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${vignette}"/></radialGradient>`;
}
const overlay = `<rect width="${W}" height="${H}" fill="url(#vg)"/><rect width="${W}" height="${H}" filter="url(#gr)"/>`;

/* ------------------------------------------------------------------ scenes */

function mesh(p: Palette, r: () => number): string {
  const blobs = Array.from({ length: 6 }, (_, i) => `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(260 + r() * 340)}" fill="${p[(i + 1) % p.length]}" opacity="${f(0.55 + r() * 0.4)}"/>`).join('');
  return `<defs><filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="110"/></filter></defs><rect width="${W}" height="${H}" fill="${p[0]}"/><g filter="url(#bl)">${blobs}</g>`;
}

function glow(p: Palette, r: () => number): string {
  const orbs = Array.from({ length: 5 }, (_, i) => { const c = p[(i + 1) % p.length]; return `<circle cx="${f(200 + r() * 1200)}" cy="${f(100 + r() * 800)}" r="${f(120 + r() * 220)}" fill="${c}" opacity="${f(0.5 + r() * 0.4)}"/>`; }).join('');
  const lines = Array.from({ length: 14 }, (_, i) => `<path d="M0 ${f(i * 74 + 20)} Q ${f(400 + r() * 800)} ${f(i * 74 - 60 + r() * 140)} ${W} ${f(i * 74 + 20 + r() * 60)}" fill="none" stroke="#fff" stroke-opacity=".05" stroke-width="1.5"/>`).join('');
  return `<defs><filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="70"/></filter><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${darken(p[0], 0.25)}"/><stop offset="1" stop-color="${p[0]}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/><g filter="url(#bl)">${orbs}</g>${lines}`;
}

function waves(p: Palette, r: () => number): string {
  const layers = Array.from({ length: 6 }, (_, i) => {
    const y = 320 + i * 120; const amp = 50 + r() * 70; const ph = r() * 6;
    let d = `M0 ${H} L0 ${f(y)}`; for (let x = 0; x <= W; x += 80) d += ` L${x} ${f(y + Math.sin(x / 210 + ph) * amp)}`; d += ` L${W} ${H} Z`;
    return `<path d="${d}" fill="${mix(p[1], p[2], i / 5)}" opacity="${f(0.55 + i * 0.08)}"/>`;
  }).join('');
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${lighten(p[0], 0.2)}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/>${layers}`;
}

function dunes(p: Palette, r: () => number): string {
  const sunX = 380 + r() * 840;
  const ridges = Array.from({ length: 5 }, (_, i) => {
    const y = 470 + i * 110; const ph = r() * 5; let d = `M0 ${H} L0 ${f(y)}`;
    for (let x = 0; x <= W; x += 40) d += ` L${x} ${f(y - Math.abs(Math.sin(x / (330 - i * 28) + ph)) * (120 - i * 12) - Math.sin(x / 90 + i) * 8)}`;
    d += ` L${W} ${H} Z`; return `<path d="${d}" fill="${mix(p[2], p[3], i / 4)}"/>`;
  }).join('');
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset=".62" stop-color="${p[1]}"/></linearGradient><radialGradient id="sun"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".25" stop-color="${lighten(p[1], 0.5)}" stop-opacity=".9"/><stop offset="1" stop-color="${p[1]}" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/><circle cx="${f(sunX)}" cy="380" r="340" fill="url(#sun)"/>${ridges}`;
}

function arches(p: Palette, r: () => number): string {
  const count = 4; const gw = W / count; let out = '';
  for (let i = 0; i < count; i += 1) {
    const x = i * gw + gw * 0.14; const w = gw * 0.72; const top = 150 + r() * 70; const base = 840;
    const d = `M${f(x)} ${base} L${f(x)} ${f(top + w / 2)} A${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(x + w)} ${f(top + w / 2)} L${f(x + w)} ${base} Z`;
    out += `<path d="${d}" fill="url(#ar${i})"/><path d="${d}" fill="none" stroke="${darken(p[1], 0.15)}" stroke-opacity=".25" stroke-width="3"/>`;
  }
  const grads = Array.from({ length: count }, (_, i) => `<linearGradient id="ar${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mix(p[2], p[3], 0.2 + i * 0.1)}"/><stop offset="1" stop-color="${darken(p[3], 0.1 + i * 0.05)}"/></linearGradient>`).join('');
  const shadow = `<polygon points="0,840 ${W},840 ${W},${H} 0,${H}" fill="${darken(p[1], 0.18)}"/><polygon points="${W * 0.55},840 ${W * 0.95},840 ${W * 0.78},${H} ${W * 0.4},${H}" fill="${darken(p[1], 0.38)}" opacity=".5"/>`;
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient>${grads}</defs><rect width="${W}" height="${H}" fill="url(#bg)"/>${out}${shadow}`;
}

function product(p: Palette, r: () => number): string {
  const kind = Math.floor(r() * 3); const cx = 800 + (r() - 0.5) * 120;
  const body = kind === 0
    ? `<circle cx="${f(cx)}" cy="520" r="230" fill="url(#ob)"/><ellipse cx="${f(cx - 70)}" cy="430" rx="80" ry="44" fill="#fff" opacity=".32" transform="rotate(-24 ${f(cx - 70)} 430)"/>`
    : kind === 1
      ? `<rect x="${f(cx - 170)}" y="310" width="340" height="440" rx="60" fill="url(#ob)"/><rect x="${f(cx - 150)}" y="330" width="60" height="380" rx="30" fill="#fff" opacity=".22"/>`
      : `<path d="M${f(cx - 150)} 750 L${f(cx - 190)} 420 Q${f(cx)} 300 ${f(cx + 190)} 420 L${f(cx + 150)} 750 Z" fill="url(#ob)"/><ellipse cx="${f(cx)}" cy="420" rx="190" ry="60" fill="${lighten(p[3], 0.3)}"/><rect x="${f(cx - 130)}" y="470" width="40" height="250" rx="20" fill="#fff" opacity=".2"/>`;
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(p[0], 0.2)}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient><linearGradient id="ob" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(p[3], 0.35)}"/><stop offset=".55" stop-color="${p[3]}"/><stop offset="1" stop-color="${darken(p[3], 0.35)}"/></linearGradient><filter id="sb" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="22"/></filter></defs><rect width="${W}" height="${H}" fill="url(#bg)"/><ellipse cx="${f(cx)}" cy="790" rx="280" ry="38" fill="#000" opacity=".28" filter="url(#sb)"/>${body}`;
}

function portrait(p: Palette, r: () => number): string {
  const cx = 800 + (r() - 0.5) * 80; const skin = p[3]; const cloth = p[2];
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(p[0], 0.15)}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient><linearGradient id="sk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(skin, 0.18)}"/><stop offset="1" stop-color="${darken(skin, 0.22)}"/></linearGradient><linearGradient id="cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(cloth, 0.1)}"/><stop offset="1" stop-color="${darken(cloth, 0.3)}"/></linearGradient><filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="90"/></filter></defs><rect width="${W}" height="${H}" fill="url(#bg)"/><g filter="url(#bl)"><circle cx="${f(cx - 420)}" cy="260" r="260" fill="${lighten(p[1], 0.35)}" opacity=".7"/><circle cx="${f(cx + 460)}" cy="720" r="300" fill="${p[2]}" opacity=".5"/></g><path d="M${f(cx - 470)} ${H} Q${f(cx - 440)} 720 ${f(cx - 150)} 690 L${f(cx + 150)} 690 Q${f(cx + 440)} 720 ${f(cx + 470)} ${H} Z" fill="url(#cl)"/><rect x="${f(cx - 62)}" y="590" width="124" height="130" rx="40" fill="${darken(skin, 0.18)}"/><ellipse cx="${f(cx)}" cy="450" rx="146" ry="178" fill="url(#sk)"/><path d="M${f(cx - 152)} 450 Q${f(cx - 160)} 250 ${f(cx)} 258 Q${f(cx + 160)} 250 ${f(cx + 152)} 450 Q${f(cx + 120)} 340 ${f(cx)} 330 Q${f(cx - 120)} 340 ${f(cx - 152)} 450 Z" fill="${darken(p[0], 0.55)}"/>`;
}

function city(p: Palette, r: () => number): string {
  let b = ''; let x = -20;
  while (x < W) {
    const w = 70 + r() * 120; const h = 220 + r() * 460; const y = 830 - h; const shade = mix(p[2], p[3], r());
    b += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${shade}"/>`;
    for (let wy = y + 24; wy < 810; wy += 34) for (let wx = x + 14; wx < x + w - 14; wx += 26) if (r() > 0.62) b += `<rect x="${f(wx)}" y="${f(wy)}" width="10" height="14" rx="2" fill="${p[1]}" opacity="${f(0.45 + r() * 0.5)}"/>`;
    x += w + 8 + r() * 22;
  }
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset=".75" stop-color="${mix(p[0], p[1], 0.7)}"/></linearGradient><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${darken(p[3], 0.3)}"/><stop offset="1" stop-color="${darken(p[3], 0.6)}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/>${b}<rect y="830" width="${W}" height="170" fill="url(#gd)"/>`;
}

function blocks(p: Palette, r: () => number): string {
  const cells = Array.from({ length: 9 }, (_, i) => {
    const col = i % 3; const row = Math.floor(i / 3); const c = p[Math.floor(r() * p.length)];
    const shape = Math.floor(r() * 3); const x = col * 533 + 30; const y = row * 333 + 20; const w = 473; const h = 293;
    const inner = shape === 0 ? `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${f(h * 0.36)}" fill="${lighten(c, 0.35)}"/>` : shape === 1 ? `<rect x="${x + 60}" y="${y + 50}" width="${w - 120}" height="${h - 100}" rx="22" fill="${darken(c, 0.2)}"/>` : `<path d="M${x + 60} ${y + h - 40} L${x + w / 2} ${y + 40} L${x + w - 60} ${y + h - 40} Z" fill="${lighten(c, 0.3)}"/>`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="${c}"/>${inner}`;
  }).join('');
  return `<rect width="${W}" height="${H}" fill="${lighten(p[0], 0.5)}"/>${cells}`;
}

const SCENES: Record<ArtKind, (p: Palette, r: () => number) => string> = { mesh, glow, waves, dunes, arches, product, portrait, city, blocks };

/* ------------------------------------------------------------------ public API */

/** A generated SVG as a data URI. Same inputs always give the same picture. */
export function art(kind: ArtKind, palette: Palette, seed = 1, opts: { vignette?: number; grain?: number } = {}): string {
  const r = rng(seed * 7919 + kind.length * 31);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${finish(seed, opts.vignette, opts.grain)}</defs>${SCENES[kind](palette, r)}${overlay}</svg>`;
  return `data:image/svg+xml;base64,${typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(svg))) : (globalThis as unknown as { Buffer: { from(s: string): { toString(e: string): string } } }).Buffer.from(svg).toString('base64')}`;
}

export type StockImage = { id: string; name: string; src: string };

/** Pictures offered in the Fill panel's library. */
export const STOCK_BACKGROUNDS: StockImage[] = [
  { id: 'stock-aurora', name: 'Aurora', src: art('mesh', ['#0f172a', '#6366f1', '#ec4899', '#22d3ee'], 3) },
  { id: 'stock-sunset', name: 'Sunset', src: art('mesh', ['#7c2d12', '#fb923c', '#f43f5e', '#fde68a'], 5) },
  { id: 'stock-dunes', name: 'Dunes', src: art('dunes', ['#fde68a', '#fdba74', '#c2410c', '#7c2d12'], 2) },
  { id: 'stock-ocean', name: 'Ocean waves', src: art('waves', ['#e0f2fe', '#7dd3fc', '#0369a1', '#082f49'], 4) },
  { id: 'stock-night', name: 'Night glow', src: art('glow', ['#0b1020', '#4f46e5', '#a855f7', '#06b6d4'], 6) },
  { id: 'stock-arches', name: 'Arches', src: art('arches', ['#fef3c7', '#fcd9b6', '#e7b58a', '#c98a5c'], 1) },
  { id: 'stock-city', name: 'Skyline', src: art('city', ['#1e1b4b', '#fbbf24', '#312e81', '#4338ca'], 8) },
  { id: 'stock-forest', name: 'Forest mist', src: art('waves', ['#ecfccb', '#86efac', '#15803d', '#052e16'], 9) },
];
