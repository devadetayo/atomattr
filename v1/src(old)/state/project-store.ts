import type { DesignObject, SiteElement, StudioPage, StudioProject } from '../types/project';
import { loadProject } from '../engine/serialization';

const HISTORY_LIMIT = 60;

export type ProjectState = {
  project: StudioProject;
  past: StudioProject[];
  future: StudioProject[];
};

export type ProjectAction =
  | { type: 'rename'; name: string }
  | { type: 'replace-project'; project: StudioProject }
  | { type: 'add-page'; page: StudioPage }
  | { type: 'rename-page'; id: string; name: string }
  | { type: 'delete-page'; id: string }
  | { type: 'set-page'; id: string }
  | { type: 'add'; pageId: string; element: SiteElement }
  | { type: 'update'; pageId: string; id: string; patch: Partial<SiteElement> }
  | { type: 'delete'; pageId: string; id: string }
  | { type: 'duplicate'; id: string; copyId: string }
  | { type: 'move'; pageId: string; id: string; direction: -1 | 1 }
  | { type: 'move-before'; pageId: string; id: string; targetId: string }
  | { type: 'add-object'; pageId: string; object: DesignObject }
  | { type: 'update-object'; pageId: string; id: string; patch: Partial<DesignObject> }
  | { type: 'delete-object'; pageId: string; id: string }
  | { type: 'duplicate-object'; pageId: string; id: string; copyId: string }
  | { type: 'move-object'; pageId: string; id: string; targetId: string }
  | { type: 'undo' }
  | { type: 'redo' };

export function createProjectState(): ProjectState {
  return { project: loadProject(), past: [], future: [] };
}

function commit(state: ProjectState, project: StudioProject): ProjectState {
  if (JSON.stringify(project) === JSON.stringify(state.project)) return state;
  return {
    project,
    past: [...state.past, state.project].slice(-HISTORY_LIMIT),
    future: [],
  };
}

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'replace-project':
      return { project: action.project, past: [], future: [] };
    case 'rename':
      return commit(state, { ...state.project, name: action.name });
    case 'add-page':
      return commit(state, { ...state.project, pages: [...state.project.pages, action.page], activePageId: action.page.id });
    case 'rename-page':
      return commit(state, { ...state.project, pages: state.project.pages.map(page => page.id === action.id ? { ...page, name: action.name } : page) });
    case 'delete-page': {
      if (state.project.pages.length <= 1) return state;
      const pages = state.project.pages.filter(page => page.id !== action.id);
      const activePageId = state.project.activePageId === action.id ? pages[0].id : state.project.activePageId;
      return commit(state, { ...state.project, pages, activePageId });
    }
    case 'set-page':
      if (!state.project.pages.some(page => page.id === action.id)) return state;
      return { ...state, project: { ...state.project, activePageId: action.id }, past: [], future: [] };
    case 'add':
      return commit(state, { ...state.project, pages: state.project.pages.map(page => page.id === action.pageId ? { ...page, elements: [...page.elements, action.element] } : page) });
    case 'update':
      return commit(state, {
        ...state.project,
        pages: state.project.pages.map(page => page.id === action.pageId ? { ...page, elements: page.elements.map(element => element.id === action.id ? { ...element, ...action.patch } : element) } : page),
      });
    case 'delete':
      return commit(state, { ...state.project, pages: state.project.pages.map(page => page.id === action.pageId ? { ...page, elements: page.elements.filter(element => element.id !== action.id) } : page) });
    case 'duplicate': {
      const page = state.project.pages.find(candidate => candidate.id === state.project.activePageId);
      const index = page?.elements.findIndex(element => element.id === action.id) ?? -1;
      if (index < 0) return state;
      const copy = { ...page!.elements[index], id: action.copyId, content: `${page!.elements[index].content} copy` };
      const elements = [...page!.elements];
      elements.splice(index + 1, 0, copy);
      return commit(state, { ...state.project, pages: state.project.pages.map(candidate => candidate.id === page!.id ? { ...candidate, elements } : candidate) });
    }
    case 'move': {
      const page = state.project.pages.find(candidate => candidate.id === action.pageId);
      if (!page) return state;
      const from = page.elements.findIndex(element => element.id === action.id);
      const to = from + action.direction;
      if (from < 0 || to < 0 || to >= page.elements.length) return state;
      const elements = [...page.elements];
      [elements[from], elements[to]] = [elements[to], elements[from]];
      return commit(state, { ...state.project, pages: state.project.pages.map(candidate => candidate.id === page.id ? { ...candidate, elements } : candidate) });
    }
    case 'move-before': {
      const page = state.project.pages.find(candidate => candidate.id === action.pageId);
      if (!page || action.id === action.targetId) return state;
      const from = page.elements.findIndex(element => element.id === action.id);
      const target = page.elements.findIndex(element => element.id === action.targetId);
      if (from < 0 || target < 0) return state;
      const elements = [...page.elements];
      const [moving] = elements.splice(from, 1);
      const targetAfterRemoval = elements.findIndex(element => element.id === action.targetId);
      elements.splice(targetAfterRemoval, 0, moving);
      return commit(state, { ...state.project, pages: state.project.pages.map(candidate => candidate.id === page.id ? { ...candidate, elements } : candidate) });
    }
    case 'add-object':
      return commit(state, { ...state.project, pages: state.project.pages.map(page => page.id === action.pageId ? { ...page, objects: [...(page.objects || []), action.object] } : page) });
    case 'update-object':
      return commit(state, { ...state.project, pages: state.project.pages.map(page => page.id === action.pageId ? { ...page, objects: (page.objects || []).map(object => object.id === action.id ? { ...object, ...action.patch } : object) } : page) });
    case 'delete-object':
      return commit(state, { ...state.project, pages: state.project.pages.map(page => page.id === action.pageId ? { ...page, objects: (page.objects || []).filter(object => object.id !== action.id) } : page) });
    case 'duplicate-object': {
      const page = state.project.pages.find(candidate => candidate.id === action.pageId);
      const source = page?.objects?.find(object => object.id === action.id);
      if (!page || !source) return state;
      const copy = { ...source, id: action.copyId, x: source.x + 20, y: source.y + 20 };
      const index = page.objects!.findIndex(object => object.id === source.id);
      const objects = [...page.objects!]; objects.splice(index + 1, 0, copy);
      return commit(state, { ...state.project, pages: state.project.pages.map(candidate => candidate.id === page.id ? { ...candidate, objects } : candidate) });
    }
    case 'move-object': {
      const page = state.project.pages.find(candidate => candidate.id === action.pageId);
      if (!page?.objects || action.id === action.targetId) return state;
      const from = page.objects.findIndex(object => object.id === action.id);
      const target = page.objects.findIndex(object => object.id === action.targetId);
      if (from < 0 || target < 0) return state;
      const objects = [...page.objects];
      const [moving] = objects.splice(from, 1);
      objects.splice(objects.findIndex(object => object.id === action.targetId), 0, moving);
      return commit(state, { ...state.project, pages: state.project.pages.map(candidate => candidate.id === page.id ? { ...candidate, objects } : candidate) });
    }
    case 'undo': {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return { project: previous, past: state.past.slice(0, -1), future: [state.project, ...state.future] };
    }
    case 'redo': {
      const next = state.future[0];
      if (!next) return state;
      return { project: next, past: [...state.past, state.project].slice(-HISTORY_LIMIT), future: state.future.slice(1) };
    }
  }
}
