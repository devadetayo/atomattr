/**
 * Review comments stored in the project.
 *
 * There is no server, so comments travel with the project file: send a reviewer the file, they comment, and you merge
 * their file's comments back in. Threads are matched by id, replies are unioned, and the newest resolve/reopen wins.
 */
import type { Comment } from './types';

export const newThread = (id: string, author: string, text: string, pageId: string, nodeId: string | undefined, now: number): Comment =>
  ({ id, author: author.trim() || 'Anonymous', text: text.trim(), pageId, ...(nodeId ? { nodeId } : {}), createdAt: now, updatedAt: now, replies: [] });
export const addReply = (list: Comment[], threadId: string, replyId: string, author: string, text: string, now: number): Comment[] =>
  list.map(c => (c.id === threadId && text.trim() ? { ...c, updatedAt: now, replies: [...c.replies, { id: replyId, author: author.trim() || 'Anonymous', text: text.trim(), createdAt: now }] } : c));
export const setResolved = (list: Comment[], id: string, resolved: boolean, now: number): Comment[] =>
  list.map(c => (c.id === id ? { ...c, resolved: resolved || undefined, updatedAt: now } : c));
export const removeThread = (list: Comment[], id: string): Comment[] => list.filter(c => c.id !== id);
/** Threads about objects that no longer exist stay, but are shown against their page. */
export const openCount = (list: Comment[], pageId?: string) => list.filter(c => !c.resolved && (!pageId || c.pageId === pageId)).length;
export const forNode = (list: Comment[], nodeId: string) => list.filter(c => c.nodeId === nodeId && !c.resolved).length;

/** Combines your comments with a reviewer's. Nothing is lost: unknown threads are added, replies are unioned. */
export function mergeComments(local: Comment[], incoming: Comment[]): { merged: Comment[]; added: number; updated: number } {
  const byId = new Map(local.map(c => [c.id, c])); let added = 0, updated = 0;
  for (const inc of incoming) {
    const mine = byId.get(inc.id);
    if (!mine) { byId.set(inc.id, { ...inc, replies: [...(inc.replies || [])] }); added++; continue; }
    const seen = new Set(mine.replies.map(r => r.id)); const extra = (inc.replies || []).filter(r => !seen.has(r.id));
    const newer = inc.updatedAt > mine.updatedAt;
    if (extra.length || (newer && inc.resolved !== mine.resolved)) {
      byId.set(inc.id, { ...mine, replies: [...mine.replies, ...extra].sort((a, b) => a.createdAt - b.createdAt), resolved: newer ? inc.resolved : mine.resolved, updatedAt: Math.max(mine.updatedAt, inc.updatedAt) }); updated++;
    }
  }
  return { merged: [...byId.values()].sort((a, b) => a.createdAt - b.createdAt), added, updated };
}
/** Only well-formed comments from a file are kept, and text is length-limited. */
export function parseComments(raw: unknown): Comment[] {
  const list = Array.isArray(raw) ? raw : (raw as any)?.comments; if (!Array.isArray(list)) return [];
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
  return list.filter(c => c && typeof c.id === 'string' && typeof c.text === 'string').map((c: any): Comment => ({
    id: s(c.id, 64), author: s(c.author, 60) || 'Anonymous', text: s(c.text, 4000), pageId: s(c.pageId, 64), ...(c.nodeId ? { nodeId: s(c.nodeId, 64) } : {}),
    createdAt: Number(c.createdAt) || 0, updatedAt: Number(c.updatedAt) || Number(c.createdAt) || 0, ...(c.resolved ? { resolved: true } : {}),
    replies: (Array.isArray(c.replies) ? c.replies : []).filter((r: any) => r && typeof r.id === 'string' && typeof r.text === 'string').map((r: any) => ({ id: s(r.id, 64), author: s(r.author, 60) || 'Anonymous', text: s(r.text, 4000), createdAt: Number(r.createdAt) || 0 })),
  }));
}
export function commentsToMarkdown(list: Comment[], pageName: (id: string) => string, nodeName: (id?: string) => string): string {
  return list.map(c => `### ${c.resolved ? '[resolved] ' : ''}${pageName(c.pageId)}${c.nodeId ? ` · ${nodeName(c.nodeId)}` : ''}\n**${c.author}** (${new Date(c.createdAt).toLocaleString()}): ${c.text}\n${c.replies.map(r => `- **${r.author}**: ${r.text}`).join('\n')}`).join('\n\n');
}
