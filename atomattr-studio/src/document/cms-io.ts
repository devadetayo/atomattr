import type { CmsField, CmsFieldType, Collection } from './types';
import { parseCsv } from './gen';
import { keyFrom } from './cms';

/** CSV and JSON import / export for collections. Kept apart from cms.ts so cms.ts has no dependency on the generator. */
const q = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
export const collectionToCsv = (c: Collection) => [c.fields.map(f => q(f.name)).join(','), ...c.items.map(i => c.fields.map(f => q(i.values[f.key] ?? '')).join(','))].join('\n') + '\n';
export const collectionToJson = (c: Collection) => JSON.stringify({ name: c.name, slug: c.slug, fields: c.fields.map(({ name, key, type, options }) => ({ name, key, type, ...(options ? { options } : {}) })), items: c.items.map(i => ({ ...i.values, ...(i.draft ? { _draft: 'true' } : {}) })) }, null, 2);

const guessType = (values: string[]): CmsFieldType => {
  const v = values.filter(x => x.trim());
  if (!v.length) return 'text';
  if (v.every(x => /^(true|false|yes|no)$/i.test(x))) return 'bool';
  if (v.every(x => /^-?\d+(\.\d+)?$/.test(x.trim()))) return 'number';
  if (v.every(x => /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}.*)?$/.test(x.trim()))) return 'date';
  if (v.every(x => /^https?:\/\/\S+\.(png|jpe?g|gif|webp|avif|svg)(\?\S*)?$/i.test(x.trim()))) return 'image';
  if (v.every(x => /^(https?:\/\/|\/|#)\S*$/.test(x.trim()))) return 'link';
  if (v.some(x => x.length > 120 || x.includes('\n'))) return 'longtext';
  return 'text';
};

/** Builds a collection from CSV: the header row names the fields, their types are guessed from the values. Returns null for empty input. */
export function collectionFromCsv(csv: string, name: string, ids: { uid: () => string; takenSlugs?: string[] }): Collection | null {
  const rows = parseCsv(csv); const header = csv.split(/\r?\n/, 1)[0] ? parseCsv(csv.split(/\r?\n/, 1)[0] + '\nx')[0] : null;
  const names = header ? Object.keys(header) : []; if (!names.length) return null;
  const taken: string[] = []; const fields: CmsField[] = names.map(n => { const key = keyFrom(n, taken); taken.push(key); return { id: ids.uid(), name: n || key, key, type: guessType(rows.map(r => r[n] ?? '')) }; });
  return { id: ids.uid(), name, slug: keyFrom(name, ids.takenSlugs), fields, items: rows.map(r => ({ id: ids.uid(), values: Object.fromEntries(fields.map((f, i) => [f.key, r[names[i]] ?? ''])) })) };
}

/** Appends CSV rows to an existing collection, matching columns by field name (case-insensitive). Unknown columns are ignored. */
export function appendCsv(c: Collection, csv: string, newId: () => string): { collection: Collection; added: number; ignored: string[] } {
  const rows = parseCsv(csv); const names = rows[0] ? Object.keys(rows[0]) : [];
  const map = new Map<string, CmsField>(); const ignored: string[] = [];
  for (const n of names) { const f = c.fields.find(x => x.name.toLowerCase() === n.toLowerCase() || x.key === n.toLowerCase()); if (f) map.set(n, f); else ignored.push(n); }
  const items = rows.map(r => ({ id: newId(), values: Object.fromEntries(c.fields.map(f => [f.key, ''])) as Record<string, string> }));
  rows.forEach((r, i) => map.forEach((f, n) => { items[i].values[f.key] = r[n] ?? ''; }));
  return { collection: { ...c, items: [...c.items, ...items] }, added: items.length, ignored };
}
