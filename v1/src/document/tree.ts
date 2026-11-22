import type { Node, Page, Project } from './types';

export const uid = () => `${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

export const isContainerType = (type: Node['type']) => type === 'page' || type === 'section' || type === 'container' || type === 'form' || type === 'group';
export const isContainer = (node: Node) => isContainerType(node.type);

export function walk(node: Node, visit: (node: Node, parent: Node | null, index: number) => void, parent: Node | null = null, index = 0) {
  visit(node, parent, index);
  node.children?.forEach((child, i) => walk(child, visit, node, i));
}
export function flatten(root: Node): Node[] { const out: Node[] = []; walk(root, node => out.push(node)); return out; }
export function find(root: Node, id: string): Node | null {
  if (root.id === id) return root;
  for (const child of root.children || []) { const hit = find(child, id); if (hit) return hit; }
  return null;
}
export function findParent(root: Node, id: string): { parent: Node; index: number } | null {
  for (let i = 0; i < (root.children || []).length; i += 1) {
    const child = root.children![i];
    if (child.id === id) return { parent: root, index: i };
    const deeper = findParent(child, id);
    if (deeper) return deeper;
  }
  return null;
}
/** root … node, or null. */
export function pathTo(root: Node, id: string): Node[] | null {
  if (root.id === id) return [root];
  for (const child of root.children || []) { const sub = pathTo(child, id); if (sub) return [root, ...sub]; }
  return null;
}
export function isDescendant(root: Node, ancestorId: string, id: string) {
  const ancestor = find(root, ancestorId);
  return !!ancestor && !!find(ancestor, id) && ancestorId !== id;
}

/** Immutable update of one node. Untouched branches keep their identity, so React and history stay cheap. */
export function updateNode(root: Node, id: string, fn: (node: Node) => Node): Node {
  if (root.id === id) return fn(root);
  if (!root.children) return root;
  let changed = false;
  const children = root.children.map(child => { const next = updateNode(child, id, fn); if (next !== child) changed = true; return next; });
  return changed ? { ...root, children } : root;
}
export function updateNodes(root: Node, ids: Set<string>, fn: (node: Node) => Node): Node {
  const self = ids.has(root.id) ? fn(root) : root;
  if (!self.children) return self;
  let changed = self !== root;
  const children = self.children.map(child => { const next = updateNodes(child, ids, fn); if (next !== child) changed = true; return next; });
  return changed ? { ...self, children } : self;
}
export function removeIds(root: Node, ids: Set<string>): Node {
  if (!root.children) return root;
  const kept = root.children.filter(child => !ids.has(child.id)).map(child => removeIds(child, ids));
  return { ...root, children: kept };
}
export function insertInto(root: Node, parentId: string, node: Node, index?: number): Node {
  return updateNode(root, parentId, parent => {
    const children = [...(parent.children || [])];
    children.splice(index === undefined ? children.length : Math.max(0, Math.min(children.length, index)), 0, node);
    return { ...parent, children };
  });
}
export function cloneDeep(node: Node): Node {
  return { ...node, id: uid(), style: { ...node.style }, bp: node.bp ? { tablet: node.bp.tablet && { ...node.bp.tablet }, mobile: node.bp.mobile && { ...node.bp.mobile } } : undefined, pts: node.pts?.map(p => ({ ...p })), children: node.children?.map(cloneDeep) };
}

export const activePage = (project: Project): Page => project.pages.find(p => p.id === project.activePageId) || project.pages[0];
export function withPage(project: Project, pageId: string, fn: (page: Page) => Page): Project {
  return { ...project, updatedAt: Date.now(), pages: project.pages.map(p => (p.id === pageId ? fn(p) : p)) };
}
export function withRoot(project: Project, pageId: string, fn: (root: Node) => Node): Project {
  return withPage(project, pageId, page => { const root = fn(page.root); return root === page.root ? page : { ...page, root }; });
}
