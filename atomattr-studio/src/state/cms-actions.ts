import type { CmsField, CmsFieldType, CmsItem, Collection, CustomCode, Node, Project } from '../document/types';
import { uid } from '../document/tree';
import { defaultValue, keyFrom, slugFrom } from '../document/cms';
import { appendCsv, collectionFromCsv } from '../document/cms-io';
import { makeButton, makeHeading, makeImage, makePage, makeSection, makeText } from '../document/factory';
import { slugFieldOf } from '../document/cms';
import { getState, setProject, switchPage, toast } from './store';

/** Editor actions for the CMS and custom code. Each one is a single undoable project change. */
const proj = (): Project | null => getState().project;
const cols = (p: Project) => p.collections || [];
const withCols = (p: Project, next: Collection[]) => setProject({ ...p, collections: next });
const mapCol = (id: string, fn: (c: Collection) => Collection) => { const p = proj(); if (!p) return; withCols(p, cols(p).map(c => (c.id === id ? fn(c) : c))); };

export function addCollection(name: string): string | null {
  const p = proj(); if (!p) return null; const id = uid(); const nm = name.trim() || 'Collection';
  const titleField: CmsField = { id: uid(), name: 'Title', key: 'title', type: 'text' };
  withCols(p, [...cols(p), { id, name: nm, slug: slugFrom(nm, cols(p).map(c => c.slug)), fields: [titleField], items: [] }]); return id;
}
export const renameCollection = (id: string, name: string) => mapCol(id, c => ({ ...c, name: name.trim() || c.name }));
export function deleteCollection(id: string) { const p = proj(); if (p) withCols(p, cols(p).filter(c => c.id !== id)); }

export function addField(cid: string, name: string, type: CmsFieldType) {
  mapCol(cid, c => { const f: CmsField = { id: uid(), name: name.trim() || 'Field', key: keyFrom(name, c.fields.map(x => x.key)), type, ...(type === 'select' ? { options: ['Option 1', 'Option 2'] } : {}) };
    return { ...c, fields: [...c.fields, f], items: c.items.map(i => ({ ...i, values: { ...i.values, [f.key]: defaultValue(f) } })) }; });
}
/** The key (used in {{bindings}}) never changes when a field is renamed, so existing bindings keep working. */
export const updateField = (cid: string, fid: string, patch: Partial<Pick<CmsField, 'name' | 'type' | 'options' | 'required'>>) => mapCol(cid, c => ({ ...c, fields: c.fields.map(f => (f.id === fid ? { ...f, ...patch } : f)) }));
export const deleteField = (cid: string, fid: string) => mapCol(cid, c => { const f = c.fields.find(x => x.id === fid); if (!f) return c; return { ...c, fields: c.fields.filter(x => x.id !== fid), items: c.items.map(i => { const { [f.key]: _gone, ...rest } = i.values; return { ...i, values: rest }; }) }; });

export function addItem(cid: string) { mapCol(cid, c => ({ ...c, items: [...c.items, { id: uid(), values: Object.fromEntries(c.fields.map(f => [f.key, defaultValue(f)])), updatedAt: Date.now() }] })); }
export const updateItem = (cid: string, iid: string, key: string, value: string) => mapCol(cid, c => ({ ...c, items: c.items.map(i => (i.id === iid ? { ...i, values: { ...i.values, [key]: value }, updatedAt: Date.now() } : i)) }));
export const setItemDraft = (cid: string, iid: string, draft: boolean) => mapCol(cid, c => ({ ...c, items: c.items.map(i => (i.id === iid ? { ...i, draft: draft || undefined } : i)) }));
export const deleteItem = (cid: string, iid: string) => mapCol(cid, c => ({ ...c, items: c.items.filter(i => i.id !== iid) }));
export const duplicateItem = (cid: string, iid: string) => mapCol(cid, c => { const at = c.items.findIndex(i => i.id === iid); if (at < 0) return c; const copy: CmsItem = { ...c.items[at], id: uid(), draft: true, values: { ...c.items[at].values } }; return { ...c, items: [...c.items.slice(0, at + 1), copy, ...c.items.slice(at + 1)] }; });
export const moveItem = (cid: string, iid: string, by: -1 | 1) => mapCol(cid, c => { const a = c.items.findIndex(i => i.id === iid), b = a + by; if (a < 0 || b < 0 || b >= c.items.length) return c; const items = [...c.items]; [items[a], items[b]] = [items[b], items[a]]; return { ...c, items }; });

export function importCollectionCsv(name: string, csv: string): string | null {
  const p = proj(); if (!p) return null;
  const c = collectionFromCsv(csv, name.trim() || 'Imported', { uid, takenSlugs: cols(p).map(x => x.slug) });
  if (!c) { toast('That CSV has no header row.', 'error'); return null; }
  withCols(p, [...cols(p), c]); toast(`Imported ${c.items.length} item${c.items.length === 1 ? '' : 's'} with ${c.fields.length} fields.`); return c.id;
}
export function appendCsvToCollection(cid: string, csv: string) {
  const p = proj(); const c = p && cols(p).find(x => x.id === cid); if (!p || !c) return;
  const r = appendCsv(c, csv, uid); withCols(p, cols(p).map(x => (x.id === cid ? r.collection : x)));
  toast(`Added ${r.added} item${r.added === 1 ? '' : 's'}${r.ignored.length ? `. Ignored columns: ${r.ignored.join(', ')}` : ''}.`);
}

/** Project-level custom code (page-level code is edited through setPageCustom). */
export function setProjectCustom(patch: Partial<CustomCode>) { const p = proj(); if (p) setProject({ ...p, custom: { ...p.custom, ...patch } }); }
export function setPageCustom(pageId: string, patch: Partial<CustomCode>) { const p = proj(); if (p) setProject({ ...p, pages: p.pages.map(pg => (pg.id === pageId ? { ...pg, custom: { ...pg.custom, ...patch } } : pg)) }); }

/** Which field names each item's web page (its address). */
export const setSlugField = (cid: string, key: string) => mapCol(cid, c => ({ ...c, slugField: key }));

/** The page that is a template for a collection, if the user has made one. */
export const itemPageOf = (p: Project, cid: string) => p.pages.find(pg => pg.templateOf === cid);

/**
 * "Give every item its own page": adds an Item page with the fields already laid out ({{title}}, the image, the text), so the
 * user edits a real page instead of typing tags from scratch. The site export writes one copy of it per published item.
 */
export function createItemPage(cid: string): string | null {
  const p = proj(); const c = p && cols(p).find(x => x.id === cid); if (!p || !c) return null;
  const have = itemPageOf(p, cid); if (have) { switchPage(have.id); return have.id; }
  if (p.kind === 'page') { toast('This project is a single page. Create a website project to add item pages.', 'error'); return null; }
  const tf = slugFieldOf(c); const flow = (n: Node): Node => ({ ...n, style: { ...n.style, mode: 'flow' as const } });
  const kids: Node[] = [];
  const back = makeText(0, 0, `← All ${c.name.toLowerCase()}`, 16); back.href = p.pages[0] ? `page:${p.pages[0].id}` : '#'; back.style = { ...back.style, color: '#4f46e5', fontWeight: 600, w: 'auto' } as Node['style']; kids.push(flow(back));
  if (tf) { const h = makeHeading(0, 0, `{{${tf.key}}}`, 48); h.style = { ...h.style, w: 'fill', h: 'auto' } as Node['style']; kids.push(flow(h)); }
  for (const f of c.fields) {
    if (f === tf) continue;
    if (f.type === 'image') { const im = makeImage(0, 0, 800, 380, `{{${f.key}}}`, undefined, `{{${tf?.key || f.key}}}`); im.style = { ...im.style, w: 'fill', h: 380, radius: 16 } as Node['style']; kids.push(flow(im)); }
    else if (f.type === 'longtext' || f.type === 'text') { const t = makeText(0, 0, `{{${f.key}}}`, f.type === 'longtext' ? 18 : 16); t.style = { ...t.style, w: 'fill', h: 'auto', color: f.type === 'longtext' ? '#374151' : '#6b7280' } as Node['style']; kids.push(flow(t)); }
    else if (f.type === 'link') { const b = makeButton(0, 0, f.name); b.href = `{{${f.key}}}`; b.style = { ...b.style, w: 'auto' } as Node['style']; kids.push(flow(b)); }
    else { const t = makeText(0, 0, `${f.name}: {{${f.key}}}`, 15); t.style = { ...t.style, w: 'fill', h: 'auto', color: '#6b7280' } as Node['style']; kids.push(flow(t)); }
  }
  const sec = makeSection('Item', 560, '#ffffff');
  sec.style = { ...sec.style, layout: 'flex', dir: 'column', items: 'stretch', justify: 'start', gap: 20, padX: 64, padY: 72, h: 'auto', maxW: 880, self: 'center' } as Node['style'];
  sec.children = kids;
  const pg = makePage(`${c.name} item page`, [sec]); pg.templateOf = cid; pg.inNav = false;
  setProject({ ...p, pages: [...p.pages, pg], activePageId: pg.id }); toast(`Made the ${c.name} item page. Every published item gets its own page from it.`);
  return pg.id;
}
