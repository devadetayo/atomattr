import { hexToRgb } from '../src/style-data/color-utils.js';
import { SEMANTIC_COLORS, COLORS } from '../src/style-data/variables.js';

function toLinearChannel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  if (!hex || typeof hex !== 'string') return 0;
  const [r, g, b] = hexToRgb(hex);
  const R = toLinearChannel(r);
  const G = toLinearChannel(g);
  const B = toLinearChannel(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(a, b) {
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function pickSemanticPairs() {
  const pairs = [];
  // background / foreground
  if (SEMANTIC_COLORS.background && SEMANTIC_COLORS.foreground) {
    pairs.push(['background', 'foreground']);
  }
  // surface / foreground
  if (SEMANTIC_COLORS.surface && SEMANTIC_COLORS.foreground) pairs.push(['surface', 'foreground']);
  // primary on background
  if (SEMANTIC_COLORS.primary && SEMANTIC_COLORS.background) pairs.push(['primary', 'background']);
  // input on background
  if (SEMANTIC_COLORS.input && SEMANTIC_COLORS.background) pairs.push(['input', 'foreground']);

  // Dark mode pairs: evaluate dark tokens against dark-mode anchors
  if (SEMANTIC_COLORS['dark-background'] && SEMANTIC_COLORS['dark-foreground']) {
    pairs.push(['dark-background', 'dark-foreground']);
  }
  if (SEMANTIC_COLORS['dark-surface'] && SEMANTIC_COLORS['dark-foreground']) {
    pairs.push(['dark-surface', 'dark-foreground']);
  }
  if (SEMANTIC_COLORS['dark-primary'] && SEMANTIC_COLORS['dark-background']) {
    pairs.push(['dark-primary', 'dark-background']);
  }
  if (SEMANTIC_COLORS['dark-input'] && SEMANTIC_COLORS['dark-foreground']) {
    pairs.push(['dark-input', 'dark-foreground']);
  }
  if (SEMANTIC_COLORS['dark-ring'] && SEMANTIC_COLORS['dark-background']) {
    pairs.push(['dark-ring', 'dark-background']);
  }

  return pairs;
}

(async function main() {
  const pairs = pickSemanticPairs();
  const results = [];
  for (const [a, b] of pairs) {
    const va = SEMANTIC_COLORS[a] ?? COLORS[a] ?? null;
    const vb = SEMANTIC_COLORS[b] ?? COLORS[b] ?? null;
    if (!va || !vb) continue;
    const ratio = contrastRatio(va, vb);
    results.push({ a, b, va, vb, ratio });
  }

  console.log('Contrast report:');
  for (const r of results) {
    console.log(`${r.a} (${r.va}) on ${r.b} (${r.vb}) -> ${r.ratio.toFixed(2)}:1`);
  }

  const failing = results.filter(r => r.ratio < 4.5);
  if (failing.length) {
    console.log('\nFailing pairs (ratio < 4.5):');
    for (const f of failing) console.log(`- ${f.a} on ${f.b}: ${f.ratio.toFixed(2)}:1`);
    process.exitCode = 2;
  } else {
    console.log('\nAll checked pairs meet 4.5:1 contrast.');
  }
})();
