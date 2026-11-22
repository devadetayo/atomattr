import * as S from './store';
import { deleteProject } from './storage';
import { saveProjectAsArchive } from './project-file';
import { choiceDialog, confirmDialog, inputDialog, textDialog } from './dialogs';

/**
 * The app's confirmations, each wired to the existing action it guards.
 * Call sites stay one-liners: `confirmDeletePage().then(ok => ok && S.deletePage(id))`.
 */
export const confirmDeleteProject = (name: string) => confirmDialog({
  title: 'Delete project?', icon: 'trash', tone: 'danger', confirmLabel: 'Delete project',
  message: `“${name || 'Untitled'}” will be removed from this browser. This can't be undone. Export a .ast file first if you may want it back.`,
});

export const confirmDeletePage = (name?: string) => confirmDialog({
  title: 'Delete this page?', icon: 'trash', tone: 'danger', confirmLabel: 'Delete page',
  message: `${name ? `“${name}”` : 'The page'} and everything on it will be removed. You can bring it back with Undo.`,
});

export const confirmResetWorkspace = () => confirmDialog({
  title: 'Reset workspace?', icon: 'reset', confirmLabel: 'Reset workspace',
  message: 'Panels, docks and the palette go back to their default places. Your project is not touched.',
});

export const confirmRestoreSnapshot = (name: string) => confirmDialog({
  title: 'Restore snapshot?', icon: 'refresh', confirmLabel: 'Restore',
  message: `The project returns to “${name}”. Your current version stays available with Undo.`,
});

export const promptSnapshotName = (value = '') => textDialog({
  title: 'Create version snapshot', icon: 'snapshot', label: 'Snapshot name', value, placeholder: 'Before the hero redesign', confirmLabel: 'Create snapshot',
  message: 'A named restore point you can return to from the Styles panel.',
});

/** Width and height for a custom viewport, in CSS pixels. Resolves to whole numbers, or null when cancelled. */
export async function promptCustomViewport(width: number, height: number) {
  const out = await inputDialog({
    title: 'Custom viewport', icon: 'mobile', confirmLabel: 'Apply size',
    message: 'The size of the screen the artboard is previewed at.',
    fields: [
      { key: 'width', label: 'Width', value: String(Math.round(width)), type: 'number', min: 240, suffix: 'px' },
      { key: 'height', label: 'Height', value: String(Math.round(height)), type: 'number', min: 240, suffix: 'px' },
    ],
    validate: v => (['width', 'height'] as const).every(k => Number.isFinite(Number(v[k])) && Number(v[k]) >= 240) ? null : 'Width and height must each be at least 240 px.',
  });
  return out ? { width: Math.round(Number(out.width)), height: Math.round(Number(out.height)) } : null;
}

/** Save, Discard, Cancel. Resolves to 'save' | 'discard' | 'cancel'. */
export const askUnsavedChanges = (name: string, why: string) => choiceDialog({
  title: 'Unsaved changes', icon: 'save',
  message: `${why} Save “${name || 'Untitled'}” as a .ast file first, or leave without it.`,
  actions: [{ id: 'cancel', label: 'Cancel', tone: 'quiet' }, { id: 'discard', label: 'Discard', tone: 'danger' }, { id: 'save', label: 'Save', tone: 'primary' }],
});

/**
 * Leave the editor for the welcome screen. Projects autosave, so this only asks when the browser could not keep the latest changes
 * (storage full or blocked): Save writes a .ast file, Discard leaves anyway, Cancel stays.
 */
export async function closeToWelcome() {
  const s = S.getState();
  if (s.screen === 'editor' && s.project) {
    S.saveNow();
    if (S.getState().saveStatus === 'error') {
      const pick = await askUnsavedChanges(s.project.name, "This browser couldn't keep your latest changes.");
      if (pick === 'cancel') return false;
      if (pick === 'save') {
        const ok = await saveProjectAsArchive(S.getState().project!, { lastSaved: Date.now(), lastSavedBy: 'user' });
        if (!ok) { S.toast('The file was not saved, so the project stays open.', 'error'); return false; }
        S.toast('Saved to .ast file');
      }
    }
  }
  S.goWelcome();
  return true;
}

/** Remove a saved project after confirming; true when it was deleted. */
export async function deleteProjectWithConfirm(id: string, name: string) {
  if (!(await confirmDeleteProject(name))) return false;
  deleteProject(id); return true;
}
