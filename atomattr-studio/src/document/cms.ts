import type { CmsField, CmsFieldType, CmsItem, Collection, Repeater } from './types';

/** CMS core: pure functions over the project's collections. No DOM, no store. */
export const FIELD_TYPES: { id: CmsFieldType; label: string }[] = [
  { id: 'text', label: 'Text' }, { id: 'longtext', label: 'Long text' }, { id: 'number', label: 'Number' }, { id: 'image', label: 'Image URL' },
  { id: 'link', label: 'Link' }, { id: 'date', label: 'Date' }, { id: 'bool', label: 'Yes / no' }, { id: 'select', label: 'Choice' },
];

/** Field key used in `{{key}}` bindings: lowercase letters, digits and dashes, starting with a letter. */
export const keyFrom = (name: string, taken: Iterable<string> = []) => {
  const used = new Set(taken); const base = (name || 'field').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/^(\d)/, 'f-$1') || 'field';
  let k = base; let n = 2; while (used.has(k)) k = `${base}-${n++}`; return k;
};
export const slugFrom = (name: string, taken: Iterable<string> = []) => keyFrom(name || 'collection', taken);

/** Values every item carries for bindings in addition to its fields. */
const BUILTIN: Record<string, (item: CmsItem, index: number) => string> = {
  'item-id': i => i.id, 'item-number': (_, n) => String(n + 1),
  'item-slug': () => '', 'item-url': () => '', // filled in by itemRow, which knows the collection
};
export const builtinKeys = Object.keys(BUILTIN);

/** The field that names an item's web page: the one picked in the Fields tab, else the first Text field. */
export const slugFieldOf = (c: Collection): CmsField | undefined => c.fields.find(f => f.key === c.slugField) || c.fields.find(f => f.type === 'text') || c.fields[0];
/** Web address piece for every item (unique inside the collection, so two posts with one title still get two pages). */
export function itemSlugs(c: Collection): Map<string, string> {
  const f = slugFieldOf(c); const used = new Set<string>(); const out = new Map<string, string>();
  c.items.forEach((it, i) => { const base = keyFrom((f && it.values[f.key]) || `${c.slug}-${i + 1}`, []); let k = base; let n = 2; while (used.has(k)) k = `${base}-${n++}`; used.add(k); out.set(it.id, k); });
  return out;
}
/** File name of an item's own page in the exported site, e.g. blog-my-first-post.html. Flat on purpose: it works the same on any host. */
export const itemFile = (c: Collection, slug: string) => `${c.slug}-${slug}.html`;

export function itemRow(c: Collection, item: CmsItem, index = 0, slugs: Map<string, string> = itemSlugs(c)): Record<string, string> {
  const row: Record<string, string> = {};
  for (const f of c.fields) row[f.key] = item.values[f.key] ?? (f.type === 'bool' ? 'false' : '');
  for (const [k, fn] of Object.entries(BUILTIN)) row[k] = fn(item, index);
  const slug = slugs.get(item.id) || ''; row['item-slug'] = slug; row['item-url'] = slug ? itemFile(c, slug) : '';
  return row;
}

const num = (v: string) => { const n = Number(v.replace(/[^0-9eE+\-.]/g, '')); return Number.isFinite(n) && v.trim() !== '' ? n : null; };
/** Compare for sort: numbers and ISO dates compare naturally, everything else case-insensitively. */
export function compareValues(a: string, b: string, type?: CmsFieldType): number {
  if (type === 'number') { const x = num(a), y = num(b); if (x !== null && y !== null) return x - y; if (x !== null) return -1; if (y !== null) return 1; }
  if (type === 'date') { const x = Date.parse(a), y = Date.parse(b); if (!isNaN(x) && !isNaN(y)) return x - y; }
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
}

export function matches(value: string, op: NonNullable<Repeater['filterOp']>, target: string, type?: CmsFieldType): boolean {
  switch (op) {
    case 'eq': return value.trim().toLowerCase() === target.trim().toLowerCase();
    case 'neq': return value.trim().toLowerCase() !== target.trim().toLowerCase();
    case 'contains': return value.toLowerCase().includes(target.toLowerCase());
    case 'gt': return compareValues(value, target, type) > 0;
    case 'lt': return compareValues(value, target, type) < 0;
  }
}

/** Published items of a collection as binding rows, after the repeater's filter, sort and limit. Drafts never appear. */
export function collectionRows(c: Collection, r: Pick<Repeater, 'filterKey' | 'filterOp' | 'filterValue' | 'sortKey' | 'sortDir' | 'limit'> = {}): Array<Record<string, string>> {
  const type = (k?: string) => c.fields.find(f => f.key === k)?.type;
  const slugs = itemSlugs(c); let rows = c.items.filter(i => !i.draft).map((i, n) => itemRow(c, i, n, slugs));
  if (r.filterKey && r.filterOp) rows = rows.filter(row => matches(row[r.filterKey!] ?? '', r.filterOp!, r.filterValue ?? '', type(r.filterKey)));
  if (r.sortKey) { const dir = r.sortDir === 'desc' ? -1 : 1; rows = rows.map((row, i) => ({ row, i })).sort((a, b) => dir * compareValues(a.row[r.sortKey!] ?? '', b.row[r.sortKey!] ?? '', type(r.sortKey)) || a.i - b.i).map(x => x.row); }
  if (r.limit && r.limit > 0) rows = rows.slice(0, Math.floor(r.limit));
  return rows.map((row, n) => ({ ...row, 'item-number': String(n + 1) }));
}

/** Rows a repeater renders. A repeater tied to a collection that no longer exists renders nothing, never stale CSV. */
export function resolveRepeatRows(r: Repeater, collections: Collection[] | undefined, parseCsv: (csv: string) => Array<Record<string, string>>): Array<Record<string, string>> {
  if (r.collectionId) { const c = collections?.find(x => x.id === r.collectionId); return c ? collectionRows(c, r) : []; }
  return r.rows?.length ? r.rows : parseCsv(r.csv);
}

/** Binding keys referenced as {{key}} anywhere in a string. */
export const bindingKeys = (text: string | undefined): string[] => { const out: string[] = []; text?.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_m, k: string) => { out.push(k.trim()); return ''; }); return out; };

export const defaultValue = (f: CmsField) => (f.type === 'bool' ? 'false' : f.type === 'select' ? f.options?.[0] ?? '' : '');
