import { useEffect, useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import * as C from '../state/cms-actions';
import type { CmsField, Collection, Node } from '../document/types';
import { FIELD_TYPES, builtinKeys, collectionRows, itemFile, itemSlugs, slugFieldOf } from '../document/cms';
import { collectionToCsv, collectionToJson } from '../document/cms-io';
import { parseCsv } from '../document/gen';
import { download } from '../exporters/zip';
import { pickFile } from '../state/assets';
import { confirmDialog, textDialog } from '../state/dialogs';
import { Checkbox, EmptyState, IconBtn, NumField, Section, Seg, SelectField, TextField } from '../components/ui';
import { T } from '../theme';

const small = (label: string, onClick: () => void, extra: Record<string, unknown> = {}) => <Btn type="button" h="28px" px="2" {...T.card} fontSize="sm" cursor="pointer" onClick={onClick} {...extra}>{label}</Btn>;
const ask = (title: string, label: string, value = '') => textDialog({ title, label, value, required: true, confirmLabel: 'OK' } as any);
const safeName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'collection';

/* ---------- value editor for one field ---------- */
function ValueField({ f, value, onCommit }: { f: CmsField; value: string; onCommit: (v: string) => void }) {
  if (f.type === 'bool') return <Checkbox checked={value === 'true'} onChange={v => onCommit(v ? 'true' : 'false')} label={f.name} />;
  if (f.type === 'select') return <SelectField label={f.name} value={value} options={(f.options || []).map(o => [o, o] as [string, string])} onChange={onCommit} />;
  if (f.type === 'number') return <TextField label={f.name} value={value} placeholder="0" onCommit={v => onCommit(v.trim())} />;
  if (f.type === 'date') return <TextField label={`${f.name} (YYYY-MM-DD)`} value={value} placeholder="2026-01-31" onCommit={onCommit} />;
  return <TextField label={f.name} value={value} multiline={f.type === 'longtext'} placeholder={f.type === 'image' ? 'https://…/photo.jpg' : f.type === 'link' ? 'https://… or #anchor' : ''} onCommit={onCommit} />;
}

function ItemCard({ c, index }: { c: Collection; index: number }) {
  const item = c.items[index]; const [open, setOpen] = useState(false);
  const first = c.fields.find(f => f.type === 'text' || f.type === 'longtext'); const title = (first && item.values[first.key]) || `Item ${index + 1}`;
  return <Box mb="1" p="1" {...T.card}>
    <Row items="center" gap="1">
      <Btn type="button" flex="1" textAlign="left" bg="transparent" border="0" cursor="pointer" p="1" onClick={() => setOpen(!open)} aria-expanded={open}><Txt as="span" fontSize="sm" fontWeight="600" m="0" {...T.label}>{title}</Txt>{item.draft && <Txt as="span" fontSize="sm" m="0" {...T.muted}> · draft</Txt>}</Btn>
      <IconBtn icon="chevD" title="Move down" size={22} iconSize={12} disabled={index === c.items.length - 1} onClick={() => C.moveItem(c.id, item.id, 1)} />
      <IconBtn icon="copy" title="Duplicate (as draft)" size={22} iconSize={12} onClick={() => C.duplicateItem(c.id, item.id)} />
      <IconBtn icon="trash" title="Delete item" size={22} iconSize={12} danger onClick={() => { confirmDialog({ title: 'Delete this item?', message: 'It will disappear from every repeater that uses this collection.', confirmLabel: 'Delete', tone: 'danger' } as any).then(ok => { if (ok) C.deleteItem(c.id, item.id); }); }} />
    </Row>
    {open && <Box display="flex" flex-col gap="2" p="1">
      {c.fields.map(f => <ValueField key={`${item.id}-${f.id}-${item.values[f.key] ?? ''}`} f={f} value={item.values[f.key] ?? ''} onCommit={v => C.updateItem(c.id, item.id, f.key, v)} />)}
      <Checkbox checked={!item.draft} onChange={v => C.setItemDraft(c.id, item.id, !v)} label="Published (drafts never appear on the site)" />
    </Box>}
  </Box>;
}

function FieldRow({ c, f }: { c: Collection; f: CmsField }) {
  return <Box mb="1" p="1" {...T.card} display="flex" flex-col gap="1">
    <Row items="center" gap="1">
      <Box flex="1"><TextField placeholder="Field name" value={f.name} onCommit={v => C.updateField(c.id, f.id, { name: v.trim() || f.name })} /></Box>
      <Box w="116px"><SelectField value={f.type} options={FIELD_TYPES.map(t => [t.id, t.label] as [string, string])} onChange={v => C.updateField(c.id, f.id, { type: v as CmsField['type'], ...(v === 'select' && !f.options?.length ? { options: ['Option 1', 'Option 2'] } : {}) })} /></Box>
      <IconBtn icon="trash" title="Delete field" size={24} iconSize={12} danger disabled={c.fields.length <= 1} onClick={() => { confirmDialog({ title: `Delete field “${f.name}”?`, message: 'Its values are removed from every item, and bindings that use it will show a check warning.', confirmLabel: 'Delete', tone: 'danger' } as any).then(ok => { if (ok) C.deleteField(c.id, f.id); }); }} />
    </Row>
    {f.type === 'select' && <TextField label="Choices (comma separated)" value={(f.options || []).join(', ')} onCommit={v => C.updateField(c.id, f.id, { options: v.split(',').map(x => x.trim()).filter(Boolean) })} />}
    <Txt fontSize="sm" m="0" {...T.muted}>Bind with <code>{`{{${f.key}}}`}</code></Txt>
  </Box>;
}

type CmsTab = 'items' | 'fields' | 'use' | 'data';
const Step = ({ n, children }: { n: number; children: React.ReactNode }) => <Row gap="2" items="start"><Box w="20px" min-w="20px" h="20px" rounded="full" bg="primary/15" dark-bg="primary/30" text="primary" dark-text="white" display="grid" place-items="center" fontSize="sm" fontWeight="700" flex-shrink="0">{n}</Box><Txt display="block" fontSize="sm" m="0" {...T.text} leading="snug">{children}</Txt></Row>;


/* ---------- "Use it": two jobs, each in plain words ---------- */
function UsePanel({ c }: { c: Collection }) {
  const project = useStudio().project; const tpl = project ? C.itemPageOf(project, c.id) : undefined;
  const slugs = itemSlugs(c); const live = c.items.filter(i => !i.draft); const sf = slugFieldOf(c);
  const keys = [...c.fields.map(f => f.key), ...builtinKeys];
  return <Box display="flex" flex-col gap="3">
    <Txt display="block" fontSize="sm" m="0" {...T.muted} leading="snug">Your content can show up in two ways. Use one or both.</Txt>

    <Box display="flex" flex-col gap="2" p="2" {...T.card}>
      <Txt fontSize="sm" fontWeight="700" m="0" {...T.label}>A. Show a list on any page</Txt>
      <Txt display="block" fontSize="sm" m="0" {...T.muted} leading="snug">Like a row of blog cards or a team grid. You design one card and the CMS repeats it for every item.</Txt>
      <Step n={1}>Design one card (a container with an image and some text).</Step>
      <Step n={2}>Select that container and turn on Repeater in Properties.</Step>
      <Step n={3}>Pick “{c.name}” as its data source.</Step>
      <Step n={4}>Click a field below to copy it, then paste it into the card’s text, image or link.</Step>
    </Box>

    <Box display="flex" flex-col gap="2" p="2" {...T.card}>
      <Txt fontSize="sm" fontWeight="700" m="0" {...T.label}>B. Give every item its own page</Txt>
      <Txt display="block" fontSize="sm" m="0" {...T.muted} leading="snug">Like the page you open when you click a blog card. You design the page once. When you export, every published item gets its own copy with its own content.</Txt>
      {!tpl ? <>
        <Row gap="1" wrap>{small(`Make the ${c.name} item page`, () => C.createItemPage(c.id), { bg: 'primary', text: 'white' })}</Row>
        <Txt display="block" fontSize="sm" m="0" {...T.muted} leading="snug">This adds a page with your fields already placed on it. Change the design however you like.</Txt>
      </> : <>
        <Row gap="1" wrap>{small('Open the item page', () => S.switchPage(tpl.id), { bg: 'primary', text: 'white' })}</Row>
        <Txt display="block" fontSize="sm" m="0" {...T.muted} leading="snug">On that page, fields like <b>{`{{${sf?.key || 'title'}}}`}</b> are replaced by each item’s content when you export.</Txt>
        <SelectField label="Page address comes from" value={sf?.key || ''} options={c.fields.map(f => [f.key, f.name] as [string, string])} onChange={v => C.setSlugField(c.id, v)} />
        <Step n={1}>On your list card, add a button or link and set its link to <b>{'{{item-url}}'}</b>.</Step>
        <Step n={2}>Export the site. These pages are created:</Step>
        {live.length ? <Box display="flex" flex-col gap="1">{live.slice(0, 6).map(i => <Txt key={i.id} display="block" fontSize="sm" m="0" {...T.muted} style={{ fontFamily: 'ui-monospace, monospace' }}>{itemFile(c, slugs.get(i.id) || '')}</Txt>)}{live.length > 6 && <Txt fontSize="sm" m="0" {...T.muted}>…and {live.length - 6} more</Txt>}</Box> : <Txt display="block" fontSize="sm" m="0" {...T.muted}>None yet: add an item and publish it (drafts never get a page).</Txt>}
      </>}
    </Box>

    <Txt fontSize="sm" fontWeight="700" m="0" {...T.label}>Fields you can use</Txt>
    <Row gap="1" wrap>{keys.map(k => <Btn key={k} type="button" title="Copy" h="26px" px="2" {...T.card} rounded="full" fontSize="sm" cursor="pointer" onClick={() => { try { navigator.clipboard?.writeText(`{{${k}}}`); } catch { /* ignore */ } }}>{`{{${k}}}`}</Btn>)}</Row>
    <Txt display="block" fontSize="sm" m="0" {...T.muted} leading="snug">Click a field to copy it. <b>{'{{item-url}}'}</b> is the link to an item’s own page. Drafts never appear on the site.</Txt>
  </Box>;
}

export function CmsPanel() {
  const s = useStudio(); const p = s.project!; const collections = p.collections || [];
  const [sel, setSel] = useState<string | null>(null); const [tab, setTab] = useState<CmsTab>('items');
  const c = collections.find(x => x.id === sel) || collections[0];
  const create = async () => { const name = await ask('New collection', 'Name (e.g. Blog posts, Team, Products)'); if (name) { setSel(C.addCollection(name)); setTab('fields'); } };
  const importCsv = async () => { const f = await pickFile('.csv,text/csv'); if (!f) return; const text = await f.text(); const name = await ask('Import CSV', 'Collection name', f.name.replace(/\.csv$/i, '')); if (name) { const id = C.importCollectionCsv(name, text); if (id) { setSel(id); setTab('items'); } } };

  if (!collections.length) return <Box p="3" display="flex" flex-col gap="3">
    <EmptyState icon="grid" title="No collections yet" hint="A collection is a table of content, like Blog posts, Team or Products. Design one card, and the CMS repeats it for every row." />
    <Box display="flex" flex-col gap="2" p="2" {...T.card}>
      <Txt display="block" fontSize="sm" fontWeight="700" m="0" {...T.label}>How it works</Txt>
      <Step n={1}>Create a collection and name its fields.</Step>
      <Step n={2}>Add items, or import them from a CSV.</Step>
      <Step n={3}>Select a container, turn on Repeater in Properties and pick the collection.</Step>
    </Box>
    <Row gap="1" wrap>{small('New collection', create, { bg: 'primary', text: 'white' })}{small('Import CSV', importCsv)}</Row>
  </Box>;

  const draft = c.items.filter(i => i.draft).length;
  const opts: { v: CmsTab; label: string; title?: string }[] = [
    { v: 'items', label: `Items · ${c.items.length}`, title: 'The rows of content' },
    { v: 'fields', label: `Fields · ${c.fields.length}`, title: 'The columns each item has' },
    { v: 'use', label: 'Use it', title: 'How to show this content on a page' },
    { v: 'data', label: 'Import / export', title: 'CSV and JSON in and out' },
  ];
  return <Box p="2" display="flex" flex-col gap="2">
    <Row gap="1" items="end"><Box flex="1"><SelectField label="Collection" value={c.id} options={collections.map(x => [x.id, `${x.name} (${x.items.length})`] as [string, string])} onChange={v => { setSel(v); }} /></Box>
      <IconBtn icon="plus" title="New collection" size={28} onClick={create} />
      <IconBtn icon="pencil" title="Rename" size={28} onClick={async () => { const n = await ask('Rename collection', 'Name', c.name); if (n) C.renameCollection(c.id, n); }} />
      <IconBtn icon="trash" title="Delete collection" size={28} danger onClick={() => { confirmDialog({ title: `Delete “${c.name}”?`, message: 'Repeaters that use it will render nothing until you pick another source.', confirmLabel: 'Delete', tone: 'danger' } as any).then(ok => { if (ok) { C.deleteCollection(c.id); setSel(null); } }); }} /></Row>
    <Seg value={tab} options={opts} onChange={setTab} label="CMS sections" />

    {tab === 'items' && <Box display="flex" flex-col gap="2">
      <Row items="center" justify="space-between"><Txt fontSize="sm" m="0" {...T.muted}>{collectionRows(c).length} published{draft ? ` · ${draft} draft` : ''}</Txt>{small('Add item', () => C.addItem(c.id), { bg: 'primary', text: 'white' })}</Row>
      {!c.items.length ? <EmptyState icon="grid" title="No items yet" hint="Add one by hand, or import a CSV from the Import / export tab." /> : c.items.map((_, i) => <ItemCard key={c.items[i].id} c={c} index={i} />)}
    </Box>}

    {tab === 'fields' && <Box display="flex" flex-col gap="2">
      <Txt display="block" fontSize="sm" m="0" {...T.muted} leading="snug">Fields are the columns every item has. Each one gets a name you bind to on the page.</Txt>
      {c.fields.map(f => <FieldRow key={f.id} c={c} f={f} />)}
      {small('Add field', async () => { const n = await ask('New field', 'Field name'); if (n) C.addField(c.id, n, 'text'); }, { alignSelf: 'start' })}
      <Txt display="block" fontSize="sm" m="0" {...T.muted} leading="snug">Also in every collection: {builtinKeys.map(k => `{{${k}}}`).join(', ')}.</Txt>
    </Box>}

    {tab === 'use' && <UsePanel c={c} />}

    {tab === 'data' && <Box display="flex" flex-col gap="2">
      <Txt fontSize="sm" fontWeight="700" m="0" {...T.label}>Bring content in</Txt>
      <Row gap="1" wrap>
        {small('Add rows from CSV', async () => { const f = await pickFile('.csv,text/csv'); if (f) C.appendCsvToCollection(c.id, await f.text()); })}
        {small('New collection from CSV', importCsv)}
      </Row>
      <Txt fontSize="sm" fontWeight="700" m="0" mt="1" {...T.label}>Take it out</Txt>
      <Row gap="1" wrap>
        {small('Export CSV', () => download(new Blob([collectionToCsv(c)], { type: 'text/csv' }), `${safeName(c.slug)}.csv`))}
        {small('Export JSON', () => download(new Blob([collectionToJson(c)], { type: 'application/json' }), `${safeName(c.slug)}.json`))}
      </Row>
    </Box>}
  </Box>;
}

/* ---------- repeater data source (used by Properties) ---------- */
const OPS: [string, string][] = [['', 'No filter'], ['eq', 'equals'], ['neq', 'does not equal'], ['contains', 'contains'], ['gt', 'greater than'], ['lt', 'less than']];
export function RepeaterSource({ ids, node }: { ids: string[]; node: Node }) {
  const s = useStudio(); const collections = s.project?.collections || []; const r = node.repeat!;
  const set = (patch: Partial<NonNullable<Node['repeat']>>) => S.patchNodeProps(ids, { repeat: { ...r, ...patch } });
  const c = collections.find(x => x.id === r.collectionId);
  return <>
    <SelectField label="Data source" value={r.collectionId || ''} options={[['', 'Pasted CSV'], ...collections.map(x => [x.id, `CMS: ${x.name}`] as [string, string])]} onChange={v => set({ collectionId: v || undefined })} />
    {!c && <><TextField label="Data (CSV)" multiline value={r.csv} onCommit={csv => set({ csv, rows: parseCsv(csv) })} /><Txt fontSize="sm" m="0" {...T.muted}>{r.rows.length} data row(s). Keep a single child as the template.</Txt></>}
    {r.collectionId && !c && <Txt fontSize="sm" m="0" text="danger">This collection no longer exists, so nothing is shown. Pick another source.</Txt>}
    {c && <>
      <Txt fontSize="sm" m="0" {...T.muted}>Fields: {c.fields.map(f => `{{${f.key}}}`).join(' ')} · {collectionRows(c, r).length} item(s) shown.</Txt>
      <Row gap="1" items="end"><Box flex="1"><SelectField label="Filter" value={r.filterOp && r.filterKey ? r.filterOp : ''} options={OPS} onChange={v => set(v ? { filterOp: v as any, filterKey: r.filterKey || c.fields[0]?.key } : { filterOp: undefined, filterKey: undefined, filterValue: undefined })} /></Box></Row>
      {r.filterOp && <Row gap="1"><Box flex="1"><SelectField label="Field" value={r.filterKey || ''} options={c.fields.map(f => [f.key, f.name] as [string, string])} onChange={v => set({ filterKey: v })} /></Box><Box flex="1"><TextField label="Value" value={r.filterValue || ''} onCommit={v => set({ filterValue: v })} /></Box></Row>}
      <Row gap="1"><Box flex="1"><SelectField label="Sort by" value={r.sortKey || ''} options={[['', 'Manual order'], ...c.fields.map(f => [f.key, f.name] as [string, string])]} onChange={v => set({ sortKey: v || undefined })} /></Box>
        {r.sortKey && <Box w="110px"><SelectField label="Direction" value={r.sortDir || 'asc'} options={[['asc', 'Ascending'], ['desc', 'Descending']]} onChange={v => set({ sortDir: v as 'asc' | 'desc' })} /></Box>}</Row>
      <NumField label="Limit (0 = all)" value={r.limit || 0} min={0} step={1} onCommit={v => set({ limit: v > 0 ? Math.floor(v) : undefined })} />
    </>}
  </>;
}

/* ---------- custom code now lives in the Code panel (Custom CSS / JS / Head tabs) ---------- */
export function CustomCodePanel() {
  useEffect(() => { S.toggleCode('custom:css'); S.toggleDocker('code'); }, []);
  return <Box p="3"><Txt fontSize="sm" m="0" {...T.muted}>Custom code moved into the Code panel, under Custom CSS, JS and Head.</Txt></Box>;
}
