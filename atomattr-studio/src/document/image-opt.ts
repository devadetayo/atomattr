/**
 * Image optimization planning. Pure helpers (no DOM) so the rules can be tested; state/image-optimize.ts does the canvas work.
 * Photos are scaled down to MAX_DIM on the long edge and re-encoded as WebP (or JPEG / PNG when WebP is unavailable).
 * SVG and GIF are never touched (vector and animation), and an original is kept when re-encoding would not help.
 */
export const MAX_DIM = 2400;
export const QUALITY = 0.82;
/** Below this size re-encoding is not worth the quality loss. */
export const SKIP_BELOW_BYTES = 60_000;
export const INPUT_LIMIT_BYTES = 25 * 1024 * 1024;

export const canOptimize = (mime: string) => /^image\/(png|jpe?g|webp|bmp)$/i.test(mime);

export const dataUrlBytes = (dataUrl: string) => { const i = dataUrl.indexOf(','); if (i < 0) return 0; const b64 = /;base64/i.test(dataUrl.slice(0, i)); const n = dataUrl.length - i - 1; return b64 ? Math.floor(n * 0.75) : n; };

export function fitWithin(w: number, h: number, max = MAX_DIM) {
  const long = Math.max(w, h); if (!long || long <= max) return { w, h, scaled: false };
  const k = max / long; return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)), scaled: true };
}

export function pickFormat(opts: { hasAlpha: boolean; webp: boolean }): 'image/webp' | 'image/jpeg' | 'image/png' {
  if (opts.webp) return 'image/webp';
  return opts.hasAlpha ? 'image/png' : 'image/jpeg';
}

/** Keep the original unless the result is clearly smaller, or the picture had to be scaled down anyway. */
export const keepOriginal = (before: number, after: number, scaled: boolean) => after >= before * 0.95 && !(scaled && after < before);

export const extFor = (mime: string) => (mime.split('/')[1] || 'png').replace('jpeg', 'jpg').replace('svg+xml', 'svg');
export const renameForMime = (name: string, mime: string) => `${name.replace(/\.[a-z0-9]+$/i, '') || 'image'}.${extFor(mime)}`;
export const formatBytes = (n: number) => n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`;
