import { sponsorTiers, sponsors } from './data/sponsors-data.js';

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Sponsor links must be absolute http(s) URLs.
function safeLink(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch { return ''; }
}

// Logos may be an https URL or a relative path inside the site.
function safeLogo(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return /^https:\/\//i.test(v) ? v : '';
  if (v.startsWith('//') || v.includes('..')) return '';
  return v;
}

const rem = (n) => Math.round(n * 100) / 100;
const rowWidth = (cols, size, gap) => rem(cols * size + (cols - 1) * gap * 0.25 + 0.1);

function tile(sponsor, tier) {
  const s = tier.size;
  const look = `w="${s.base}rem" h="${s.base}rem" md-w="${s.md}rem" md-h="${s.md}rem" lg-w="${s.lg}rem" lg-h="${s.lg}rem" flex="none" bg="#fff" dark-bg="#0e0f11" border="1px solid gray-200" dark-border-color="#ffffff/10" rounded="${tier.rounded}" overflow="hidden" p="${tier.pad}" display="flex" items="center" justify="center" text="muted" font-weight="700"`;
  const name = esc(sponsor.name);
  const logo = safeLogo(sponsor.logo);
  const logoDark = safeLogo(sponsor.logoDark);
  let inner;
  if (logo && logoDark) {
    inner = `<img src="${esc(logo)}" alt="${name}" max-w="full" max-h="full" dark-display="none" display="flex"><img src="${esc(logoDark)}" alt="${name}" max-w="full" max-h="full" dark-display="flex" display="none">`;
  } else if (logo) {
    inner = `<img src="${esc(logo)}" alt="${name}" max-w="full" max-h="full">`;
  } else {
    inner = `<span aria-hidden="true">${esc(String(sponsor.name).trim().charAt(0).toUpperCase())}</span>`;
  }
  const href = safeLink(sponsor.url);
  if (href) {
    return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer sponsored" aria-label="${name}" title="${name}" text-decoration="none" hover-border-color="primary" ${look}>${inner}</a>`;
  }
  return `<div role="img" aria-label="${name}" title="${name}" ${look}>${inner}</div>`;
}

export function renderWall(list = sponsors, tiers = sponsorTiers) {
  const shown = list.filter((s) => s && s.verified === true && s.name);
  let html = '';
  for (const tier of tiers) {
    const members = shown.filter((s) => s.tier === tier.id);
    if (!members.length) continue;
    const { cols, size, gap } = tier;
    const width = `max-w="${rowWidth(cols.base, size.base, gap.base)}rem" md-max-w="${rowWidth(cols.md, size.md, gap.md)}rem" lg-max-w="${rowWidth(cols.lg, size.lg, gap.md)}rem"`;
    html += `<div aria-label="${esc(tier.name)} sponsors" role="group">
      <div display="flex" items="center" gap="4" mb="8">
        <span flex="1" border-t="1px solid gray-200" dark-border-color="#ffffff/10"></span>
        <span display="inline-flex" items="center" gap="2" bg="${tier.tone}/10" text="${tier.tone}" rounded="md" px="3" py="1" font-size="xs" font-weight="600"><i class="${esc(tier.icon)}"></i> ${esc(tier.name)}</span>
        <span flex="1" border-t="1px solid gray-200" dark-border-color="#ffffff/10"></span>
      </div>
      <div display="flex" wrap justify="center" gap="${gap.base}" md-gap="${gap.md}" mx="auto" ${width}>${members.map((m) => tile(m, tier)).join('')}</div>
    </div>`;
  }
  return { html, count: shown.length };
}

if (typeof document !== 'undefined') {
  const tiersEl = document.getElementById('sponsor-tiers');
  const emptyEl = document.getElementById('sponsor-empty');
  const statusEl = document.getElementById('sponsor-status');
  if (tiersEl) {
    const { html, count } = renderWall();
    tiersEl.innerHTML = html;
    if (emptyEl) emptyEl.hidden = count > 0;
    if (statusEl) statusEl.hidden = true;
  }
}