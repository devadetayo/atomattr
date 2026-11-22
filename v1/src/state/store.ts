import { useSyncExternalStore } from 'react';
import type { Bp, Component, ComponentVariant, DesignToken, Guide, Node, Page, Project, Style, StyleKey, TextStyle } from '../document/types';
import { activePage, cloneDeep, find, findParent, flatten, insertInto, isContainer, pathTo, uid, updateNode, updateNodes, withPage, withRoot } from '../document/tree';
import { BP_WIDTH, patchStyle, RESP, resetOverride } from '../document/style';
import { alignNodes, deleteNodes, distributeNodes, duplicateNodes, groupNodes, moveNode, reorder, shapeToPath, suggestLayout, topLevel, ungroupNode, type AlignKind } from '../document/ops';
import { defaultTextStyles, defaultTokens, makePage, makeSection, newProject, type PresetId } from '../document/factory';
import { begin, commit, emptyHistory, end, redo as histRedo, undo as histUndo, type History } from './history';
import { clearLayout, loadLayout, loadProject, loadTheme, saveLayout, saveProject, saveTheme } from './storage';
import { clamp, defaultLayout, dockerDef, makeWin, type DockerId, type Layout, type Win } from './layout';
import type { Target } from '../exporters/codegen';
import { makeThumb } from '../document/thumb';
import { parseCode } from '../document/code-parser';

export type Tool = 'select' | 'direct' | 'text' | 'heading' | 'rect' | 'rounded' | 'ellipse' | 'polygon' | 'star' | 'line' | 'arrow' | 'pen' | 'pencil' | 'image' | 'crop' | 'section' | 'container' | 'grid' | 'component' | 'button' | 'eyedropper' | 'hand' | 'zoom';
export type Modal = null | 'new' | 'shortcuts' | 'about' | 'rename' | 'export' | 'page';
export type View = { zoom: number; px: number; py: number };
export type Viewport = { name: string; width: number; height: number };
export type Toast = { id: number; text: string; kind: 'info' | 'error' } | null;
export type Fill = { target: 'fill' | 'stroke' };

export type State = {
  screen: 'welcome' | 'editor';
  project: Project | null; history: History; dirty: boolean; savedAt: number | null;
  sel: string[]; enter: string | null; bp: Bp; viewport: Viewport; preview: boolean;
  compare: boolean; compareDark: boolean;
  tool: Tool; view: View; stage: { w: number; h: number }; pageH: number;
  theme: 'light' | 'dark'; layout: Layout;
  modal: Modal; toast: Toast; pointPick: { id: string; index: number } | null;
  paint: Fill; recentColors: string[]; clip: Node[]; menu: string | null;
  edit: string | null; // node id whose text is being edited
  commandOpen: boolean;
  attrState: 'base'|'hover'|'focus'|'active'|'disabled'|'dark';
};

const initial = (): State => ({
  screen: 'welcome', project: null, history: emptyHistory(), dirty: false, savedAt: null,
  sel: [], enter: null, bp: 'desktop', viewport:{name:'Desktop',width:1440,height:900}, preview: false, compare: false, compareDark: false,
  tool: 'select', view: { zoom: 0.5, px: 40, py: 40 }, stage: { w: 1000, h: 700 }, pageH: 900,
  theme: loadTheme(), layout: loadLayout(defaultLayout()), modal: null, toast: null, pointPick: null,
  paint: { target: 'fill' }, recentColors: [], clip: [], menu: null, edit: null, commandOpen: false, attrState: 'base',
});
let state: State = initial();
const listeners = new Set<() => void>();
export const getState = () => state;
export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  listeners.forEach(l => l());
}
export const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useStudio = (): State => useSyncExternalStore(subscribe, getState, getState);

/* ---------- derived helpers ---------- */
export const page = (s: State = state): Page => activePage(s.project!);
export const root = (s: State = state): Node => page(s).root;
export const selNodes = (s: State = state): Node[] => s.sel.map(id => find(root(s), id)).filter((n): n is Node => !!n);
export const bpWidth = (s: State = state) => s.viewport?.width || BP_WIDTH[s.bp];
/** Rendered artboard dimensions in the active device view; persisted Page dimensions stay unchanged. */
export const artboardSize = (s: State = state) => {
  const pg = s.project?.pages.find(p => p.id === s.project?.activePageId) || s.project?.pages[0];
  return { w: bpWidth(s), h: Math.max(200, Number(pg?.height || pg?.root.style.h) || s.viewport.height || 1200) };
};
const bpViewport=(bp:Bp):Viewport=>({name:bp[0].toUpperCase()+bp.slice(1),width:BP_WIDTH[bp],height:bp==='desktop'?900:bp==='tablet'?1024:844});
export function setViewport(viewport:Viewport,bp?:Bp){const nextBp=bp||(viewport.width>=1024?'desktop':viewport.width>=600?'tablet':'mobile');setState({viewport,bp:nextBp,sel:[],edit:null,enter:null});setTimeout(()=>fit('page'),20);}

/* ---------- toast ---------- */
let toastId = 0; let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(text: string, kind: 'info' | 'error' = 'info') {
  const id = ++toastId; setState({ toast: { id, text, kind } });
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { if (state.toast?.id === id) setState({ toast: null }); }, 3200);
}

/* ---------- project lifecycle ---------- */
let saveTimer: ReturnType<typeof setTimeout> | undefined;
function syncConfig(project: Project | null) { RESP.auto = project?.settings?.autoStack !== false; }
export function openProject(input: Project) {
  // Migrate projects saved before pages had explicit artboard dimensions.
  const pages = input.pages.map(p => {
    const width = Math.max(1, Number(p.width || p.root.style.w) || 1440);
    const sectionsHeight = (p.root.children || []).reduce((sum, child) => sum + (typeof child.style.h === 'number' ? child.style.h : 0), 0);
    const height = Math.max(1200, Number(p.height || p.root.style.h) || 0, sectionsHeight);
    return { ...p, width, height, root: { ...p.root, style: { ...p.root.style, w: width, h: height } } };
  });
  const project: Project = { ...input, pages, tokens: input.tokens || defaultTokens(), textStyles: input.textStyles || defaultTextStyles(), fontStacks: input.fontStacks || { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' } };
  syncConfig(project);
  setState({ screen: 'editor', project, history: emptyHistory(), dirty: false, savedAt: Date.now(), sel: [], enter: null, bp: 'desktop', viewport:{name:'Desktop',width:1440,height:900}, preview: false, tool: 'select', modal: null, menu: null, edit: null, commandOpen:false });
  setTimeout(() => fit('page'), 30);
}
export function createProject(name: string, kind: 'website' | 'page', preset: PresetId, settings = { tablet: true, mobile: true, autoStack: true }) {
  const p = newProject(name, kind, preset, settings); openProject(p); saveNow(); return p;
}
export function openSaved(id: string) {
  const p = loadProject(id); if (!p) { toast('That project could not be read. It may have been removed.', 'error'); return false; }
  openProject(p); return true;
}
export function goWelcome() { saveNow(); setState({ screen: 'welcome', project: null, sel: [], menu: null, modal: null, commandOpen:false }); }
export function saveNow() {
  const s = state; if (!s.project) return false;
  const ok = saveProject(s.project, makeThumb(s.project));
  if (ok) setState({ dirty: false, savedAt: Date.now() }); else toast('Could not save: browser storage is full or unavailable. Use File → Download project.', 'error');
  return ok;
}
function scheduleSave() { if (saveTimer) clearTimeout(saveTimer); saveTimer = setTimeout(() => { if (state.project && state.dirty) saveNow(); }, 800); }

/* ---------- document mutation (with history) ---------- */
export function setProject(next: Project, opts: { history?: boolean } = {}) {
  const s = state; if (!s.project) return;
  if (next === s.project) return;
  // Keep the finite page boundary ahead of direct flow sections. The artboard
  // grows as content is added, while its dimensions remain project data.
  next = { ...next, pages: next.pages.map(p => {
    const width = Math.max(1, Number(p.width || p.root.style.w) || 1440);
    const flowHeight = (p.root.children || []).reduce((sum, child) => sum + (typeof child.style.h === 'number' ? child.style.h : 0), 0);
    const height = Math.max(1200, Number(p.height || p.root.style.h) || 0, flowHeight);
    return { ...p, width, height, root: { ...p.root, style: { ...p.root.style, w: width, h: height } } };
  }) };
  syncConfig(next);
  const h = opts.history === false ? s.history : commit(s.history, s.project);
  setState({ project: next, history: h, dirty: true });
  scheduleSave();
}
export function mutate(fn: (r: Node) => Node, opts: { history?: boolean } = {}) {
  const s = state; if (!s.project) return;
  const p = page(s); setProject(withRoot(s.project, p.id, fn), opts);
}
export function tx<T>(fn: () => T): T { begin0(); try { return fn(); } finally { end0(); } }
export function begin0() { const s = state; if (!s.project) return; setState({ history: begin(s.history, s.project) }); }
export function end0() { setState({ history: end(state.history) }); }
export function undo() {
  const s = state; if (!s.project) return;
  const r = histUndo(s.history, s.project); if (!r) return;
  syncConfig(r.project);
  setState({ project: r.project, history: r.h, dirty: true, sel: s.sel.filter(id => !!find(activePage(r.project).root, id)), edit: null }); scheduleSave();
}
export function redo() {
  const s = state; if (!s.project) return;
  const r = histRedo(s.history, s.project); if (!r) return;
  syncConfig(r.project);
  setState({ project: r.project, history: r.h, dirty: true, sel: s.sel.filter(id => !!find(activePage(r.project).root, id)), edit: null }); scheduleSave();
}
export const canUndo = (s: State = state) => s.history.past.length > 0;
export const canRedo = (s: State = state) => s.history.future.length > 0;

export function renameProject(name: string) { const s = state; if (s.project) setProject({ ...s.project, name: name.trim() || 'Untitled' }); }
export function setSettings(patch: Partial<NonNullable<Project['settings']>>) {
  const s = state; if (!s.project) return;
  const settings = { tablet: true, mobile: true, autoStack: true, ...s.project.settings, ...patch };
  setProject({ ...s.project, settings });
  if (!settings[s.bp as 'tablet' | 'mobile'] && s.bp !== 'desktop') setBp('desktop');
}

/* ---------- selection ---------- */
export function select(ids: string[], additive = false) {
  const s = state; const next = additive ? Array.from(new Set([...s.sel, ...ids])) : ids;
  setState({ sel: next, edit: null, pointPick: null });
}
export function toggleSelect(id: string) { const s = state; select(s.sel.includes(id) ? s.sel.filter(x => x !== id) : [...s.sel, id]); }
/** Select every unlocked sibling at the current level: the entered group, else the selection's parent, else the page's only section, else the page. */
export function selectAll() {
  const s = state; const r = root(s); let ctx: Node | null = s.enter ? find(r, s.enter) ?? null : null;
  if (!ctx && s.sel.length) ctx = findParent(r, s.sel[0])?.parent ?? null;
  if (!ctx) ctx = (r.children || []).length === 1 && (r.children![0].children || []).length ? r.children![0] : r;
  select((ctx.children || []).filter(c => !c.locked).map(c => c.id));
}
/** Add a new section below the given one (or at the end of the page) and select it. */
export function addSection(afterId?: string | null) {
  const s = state; if (!s.project) return; const r = root(s); const sec = makeSection(`Section ${(r.children?.length ?? 0) + 1}`, 480);
  const anchor = afterId ? (pathTo(r, afterId) || []).find(n => n.type === 'section') : null; const idx = anchor ? (r.children || []).findIndex(c => c.id === anchor.id) + 1 : (r.children?.length ?? 0);
  mutate(rr => insertInto(rr, r.id, sec, idx)); setState({ sel: [sec.id], tool: 'select' });
}
export function clearSelection() { setState({ sel: [], edit: null, pointPick: null }); }
/** Context path allowed to be transparent: groups from the page down to `enter`. */
export function allowedGroups(s: State = state): Set<string> {
  const out = new Set<string>(); if (!s.enter) return out;
  (pathTo(root(s), s.enter) || []).forEach(n => out.add(n.id)); return out;
}
/** Resolve a clicked node to what the user should be selecting: the outermost closed group, otherwise the deepest node. */
export function resolveHit(targetId: string, s: State = state): string | null {
  const path = pathTo(root(s), targetId); if (!path) return null;
  const allowed = allowedGroups(s); let pick: Node = path[path.length - 1];
  for (let i = 1; i < path.length; i += 1) { const n = path[i]; if (n.type === 'group' && !allowed.has(n.id)) { pick = n; break; } }
  return pick.id;
}
export function enterGroup(id: string | null) { setState({ enter: id }); }
export function exitGroup() {
  const s = state; if (!s.enter) return;
  const loc = findParent(root(s), s.enter); const above = loc ? pathTo(root(s), loc.parent.id)?.reverse().find(n => n.type === 'group') : null;
  setState({ enter: above ? above.id : null, sel: [s.enter] });
}

/* ---------- editing operations ---------- */
export function patchNodes(ids: string[], patch: Style, bp: Bp = state.bp) { mutate(r => updateNodes(r, new Set(ids), n => {let next=patchStyle(n,patch,bp);const keys=Object.keys(patch);if(keys.some(k=>['fontSize','fontWeight','lineHeight','letterSpacing','color','font'].includes(k))&&n.style.tstyle)next={...next,style:{...next.style,tstyle:undefined}};if(keys.includes('fill'))next={...next,style:{...next.style,fillToken:undefined}};if(keys.includes('stroke'))next={...next,style:{...next.style,strokeToken:undefined}};if(keys.includes('color'))next={...next,style:{...next.style,colorToken:undefined}};if(n.inst)next={...next,ov:{...n.ov,...(keys.some(k=>['fill','stroke','radius','shadow','fontSize','fontWeight','color','layout'].includes(k))?{style:true}:{})}};return next;})); }
export function patchNodeProps(ids: string[], patch: Partial<Node>) { mutate(r => updateNodes(r, new Set(ids), n => {let next={...n,...patch};if(n.inst){const ov={...n.ov};if('text'in patch)ov.text=true;if('src'in patch||'assetId'in patch||'alt'in patch)ov.image=true;if('href'in patch)ov.link=true;next={...next,ov};}return next;})); }
export function setCompare(compare:boolean) {setState({compare,preview:false,sel:compare?[]:state.sel});}
export function setAttrState(attrState:State['attrState']) {setState({attrState});}
export function patchStateStyle(ids:string[],patch:Style,stateKey:Exclude<State['attrState'],'base'>) {mutate(r=>updateNodes(r,new Set(ids),n=>({...n,states:{...n.states,[stateKey]:{...(n.states?.[stateKey]||{}),...patch}}})));}
export function setCustomAttrs(ids:string[],attrs:Record<string,string|boolean>) {mutate(r=>updateNodes(r,new Set(ids),n=>({...n,attrs})));}
export function applyCodeToCanvas(code:string) {
  const s=state;if(!s.project)return false;
  try{const nodes=parseCode(code);if(!nodes.length)throw new Error('No elements found');mutate(r=>({...r,children:nodes}));setState({sel:[],enter:null,edit:null});toast('Code applied to canvas');return true;}
  catch(e){toast(e instanceof Error?`Could not apply code: ${e.message}`:'Could not apply code','error');return false;}
}
export function resetKey(id: string, key?: StyleKey) { const bp = state.bp; mutate(r => updateNode(r, id, n => resetOverride(n, bp, key))); }
export function replaceNode(id: string, fn: (n: Node) => Node) { mutate(r => updateNode(r, id, fn)); }

/** Where a newly created node goes: inside the selected container, else the container under the given parent, else the first section. */
export function addNode(node: Node, parentId?: string | null): string {
  const s = state; const r = root(s);
  let parent = parentId ? find(r, parentId) : null;
  if (!parent) { const sel = selNodes(s)[0]; parent = sel && isContainer(sel) && sel.type !== 'group' ? sel : sel ? findParent(r, sel.id)?.parent ?? null : null; }
  if (!parent || !isContainer(parent)) parent = r.children?.[0] ?? r;
  const flow = (parent.style.layout === 'flex' || parent.style.layout === 'grid');
  const added = flow ? { ...node, style: { ...node.style, mode: 'flow' as const, w: node.type === 'shape' ? node.style.w : 'fill' as const } } : node;
  mutate(rr => insertInto(rr, parent!.id, added));
  setState({ sel: [added.id], tool: 'select' });
  return added.id;
}
export function deleteSelection() {
  const s = state; if (!s.sel.length) return;
  mutate(r => deleteNodes(r, s.sel)); setState({ sel: [], edit: null });
}
export function duplicateSelection() {
  const s = state; if (!s.sel.length) return;
  let made: string[] = []; mutate(r => { const o = duplicateNodes(r, s.sel); made = o.ids; return o.root; }); setState({ sel: made });
}
export function groupSelection() {
  const s = state; if (s.sel.length < 1) return;
  let gid: string | null = null; const before = root(s);
  mutate(r => { const o = groupNodes(r, s.sel); gid = o.groupId; return o.root; });
  if (gid) setState({ sel: [gid] }); else if (root() === before) toast('Only free-positioned objects can be grouped. Flow items inside a flex or grid container cannot.', 'error');
}
export function ungroupSelection() {
  const s = state; const ids: string[] = [];
  mutate(r => { let cur = r; topLevel(r, s.sel).forEach(id => { const n = find(cur, id); if (n?.type === 'group') { const o = ungroupNode(cur, id); cur = o.root; ids.push(...o.ids); } }); return cur; });
  if (ids.length) setState({ sel: ids, enter: null }); else toast('Select a group to ungroup.');
}
export function arrange(to: 'front' | 'back' | 'forward' | 'backward') { const s = state; s.sel.forEach(id => mutate(r => reorder(r, id, to))); }
export function toggleFlag(flag: 'locked' | 'hidden', ids = state.sel) {
  const nodes = ids.map(id => find(root(), id)).filter((n): n is Node => !!n); const on = !nodes.every(n => n[flag]);
  patchNodeProps(ids, { [flag]: on } as Partial<Node>); if (flag === 'locked' && on) setState({ sel: [] });
}
export function doAlign(kind: AlignKind, to: 'selection' | 'parent' | 'page' = 'selection') {
  const s = state; const nodes = selNodes(s); if (!nodes.length) return;
  let bounds: { x: number; y: number; w: number; h: number } | undefined; if (to !== 'selection' || nodes.length === 1) {
    const p = findParent(root(s), nodes[0].id)?.parent;
    const w = to === 'page' ? BP_WIDTH[s.bp] : typeof p?.style.w === 'number' ? p.style.w : BP_WIDTH[s.bp];
    const h = typeof p?.style.h === 'number' ? p.style.h : s.pageH; bounds = { x: 0, y: 0, w, h };
  }
  mutate(r => alignNodes(r, s.sel, kind, bounds));
}
export const doDistribute = (axis: 'x' | 'y') => mutate(r => distributeNodes(r, state.sel, axis));
export function convertToPath() {
  const s = state; const n = selNodes(s)[0]; const p = n && shapeToPath(n);
  if (!p) { toast('Only rectangles, ellipses, polygons and stars convert to editable paths.'); return; }
  replaceNode(n.id, () => p); setState({ tool: 'direct' });
}
export function rotateBy(deg: number) { const s = state; s.sel.forEach(id => { const n = find(root(s), id); if (n) patchNodes([id], { rotation: (((n.style.rotation || 0) + deg) % 360 + 360) % 360 }, 'desktop'); }); }
export function moveInto(id: string, parentId: string, index: number) { mutate(r => moveNode(r, id, parentId, index)); }
export function createComponentFromSelection(name?:string) {
  const s=state; if(!s.project||!s.sel.length)return null;if(s.sel.length>1){groupSelection();return createComponentFromSelection(name);}const id=uid();const source=selNodes(s)[0];const master=cloneDeep(source);master.from=undefined;master.inst=undefined;
  const component:Component={id,name:name||source.name,node:master,variants:[]};
  setProject({...s.project,components:[...s.project.components,component]});
  const ids=new Set(s.sel);mutate(r=>updateNodes(r,ids,n=>({...n,inst:id,from:source.id,ov:{text:false,image:false,link:false,style:false}})));
  return id;
}
export function updateComponent(id:string) {
  const s=state;if(!s.project)return;const c=s.project.components.find(x=>x.id===id);if(!c)return;
  const sync=(master:Node,old?:Node):Node=>{const next=cloneDeep(master);if(!old)return next;next.id=old.id;next.inst=old.inst;next.from=old.from;next.ov=old.ov;next.variant=old.variant;next.name=old.name;next.style={...master.style,x:old.style.x,y:old.style.y,w:old.style.w,h:old.style.h,mode:old.style.mode,...(old.ov?.style?old.style:{})};if(old.ov?.text)next.text=old.text;if(old.ov?.image){next.src=old.src;next.assetId=old.assetId;next.alt=old.alt;}if(old.ov?.link)next.href=old.href;const oldKids=old.children||[];next.children=(master.children||[]).map((child,i)=>sync(child,oldKids[i]));return next;};
  const refresh=(rootNode:Node):Node=>{const visit=(n:Node):Node=>n.inst===id?sync(c.node,n):{...n,...(n.children?{children:n.children.map(visit)}:{})};return visit(rootNode);};
  setProject({...s.project,pages:s.project.pages.map(p=>({...p,root:refresh(p.root)}))});
}
export function updateMasterFromInstance(nodeId:string) {const s=state;const n=find(root(s),nodeId);if(!s.project||!n?.inst)return;const c=s.project.components.find(x=>x.id===n.inst);if(!c)return;const master=cloneDeep(n);master.id=c.node.id;master.inst=undefined;master.from=undefined;master.ov=undefined;master.variant=undefined;setProject({...s.project,components:s.project.components.map(x=>x.id===c.id?{...x,node:master}:x)});updateComponent(c.id);}
export function insertComponent(id:string,parentId?:string,x?:number,y?:number,k=1) { const s=state;const c=s.project?.components.find(x=>x.id===id);if(!c)return;const n=cloneDeep(c.node);const rekey=(x:Node):Node=>({...x,id:uid(),inst:id,from:c.node.id,ov:{},...(x.children?{children:x.children.map(rekey)}:{})});if(x!==undefined)n.style.x=x;if(y!==undefined)n.style.y=y;if(typeof n.style.w==='number')n.style.w*=k;addNode(rekey(n),parentId); }
export function saveComponentVariant(id:string,name:string) { const s=state;const c=s.project?.components.find(x=>x.id===id);const n=selNodes(s)[0];if(!s.project||!c||!n)return;const v:ComponentVariant={id:uid(),name,style:{...n.style},text:n.text};setProject({...s.project,components:s.project.components.map(x=>x.id===id?{...x,variants:[...(x.variants||[]),v]}:x)}); }
export function applyComponentVariant(nodeId:string,variantId:string) { const s=state;const n=find(root(s),nodeId);const c=n?.inst?s.project?.components.find(x=>x.id===n.inst):undefined;const v=c?.variants?.find(x=>x.id===variantId);if(!n||!c||!v)return;replaceNode(nodeId,old=>({...old,variant:v.id,ov:{...old.ov,style:true,...(v.text!==undefined?{text:true}:{})},style:{...old.style,...v.style},...(v.text!==undefined?{text:v.text}:{})})); }
export function deleteComponent(id:string) {const s=state;if(!s.project)return;const detach=(n:Node):Node=>({...n,...(n.inst===id?{inst:undefined,from:undefined,variant:undefined,ov:undefined}:{}),...(n.children?{children:n.children.map(detach)}:{})});setProject({...s.project,components:s.project.components.filter(c=>c.id!==id),pages:s.project.pages.map(p=>({...p,root:detach(p.root)}))});}
export function applySuggestedLayout() {
  const s=state; if(s.bp!=='desktop'){toast('Suggest auto layout is available at Desktop size.');return;}
  const selected=selNodes(s).find(isContainer);
  if(!selected){toast('Select a container or section first.');return;}
  mutate(r=>updateNode(r,selected.id,n=>suggestLayout(n)));
  toast('Suggested auto layout applied.');
}

/* ---------- clipboard ---------- */
export function copySel(cut = false) {
  const s = state; const nodes = topLevel(root(s), s.sel).map(id => find(root(s), id)!).filter(Boolean);
  if (!nodes.length) return; setState({ clip: JSON.parse(JSON.stringify(nodes)) as Node[] });
  if (cut) deleteSelection(); else toast('Copied');
}
export function paste() {
  const s = state; if (!s.clip.length) return;
  const ids: string[] = []; const parent = (() => { const n = selNodes(s)[0]; return n ? (isContainer(n) && n.type !== 'group' ? n : findParent(root(s), n.id)?.parent) : root(s).children?.[0]; })() || root(s);
  mutate(r => { let cur = r; s.clip.forEach(n => { const c = cloneDeep(n); if (c.style.mode !== 'flow') { c.style.x = Number(c.style.x ?? 0) + 24; c.style.y = Number(c.style.y ?? 0) + 24; } ids.push(c.id); cur = insertInto(cur, parent.id, c); }); return cur; });
  setState({ sel: ids });
}

/* ---------- pages ---------- */
export function addPage(name?: string) {
  const s = state; if (!s.project) return;
  if (s.project.kind === 'page') { toast('This project is a single page. Create a website project to add more pages.', 'error'); return; }
  const n = s.project.pages.length + 1; const pg = makePage(name || `Page ${n}`);
  setProject({ ...s.project, pages: [...s.project.pages, pg], activePageId: pg.id }); setState({ sel: [], enter: null }); setTimeout(() => fit('page'), 20);
}
export function switchPage(id: string) { const s = state; if (!s.project || s.project.activePageId === id) return; setProject({ ...s.project, activePageId: id }, { history: false }); setState({ sel: [], enter: null, edit: null }); setTimeout(() => fit('page'), 20); }
export function duplicatePage(id: string) {
  const s = state; if (!s.project || s.project.kind === 'page') { toast('Single-page projects cannot have more pages.', 'error'); return; }
  const src = s.project.pages.find(p => p.id === id); if (!src) return;
  const copy: Page = { ...src, id: uid(), name: `${src.name} copy`, root: cloneDeep(src.root), guides: src.guides.map(g => ({ ...g })) };
  const i = s.project.pages.findIndex(p => p.id === id);
  const pages = [...s.project.pages]; pages.splice(i + 1, 0, copy); setProject({ ...s.project, pages, activePageId: copy.id }); setState({ sel: [] });
}
export function renamePage(id: string, name: string) { const s = state; if (!s.project) return; setProject(withPage(s.project, id, p => ({ ...p, name: name.trim() || p.name, root: { ...p.root, name: name.trim() || p.name } }))); }
export function setPageSeo(id: string, seo: NonNullable<Page['seo']>) { const s = state; if (s.project) setProject(withPage(s.project, id, p => ({ ...p, seo }))); }
export function deletePage(id: string) {
  const s = state; if (!s.project) return;
  if (s.project.pages.length <= 1) { toast('A project needs at least one page.', 'error'); return; }
  const pages = s.project.pages.filter(p => p.id !== id); const active = s.project.activePageId === id ? pages[0].id : s.project.activePageId;
  setProject({ ...s.project, pages, activePageId: active }); setState({ sel: [] });
}
export function movePage(id: string, to: number) {
  const s = state; if (!s.project) return; const from = s.project.pages.findIndex(p => p.id === id); if (from < 0 || from === to) return;
  const pages = [...s.project.pages]; const [it] = pages.splice(from, 1); pages.splice(clamp(to, 0, pages.length), 0, it); setProject({ ...s.project, pages });
}
export function setGuides(guides: Guide[]) { const s = state; if (s.project) setProject(withPage(s.project, page(s).id, p => ({ ...p, guides })), { history: false }); }

/* ---------- breakpoints, tools, theme ---------- */
export function setBp(bp: Bp) { setState({ bp, viewport:bpViewport(bp), sel: [], edit: null, enter: null }); setTimeout(() => fit('page'), 20); }
export function setTool(tool: Tool) { setState({ tool, edit: null }); }
export function setTheme(theme: 'light' | 'dark') { saveTheme(theme); setState({ theme }); }
export const toggleTheme = () => setTheme(state.theme === 'dark' ? 'light' : 'dark');
export function setPreview(on: boolean) { setState({ preview: on, sel: on ? [] : state.sel, menu: null }); setTimeout(() => fit('page'), 20); }
export function pushRecentColor(c: string) { const s = state; setState({ recentColors: [c, ...s.recentColors.filter(x => x !== c)].slice(0, 12) }); }
export function addProjectColor(c: string) { const s = state; if (s.project && !s.project.colors.includes(c)) setProject({ ...s.project, colors: [...s.project.colors, c] }); }
export function removeProjectColor(c: string) { const s = state; if (s.project) setProject({ ...s.project, colors: s.project.colors.filter(x => x !== c) }); }
export function setPageTheme(theme: 'light'|'dark') { const s=state; if(s.project) setProject({...s.project,pageTheme:theme} as Project); }
export function setToken(token: DesignToken) {
  const s=state; if(!s.project) return; const tokens=s.project.tokens || defaultTokens();
  setProject({...s.project,tokens:tokens.some(t=>t.id===token.id)?tokens.map(t=>t.id===token.id?token:t):[...tokens,token]});
}
export function replaceTokenReferences(from: string, to: string) {
  const s=state;if(!s.project||from===to)return;
  const map=(n:Node):Node=>({...n,style:{...n.style,...(n.style.fillToken===from?{fillToken:to}:{}),...(n.style.strokeToken===from?{strokeToken:to}:{}),...(n.style.colorToken===from?{colorToken:to}:{})},...(n.children?{children:n.children.map(map)}:{})});
  setProject({...s.project,pages:s.project.pages.map(p=>({...p,root:map(p.root)})),components:s.project.components.map(c=>({...c,node:map(c.node)}))});
}
export function addToken() { const s=state; if(!s.project) return; const tokens=s.project.tokens || defaultTokens(); const id=uid(); setProject({...s.project,tokens:[...tokens,{id,name:`custom-${tokens.length+1}`,light:'#6366f1',dark:'#818cf8',role:'custom'}]}); }
export function deleteToken(id:string) {
  const s=state; if(!s.project) return; const token=(s.project.tokens||[]).find(t=>t.id===id); if(!token) return;
  const value=(s.project.pageTheme==='dark'?(token.dark||token.light):token.light);
  const walk=(n:Node):Node=>({...n,style:{...n.style,...(n.style.fillToken===id?{fill:value,fillToken:undefined}:{}),...(n.style.strokeToken===id?{stroke:value,strokeToken:undefined}:{}),...(n.style.colorToken===id?{color:value,colorToken:undefined}:{})},...(n.children?{children:n.children.map(walk)}:{})});
  setProject({...s.project,tokens:(s.project.tokens||[]).filter(t=>t.id!==id),pages:s.project.pages.map(p=>({...p,root:walk(p.root)}))});
}
export function setTextStyle(style:TextStyle) { const s=state;if(!s.project)return;const all=s.project.textStyles||defaultTextStyles();const nextStyles=all.some(x=>x.id===style.id)?all.map(x=>x.id===style.id?style:x):[...all,style];
  const update=(n:Node):Node=>({ ...n, ...(n.style.tstyle===style.id?{style:{...n.style,fontSize:style.fontSize,fontWeight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,color:style.color,font:style.font}}:{}), ...(n.children?{children:n.children.map(update)}:{}) });
  setProject({...s.project,textStyles:nextStyles,pages:s.project.pages.map(p=>({...p,root:update(p.root)}))});
}
export function applyTextStyle(ids:string[],style:TextStyle) { const set=new Set(ids);mutate(r=>updateNodes(r,set,n=>({...n,style:{...n.style,fontSize:style.fontSize,fontWeight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,color:style.color,font:style.font,tstyle:style.id}}))); }
export function unlinkTextStyle(ids:string[]) { ids.forEach(id=>replaceNode(id,n=>({...n,style:{...n.style,tstyle:undefined}}))); }

/* ---------- style clipboard and named snapshots ---------- */
let styleClipboard: Style | null = null;
const PAINT_KEYS: (keyof Style)[] = ['fill','stroke','strokeWidth','radius','shadow','opacity','color','fontSize','fontWeight','align','lineHeight','letterSpacing','font','fillToken','strokeToken','colorToken'];
export function copyStyle() {
  const node=selNodes()[0];if(!node){toast('Select an object to copy its style.');return;}
  const effective=state.bp==='desktop'?node.style:{...node.style,...node.bp?.tablet,...(state.bp==='mobile'?node.bp?.mobile:{})};
  styleClipboard=Object.fromEntries(PAINT_KEYS.filter(k=>effective[k]!==undefined).map(k=>[k,effective[k]]));toast('Style copied');
}
export function pasteStyle() {
  if(!styleClipboard){toast('Copy a style first.');return;}
  if(!state.sel.length){toast('Select objects to apply the style.');return;}
  patchNodes(state.sel,styleClipboard,state.bp);toast('Style applied');
}
export function createSnapshot(name: string) {
  const s=state;if(!s.project)return;
  const data=JSON.stringify({...s.project,snapshots:undefined});
  setProject({...s.project,snapshots:[...(s.project.snapshots||[]),{id:uid(),name:name.trim()||`Snapshot ${new Date().toLocaleString()}`,createdAt:Date.now(),data}]});
}
export function restoreSnapshot(id: string) {
  const s=state;const snap=s.project?.snapshots?.find(x=>x.id===id);if(!s.project||!snap)return;
  try{const restored=JSON.parse(snap.data) as Project;setProject({...restored,snapshots:s.project.snapshots});setState({sel:[],enter:null,edit:null});toast(`Restored “${snap.name}”`);}catch{toast('Could not restore this snapshot.','error');}
}
export function deleteSnapshot(id: string) {const s=state;if(s.project)setProject({...s.project,snapshots:(s.project.snapshots||[]).filter(x=>x.id!==id)});}

/* ---------- view / zoom ---------- */
export const ZOOM_MIN = 0.1; export const ZOOM_MAX = 8;
export function setView(v: View) {
  const st = state; const z = clamp(v.zoom, ZOOM_MIN, ZOOM_MAX); const size = artboardSize(st); const pw = size.w * z; const ph = size.h * z; const keep = 80;
  // Never let the page frame leave the stage completely: at least `keep` px stay visible.
  const px = clamp(v.px, keep - pw, Math.max(keep - pw, st.stage.w - keep)); const py = clamp(v.py, keep - ph, Math.max(keep - ph, st.stage.h - keep));
  setState({ view: { zoom: z, px, py } });
}
/** Zoom keeping the world point under (cx, cy) in stage pixels fixed. */
export function zoomAt(zoom: number, cx: number, cy: number) {
  const { view } = state; const z = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  const wx = (cx - view.px) / view.zoom; const wy = (cy - view.py) / view.zoom;
  // Keep the exact document point under the pointer fixed while zooming. Pan
  // still uses setView's visibility guard, but that guard must not skew zoom.
  setState({ view: { zoom: z, px: cx - wx * z, py: cy - wy * z } });
}
export function zoomStep(dir: 1 | -1) { const s = state; const stops = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.5, 2, 3, 4, 6, 8]; const cur = s.view.zoom; const next = dir > 0 ? stops.find(z => z > cur + 0.001) ?? ZOOM_MAX : [...stops].reverse().find(z => z < cur - 0.001) ?? ZOOM_MIN; zoomAt(next, s.stage.w / 2, s.stage.h / 2); }
export function zoomTo(zoom: number) { const s = state; zoomAt(zoom, s.stage.w / 2, s.stage.h / 2); }
/** The usable area: stage size (already excludes pinned dockers and the code panel). */
export function fit(mode: 'page' | 'width' | 'selection' | 'actual') {
  const s = state; if (!s.project) return;
  const { w: pw, h: ph } = artboardSize(s); const m = s.layout.rulers ? 48 : 32;
  // Floating dockers sit over the stage edges; fit the page into what they leave free so it is not hidden behind them.
  const edge = (ax: 'l' | 'r') => s.layout.wins.filter(w => !w.dock && w.ax === ax && !s.preview).reduce((mx, w) => Math.max(mx, w.x + Math.min(w.w, s.stage.w * 0.5) + 12), 0);
  const lOff = Math.min(edge('l'), s.stage.w * 0.4); const rOff = Math.min(edge('r'), s.stage.w * 0.4); const freeW = s.stage.w - lOff - rOff; const cx = lOff + freeW / 2;
  const vw = Math.max(100, freeW - m * 2); const vh = Math.max(100, s.stage.h - m - 150); /* bottom room for the add-section bar and colour palette */
  if (mode === 'actual') { setView({ zoom: 1, px: cx - pw / 2, py: m }); return; }
  if (mode === 'width') { const z = clamp(vw / pw, ZOOM_MIN, ZOOM_MAX); setView({ zoom: z, px: cx - (pw * z) / 2, py: m }); return; }
  const z = clamp(Math.min(vw / pw, vh / ph), ZOOM_MIN, ZOOM_MAX);
  setView({ zoom: z, px: cx - (pw * z) / 2, py: m });
}
export function setStage(w: number, h: number) { const s = state; if (Math.abs(s.stage.w - w) < 1 && Math.abs(s.stage.h - h) < 1) return; setState({ stage: { w, h } }); }
export function setPageH(h: number) { if (Math.abs(state.pageH - h) >= 1) setState({ pageH: h }); }

/* ---------- dockers ---------- */
function persist() { saveLayout(state.layout); }
function setLayout(fn: (l: Layout) => Layout) { setState({ layout: fn(state.layout) }); persist(); }
export const winOf = (id: DockerId, l: Layout = state.layout) => l.wins.find(w => w.tabs.includes(id));
export function toggleDocker(id: DockerId) { winOf(id) ? closeDocker(id) : openDocker(id); }
export function openDocker(id: DockerId) {
  setLayout(l => {
    const ex = l.wins.find(w => w.tabs.includes(id));
    const z = l.zTop + 1;
    if (ex) return { ...l, zTop: z, wins: l.wins.map(w => (w === ex ? { ...w, active: id, z, collapsed: false } : w)) };
    const n = l.wins.length; const d = dockerDef(id);
    return { ...l, zTop: z, wins: [...l.wins, makeWin(id, { ax: 'r', x: 24 + (n % 6) * 26, y: 24 + (n % 6) * 30, w: d.w, h: d.h, z })] };
  });
}
export function closeDocker(id: DockerId) {
  setLayout(l => ({ ...l, wins: l.wins.flatMap(w => { if (!w.tabs.includes(id)) return [w]; const tabs = w.tabs.filter(t => t !== id); return tabs.length ? [{ ...w, tabs, active: w.active === id ? tabs[0] : w.active }] : []; }) }));
}
export function closeWin(winId: string) { setLayout(l => ({ ...l, wins: l.wins.filter(w => w.id !== winId) })); }
export function focusWin(winId: string) { setLayout(l => { const top = l.wins.reduce((m, w) => Math.max(m, w.z), 0); const w = l.wins.find(x => x.id === winId); if (!w || w.z === top) return l; return { ...l, zTop: top + 1, wins: l.wins.map(x => (x.id === winId ? { ...x, z: top + 1 } : x)) }; }); }
export function patchWin(winId: string, patch: Partial<Win>) { setLayout(l => ({ ...l, wins: l.wins.map(w => (w.id === winId ? { ...w, ...patch } : w)) })); }
export function setActiveTab(winId: string, id: DockerId) { patchWin(winId, { active: id }); }
/** Pin = dock to the nearest side and reserve canvas space. Unpin = float again where it was. */
export function togglePin(winId: string, areaW: number) {
  setLayout(l => ({ ...l, wins: l.wins.map(w => {
    if (w.id !== winId) return w;
    if (w.dock) { const f = w.floatRect; return { ...w, dock: null, ...(f ? { ax: f.ax, x: f.x, y: f.y, w: f.w, h: f.h } : { x: 40, y: 60 }) }; }
    const left = (w.ax === 'l' ? w.x : areaW - w.x - w.w) + w.w / 2 < areaW / 2;
    return { ...w, dock: left ? 'left' : 'right', floatRect: { ax: w.ax, x: w.x, y: w.y, w: w.w, h: w.h }, collapsed: false };
  }) }));
}
export function setSide(side: 'left' | 'right', w: number) { setLayout(l => ({ ...l, side: { ...l.side, [side]: clamp(w, 220, 560) } })); }
/** Merge dock tab `id` from its window into target window (tab grouping) or split it into its own window. */
export function mergeTab(id: DockerId, targetWinId: string) {
  setLayout(l => {
    const from = l.wins.find(w => w.tabs.includes(id)); const target = l.wins.find(w => w.id === targetWinId); if (!from || !target || from === target) return l;
    const wins = l.wins.flatMap(w => { if (w === from) { const tabs = w.tabs.filter(t => t !== id); return tabs.length ? [{ ...w, tabs, active: tabs[0] }] : []; } if (w === target) return [{ ...w, tabs: [...w.tabs, id], active: id }]; return [w]; });
    return { ...l, wins };
  });
}
export function splitTab(id: DockerId, ax: 'l' | 'r', x: number, y: number) {
  setLayout(l => {
    const from = l.wins.find(w => w.tabs.includes(id)); if (!from || from.tabs.length < 2) return l;
    const d = dockerDef(id); const z = l.zTop + 1;
    const wins = l.wins.map(w => (w === from ? { ...w, tabs: w.tabs.filter(t => t !== id), active: w.tabs.filter(t => t !== id)[0] } : w));
    return { ...l, zTop: z, wins: [...wins, makeWin(id, { ax, x, y, w: d.w, h: d.h, z })] };
  });
}
export function resetWorkspace() { clearLayout(); setState({ layout: defaultLayout() }); toast('Workspace reset'); setTimeout(() => fit('page'), 30); }
export function setLayoutFlag(patch: Partial<Pick<Layout, 'rulers' | 'grid' | 'snap' | 'guides' | 'safeArea'>>) { setLayout(l => ({ ...l, ...patch })); setTimeout(() => fit('page'), 10); }
export function setToolsPos(x: number, y: number) { setLayout(l => ({ ...l, tools: { x, y } })); }
export function setPalette(patch: Partial<Layout['palette']>) { setLayout(l => ({ ...l, palette: { ...l.palette, ...patch } })); }
export function setBand(open: boolean) { setLayout(l => ({ ...l, band: { open } })); setTimeout(() => fit('page'), 10); }
export function setCode(patch: Partial<Layout['code']>) { setLayout(l => ({ ...l, code: { ...l.code, ...patch } })); }
export function toggleCode(target?: Target) { const s = state; setCode({ open: target ? true : !s.layout.code.open, ...(target ? { target } : {}) }); setTimeout(() => fit('page'), 20); }

/** Space reserved on each side by docked windows, used to compute the canvas bounds. */
export function reserved(l: Layout = state.layout) {
  return { left: l.wins.some(w => w.dock === 'left') ? l.side.left : 0, right: (l.wins.some(w => w.dock === 'right') ? l.side.right : 0) + (l.code.open&&l.code.pinned ? (l.code.collapsed?36:l.code.w) : 0) };
}
export type { Target };
export { dockerDef };
