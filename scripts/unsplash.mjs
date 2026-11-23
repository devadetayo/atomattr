#!/usr/bin/env node
// Puts real Unsplash photos into the catalog components that have empty image slots.
//
//   UNSPLASH_ACCESS_KEY=xxxx node scripts/unsplash.mjs fetch     # search Unsplash, write data/unsplash.json
//   node scripts/unsplash.mjs apply --dry                        # show what would change
//   node scripts/unsplash.mjs apply                              # patch data/groups/*.js
//   UNSPLASH_ACCESS_KEY=xxxx node scripts/unsplash.mjs track     # ping Unsplash for each photo used (API guidelines)
//   node scripts/unsplash.mjs report                             # list photo placeholders still left to do by hand
//
// Photos are hot-linked from images.unsplash.com (what Unsplash asks for) with sizing parameters.
// Nothing is downloaded or re-hosted. Credits are written to data/unsplash-credits.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GROUPS = path.join(root, 'data/groups');
const MANIFEST = path.join(root, 'data/unsplash.json');
const CREDITS = path.join(root, 'data/unsplash-credits.md');
const APP = 'atomattr';

// kind -> search. Keep queries concrete so results are clean and on-brand.
const KINDS = {
  portrait:   { query: 'professional portrait smiling', orientation: 'squarish' },
  workspace:  { query: 'modern workspace desk laptop', orientation: 'landscape' },
  travel:     { query: 'travel destination landscape', orientation: 'landscape' },
  interiors:  { query: 'modern interior design living room', orientation: 'landscape' },
  coast:      { query: 'coast beach ocean aerial', orientation: 'landscape' },
  mountains:  { query: 'mountain peaks landscape', orientation: 'landscape' },
  forest:     { query: 'forest woods light', orientation: 'landscape' },
  citynight:  { query: 'city night lights', orientation: 'landscape' },
  food:       { query: 'food plated restaurant', orientation: 'landscape' },
  tech:       { query: 'technology gadgets minimal', orientation: 'landscape' },
  fashion:    { query: 'fashion style clothing minimal', orientation: 'squarish' },
  footwear:   { query: 'sneakers product studio', orientation: 'squarish' },
  headphones: { query: 'headphones product studio', orientation: 'squarish' },
  watch:      { query: 'wristwatch product studio', orientation: 'squarish' },
  product:    { query: 'product photography minimal studio', orientation: 'squarish' },
  house:      { query: 'modern house exterior', orientation: 'landscape' },
  creative:   { query: 'creative studio camera video', orientation: 'landscape' },
  hero:       { query: 'abstract landscape wide', orientation: 'landscape' },
};
const CAPSULE_CYCLE = ['coast', 'mountains', 'forest', 'citynight', 'interiors'];
// Photo-background hero sections (gradient placeholder today).
const HERO_SLUGS = new Set([
  'hero-image-hero-background-photo', 'hero-photo-hero-left-aligned',
  'hero-photo-hero-with-video-button', 'hero-photo-hero-with-feature-strip',
]);

const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

function kindFor(label, slug, n) {
  const l = (label || '').toLowerCase();
  if (/avatar|portrait|speaker/.test(l)) return 'portrait';
  if (/footwear/.test(l)) return 'footwear';
  if (/audio/.test(l)) return 'headphones';
  if (/watch/.test(l)) return 'watch';
  if (/interior/.test(l)) return 'interiors';
  if (/workspace/.test(l)) return 'workspace';
  if (/^food/.test(l)) return 'food';
  if (/^tech/.test(l)) return 'tech';
  if (/^style/.test(l)) return 'fashion';
  if (/coast/.test(l)) return 'coast';
  if (/peaks/.test(l)) return 'mountains';
  if (/woods/.test(l)) return 'forest';
  if (/^night/.test(l)) return 'citynight';
  if (/capsule/.test(l)) return CAPSULE_CYCLE[n % CAPSULE_CYCLE.length];
  if (/video/.test(l)) return 'creative';
  if (/travel|destination|place/.test(l)) return 'travel';
  if (/stay|property/.test(l)) return /property/.test(l) ? 'house' : 'interiors';
  if (/product/.test(l)) return 'product';
  if (/product|shop|store|sale/.test(slug)) return 'product';
  if (/destination|travel|trip/.test(slug)) return 'travel';
  if (/stay|property|hotel|rental/.test(slug)) return 'interiors';
  return 'workspace';
}

function sized(photo, kind, isAvatar) {
  const base = photo.base;
  return isAvatar
    ? `${base}?auto=format&fit=crop&crop=faces&w=160&h=160&q=75`
    : kind === 'hero' ? `${base}?auto=format&fit=crop&w=1600&q=70`
    : `${base}?auto=format&fit=crop&w=900&q=75`;
}

const load = () => JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const files = () => fs.readdirSync(GROUPS).filter(f => f.endsWith('.js'));

async function fetchCmd() {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) { console.error('Set UNSPLASH_ACCESS_KEY (free at https://unsplash.com/oauth/applications).'); process.exit(1); }
  const out = { generated: new Date().toISOString(), photos: {} };
  for (const [kind, q] of Object.entries(KINDS)) {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.search = new URLSearchParams({ query: q.query, per_page: '24', orientation: q.orientation, content_filter: 'high' });
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } });
    if (!res.ok) { console.error(kind, res.status, await res.text()); process.exit(1); }
    const json = await res.json();
    out.photos[kind] = json.results.map(p => ({
      id: p.id,
      base: p.urls.raw.split('?')[0],
      color: p.color || '#cbd5e1',
      alt: p.alt_description || p.description || '',
      author: p.user.name,
      authorUrl: `${p.user.links.html}?utm_source=${APP}&utm_medium=referral`,
      pageUrl: `${p.links.html}?utm_source=${APP}&utm_medium=referral`,
      download: p.links.download_location,
    }));
    console.log(kind.padEnd(11), out.photos[kind].length, 'photos');
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(out, null, 1));
  console.log('wrote', path.relative(root, MANIFEST));
}

function applyCmd(dry) {
  const man = load();
  const used = new Map();           // photo id -> photo
  const changes = [];
  for (const f of files()) {
    const file = path.join(GROUPS, f);
    let src = fs.readFileSync(file, 'utf8');
    const orig = src;
    const perItem = new Map();      // slug -> counter

    // 1) role="img" slots
    src = src.replace(/<[a-zA-Z][^<>]*?role=\\"img\\"[^<>]*?>/g, (tag, offset, whole) => {
      if (/bg-image=\\"url\(/.test(tag)) return tag;
      const slugM = [...whole.slice(0, offset).matchAll(/"slug":"([^"]+)"/g)].pop();
      const slug = slugM ? slugM[1] : f;
      const label = (/aria-label=\\"([^\\]*)\\"/.exec(tag) || [])[1] || '';
      const n = perItem.get(slug) ?? 0; perItem.set(slug, n + 1);
      const kind = kindFor(label, slug, n);
      const pool = man.photos[kind];
      if (!pool || !pool.length) return tag;
      const isAvatar = kind === 'portrait';
      const photo = pool[(hash(slug) + n * 7) % pool.length];
      used.set(photo.id, photo);
      changes.push(`${f} ${slug} [${label || '-'}] -> ${kind}/${photo.id}`);
      const attrs = `bg=\\"${photo.color}\\" bg-image=\\"url(${sized(photo, kind, isAvatar)})\\" bg-size=\\"cover\\" bg-position=\\"center\\" `;
      return tag.replace('role=\\"img\\"', attrs + 'role=\\"img\\"');
    });

    // 2) photo-background heroes: keep the text readable with a dark overlay
    for (const slug of HERO_SLUGS) {
      const at = src.indexOf(`"slug":"${slug}"`);
      if (at < 0) continue;
      const sec = src.indexOf('<section', at);
      const end = src.indexOf('>', sec);
      const tag = src.slice(sec, end);
      if (/url\(/.test(tag) || !/bg-image=\\"linear-gradient\([^\\"]*\)\\"/.test(tag)) continue;
      const pool = man.photos.hero; if (!pool?.length) continue;
      const photo = pool[hash(slug) % pool.length]; used.set(photo.id, photo);
      const next = tag.replace(/bg-image=\\"linear-gradient\([^\\"]*\)\\"/,
        `bg-image=\\"linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.55)), url(${sized(photo, 'hero', false)})\\" bg-size=\\"cover\\" bg-position=\\"center\\"`);
      src = src.slice(0, sec) + next + src.slice(end);
      changes.push(`${f} ${slug} [hero background] -> hero/${photo.id}`);
    }
    if (src !== orig && !dry) fs.writeFileSync(file, src);
  }
  console.log(changes.join('\n'));
  console.log(`\n${changes.length} slots, ${used.size} distinct photos${dry ? ' (dry run, nothing written)' : ''}`);
  if (!dry) {
    const lines = ['# Photo credits', '', 'Photos from [Unsplash](https://unsplash.com/?utm_source=' + APP + '&utm_medium=referral), used under the Unsplash License.', ''];
    for (const p of used.values()) lines.push(`- [Photo](${p.pageUrl}) by [${p.author}](${p.authorUrl}) on Unsplash`);
    fs.writeFileSync(CREDITS, lines.join('\n') + '\n');
    fs.writeFileSync(path.join(root, 'data/unsplash-used.json'), JSON.stringify([...used.values()].map(p => ({ id: p.id, download: p.download }))));
    console.log('wrote credits and data/unsplash-used.json');
  }
}

async function trackCmd() {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) { console.error('Set UNSPLASH_ACCESS_KEY.'); process.exit(1); }
  const list = JSON.parse(fs.readFileSync(path.join(root, 'data/unsplash-used.json'), 'utf8'));
  for (const p of list) {
    const res = await fetch(p.download, { headers: { Authorization: `Client-ID ${key}` } });
    console.log(p.id, res.status);
    await new Promise(r => setTimeout(r, 1500));
  }
}

function reportCmd() {
  // Photo placeholders without a role="img" slot need a hand-picked spot (cover, split hero, lightbox...).
  const todo = [];
  for (const f of files()) {
    const src = fs.readFileSync(path.join(GROUPS, f), 'utf8');
    for (const m of src.matchAll(/"slug":"([^"]*(?:photo|image|cover|avatar|lightbox)[^"]*)"/g)) {
      const body = src.slice(m.index, src.indexOf('"slug":', m.index + 10) > 0 ? src.indexOf('"slug":', m.index + 10) : undefined);
      if (!/bg-image=\\"url\(/.test(body)) todo.push(`${f}  ${m[1]}`);
    }
  }
  console.log(todo.length ? todo.join('\n') : 'nothing left');
}

const [cmd, flag] = process.argv.slice(2);
if (cmd === 'fetch') await fetchCmd();
else if (cmd === 'apply') applyCmd(flag === '--dry');
else if (cmd === 'track') await trackCmd();
else if (cmd === 'report') reportCmd();
else console.log('usage: unsplash.mjs fetch | apply [--dry] | track | report');
