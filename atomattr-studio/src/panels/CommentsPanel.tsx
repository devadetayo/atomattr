import { useState } from 'react';
import { Box, Btn, Row, Txt } from 'atomattr/react';
import * as S from '../state/store';
import { useStudio } from '../state/store';
import { uid, find } from '../document/tree';
import type { Comment } from '../document/types';
import { addReply, commentsToMarkdown, mergeComments, newThread, openCount, parseComments, removeThread, setResolved } from '../document/comments';
import { pickFile } from '../state/assets';
import { download } from '../exporters/zip';
import { confirmDialog } from '../state/dialogs';
import { EmptyState, IconBtn, Seg, TextField } from '../components/ui';
import { T } from '../theme';

const NAME_KEY = 'atomattr.studio.author';
const loadName = () => { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } };
const saveName = (v: string) => { try { localStorage.setItem(NAME_KEY, v); } catch { /* the name lasts for this session */ } };
const ago = (t: number) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : new Date(t).toLocaleDateString(); };
const Field = (p: any) => <Box as="textarea" rows="3" w="100%" p="2" fontSize="sm" outline="none" resize="vertical" {...T.field} text="gray-800" dark-text="gray-100" {...p} />;

/**
 * Review comments. They are saved inside the project, so a reviewer who gets your project file can comment and send it back,
 * and "Merge comments" brings theirs into yours. There is no live multi-user editing: Studio has no server.
 */
export function CommentsPanel() {
  const s = useStudio(); const p = s.project!; const list = p.comments || []; const pg = S.page(s); const sel = S.selNodes(s)[0];
  const [name, setName] = useState(loadName); const [draft, setDraft] = useState(''); const [view, setView] = useState<'open' | 'resolved' | 'all'>('open'); const [everyPage, setEvery] = useState(false);
  const save = (next: Comment[]) => S.setProject({ ...p, comments: next }, { history: false });
  const who = name.trim() || 'Anonymous';
  const add = () => { if (!draft.trim()) return; save([...list, newThread(uid(), who, draft, pg.id, sel?.id, Date.now())]); setDraft(''); };
  const shown = list.filter(c => (everyPage || c.pageId === pg.id) && (view === 'all' || (view === 'open') === !c.resolved));
  const pageName = (id: string) => p.pages.find(x => x.id === id)?.name || 'Deleted page';
  const nodeName = (id?: string) => { for (const x of p.pages) { const n = id ? find(x.root, id) : null; if (n) return n.name; } return 'object removed'; };
  const go = (c: Comment) => { if (c.pageId !== S.getState().project?.activePageId && p.pages.some(x => x.id === c.pageId)) S.switchPage(c.pageId); if (c.nodeId) setTimeout(() => S.select([c.nodeId!]), 30); };
  const merge = async () => {
    const f = await pickFile('.json,.astudio,application/json'); if (!f) return;
    try { const raw = JSON.parse(await f.text()); const inc = parseComments(raw); if (!inc.length) { S.toast('No comments found in that file.', 'error'); return; }
      const { merged, added, updated } = mergeComments(list, inc); save(merged); S.toast(added || updated ? `Merged ${added} new and ${updated} updated threads.` : 'Nothing new to merge.'); } catch { S.toast('Could not read that file.', 'error'); }
  };
  return <Box p="3" display="flex" flex-col gap="3">
    <Box display="flex" flex-col gap="2" p="3" {...T.tile}>
      <TextField label="Your name" value={name} placeholder="Shown on your comments" onCommit={v => { setName(v); saveName(v); }} />
      <Field value={draft} placeholder={sel ? `Comment on ${sel.name}…` : `Comment on ${pg.name}…`} aria-label="New comment" onChange={(e: any) => setDraft(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) add(); }} />
      <Btn type="button" onClick={add} disabled={!draft.trim()} h="30px" rounded="lg" border="0" cursor="pointer" fontSize="sm" fontWeight="600" bg="primary" text="white" opacity={draft.trim() ? '100' : '50'}>Add comment{sel ? ' on selection' : ''}</Btn>
    </Box>
    <Seg value={view} options={[{ v: 'open', label: `Open (${openCount(list, everyPage ? undefined : pg.id)})` }, { v: 'resolved', label: 'Resolved' }, { v: 'all', label: 'All' }]} onChange={v => setView(v)} />
    <Row items="center" gap="2"><Btn type="button" onClick={() => setEvery(!everyPage)} h="24px" px="2" fontSize="sm" cursor="pointer" {...T.tile} {...T.text}>{everyPage ? 'All pages' : `This page`}</Btn><Txt fontSize="sm" m="0" flex="1" {...T.muted}>{shown.length} thread{shown.length === 1 ? '' : 's'}</Txt></Row>
    {shown.length === 0
      ? <EmptyState icon="star" title={list.length ? 'Nothing here' : 'No comments yet'} hint="Select an object and write a note for yourself or a reviewer." />
      : shown.map(c => <Thread key={c.id} c={c} where={`${everyPage ? pageName(c.pageId) + ' · ' : ''}${c.nodeId ? nodeName(c.nodeId) : 'Page'}`} onGo={() => go(c)}
          onReply={t => save(addReply(list, c.id, uid(), who, t, Date.now()))} onResolve={() => save(setResolved(list, c.id, !c.resolved, Date.now()))}
          onDelete={async () => { if (await confirmDialog({ title: 'Delete this thread?', message: 'The comment and its replies will be removed.', confirmLabel: 'Delete' })) save(removeThread(list, c.id)); }} />)}
    <Row gap="2">
      <Btn type="button" onClick={merge} flex="1" h="30px" fontSize="sm" cursor="pointer" {...T.tile} {...T.text}>Merge comments from a file…</Btn>
      <Btn type="button" disabled={!list.length} onClick={() => download(new Blob([commentsToMarkdown(list, pageName, nodeName)], { type: 'text/markdown' }), `${p.name}-comments.md`)} h="30px" px="3" fontSize="sm" cursor="pointer" {...T.tile} {...T.text}>Export .md</Btn>
    </Row>
    <Txt fontSize="sm" leading="snug" m="0" {...T.muted}>Comments are saved in the project file. To get feedback, send the file (Download project file) and merge the reviewer's copy back here. Live co-editing needs a server and is not part of Studio.</Txt>
  </Box>;
}

function Thread({ c, where, onGo, onReply, onResolve, onDelete }: { c: Comment; where: string; onGo: () => void; onReply: (t: string) => void; onResolve: () => void; onDelete: () => void }) {
  const [reply, setReply] = useState('');
  return <Box display="flex" flex-col gap="2" p="3" opacity={c.resolved ? '70' : '100'} {...T.tile}>
    <Row items="center" gap="1"><Btn type="button" onClick={onGo} title="Go to this object" flex="1" min-w="0" p="0" border="0" bg="transparent" cursor="pointer" text-align="left"><Txt fontSize="sm" fontWeight="600" m="0" truncate text="primary">{where}</Txt></Btn>
      <IconBtn icon="check" title={c.resolved ? 'Reopen' : 'Resolve'} size={22} iconSize={13} active={!!c.resolved} onClick={onResolve} /><IconBtn icon="trash" title="Delete thread" size={22} iconSize={12} danger onClick={onDelete} /></Row>
    {[{ id: c.id, author: c.author, text: c.text, createdAt: c.createdAt }, ...c.replies].map(m => <Box key={m.id}><Txt fontSize="sm" m="0" {...T.muted}><b>{m.author}</b> · {ago(m.createdAt)}</Txt><Txt as="p" fontSize="sm" leading="snug" m="0" white-space="pre-wrap" {...T.text}>{m.text}</Txt></Box>)}
    {!c.resolved && <Row gap="1"><Box as="input" value={reply} placeholder="Reply…" aria-label="Reply" onChange={(e: any) => setReply(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter' && reply.trim()) { onReply(reply); setReply(''); } }} flex="1" min-w="0" h="28px" px="2" fontSize="sm" outline="none" {...T.field} text="gray-800" dark-text="gray-100" />
      <Btn type="button" disabled={!reply.trim()} onClick={() => { onReply(reply); setReply(''); }} h="28px" px="2" fontSize="sm" cursor="pointer" {...T.tile} {...T.text}>Reply</Btn></Row>}
  </Box>;
}
