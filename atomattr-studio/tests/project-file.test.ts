import test from 'node:test';
import assert from 'node:assert/strict';
import { createProjectPackage, readProjectPackage } from '../src/state/project-file';
import { saveProject } from '../src/state/storage';
import { attrsFor } from '../src/document/attrs';

const makeProject = () => ({
  version: 1 as const,
  id: 'project-1',
  name: 'Demo site',
  kind: 'website' as const,
  settings: { tablet: true, mobile: true, autoStack: true },
  pages: [
    {
      id: 'page-1',
      name: 'Home',
      width: 1440,
      height: 900,
      root: {
        id: 'root-1',
        type: 'page',
        name: 'Page',
        style: { w: 1440, h: 900 },
        children: [
          {
            id: 'section-1',
            type: 'section',
            name: 'Hero',
            style: { x: 0, y: 0, w: 1440, h: 420 },
            children: [
              {
                id: 'text-1',
                type: 'text',
                name: 'Intro',
                style: { x: 40, y: 40, w: 420, h: 48, color: '#111827' },
                text: 'Hello world',
              },
            ],
          },
        ],
      },
      guides: [],
    },
  ],
  activePageId: 'page-1',
  assets: [
    { id: 'asset-1', name: 'cover.svg', mime: 'image/svg+xml', dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+' },
  ],
  components: [],
  colors: ['#111827'],
  snapshots: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

test('creates an .ast package and reads it back with archive metadata', async () => {
  const project = makeProject();
  const blob = await createProjectPackage(project, { counter: 3, lastSaved: 1700000000000 });
  const result = await readProjectPackage(blob);

  assert.ok(result);
  assert.equal(result?.project.name, 'Demo site');
  assert.equal(result?.project.assets.length, 1);
  assert.equal(result?.project.pages[0].name, 'Home');
  assert.equal(result?.metadata.type, 'atomattr-project');
  assert.deepEqual(result?.history, { counter: 3, lastSaved: 1700000000000 });
});

test('rejects corrupted or incompatible project archives', async () => {
  const missing = await readProjectPackage(new Blob(['not a zip archive']));
  assert.equal(missing, null);

  const project = makeProject();
  const archive = await createProjectPackage({ ...project, version: 99 as any });
  const result = await readProjectPackage(archive);
  assert.equal(result, null);
});

test('includes min and max sizing controls with viewport units in the generated attributes', () => {
  const node = {
    id: 'card',
    type: 'section' as const,
    name: 'Card',
    style: {
      w: 320,
      h: 240,
      minW: '100vw',
      maxW: 600,
      minH: '50vh',
      maxH: '100dvh',
    },
    children: [],
  };

  const attrs = attrsFor(node, { parent: null, parentResolved: null, chain: [node], bp: 'desktop' });
  assert.equal(attrs['min-w'], '100vw');
  assert.equal(attrs['max-w'], '600px');
  assert.equal(attrs['min-h'], '50vh');
  assert.equal(attrs['max-h'], '100dvh');
});

test('recents no longer depend on localStorage quota: saved projects list, reload and delete', async () => {
  const { saveProject, listRecents, loadProject, deleteProject } = await import('../src/state/storage');
  const project = makeProject();
  const hugeThumb = `data:image/svg+xml;utf8,${'y'.repeat(450_000)}`;
  assert.equal(saveProject(project, hugeThumb), true);

  const [first] = listRecents();
  assert.equal(first.id, project.id);
  assert.equal(first.thumb, undefined); // oversized thumbnails are dropped, the project is still saved
  assert.equal(loadProject(project.id)?.name, 'Demo site');

  assert.equal(saveProject({ ...project, name: 'Renamed' }, 'data:image/svg+xml;utf8,small'), true);
  assert.equal(listRecents().filter(r => r.id === project.id).length, 1);
  assert.equal(listRecents()[0].name, 'Renamed');
  assert.equal(listRecents()[0].thumb, 'data:image/svg+xml;utf8,small');

  deleteProject(project.id);
  assert.equal(loadProject(project.id), null);
  assert.equal(listRecents().some(r => r.id === project.id), false);
});

test('.ast is its own container, not a zip, and detects damage', async () => {
  const project = makeProject();
  const blob = await createProjectPackage(project, { counter: 1 });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 8)], [0x89, 0x41, 0x53, 0x54, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.notDeepEqual([...bytes.slice(0, 2)], [0x50, 0x4b]); // not "PK"

  const flipped = bytes.slice(); flipped[flipped.length - 1] ^= 0xff;
  assert.equal(await readProjectPackage(new Blob([flipped])), null);
  assert.equal(await readProjectPackage(new Blob([bytes.slice(0, bytes.length - 10)])), null);
});

test('still opens the zip-based .ast files from earlier builds', async () => {
  const { default: JSZip } = await import('jszip');
  const project = makeProject();
  const zip = new JSZip();
  zip.file('metadata.json', JSON.stringify({ type: 'atomattr-project', version: 1, assets: [] }));
  zip.file('project.json', JSON.stringify(project));
  const result = await readProjectPackage(await zip.generateAsync({ type: 'blob' }));
  assert.equal(result?.project.name, 'Demo site');
});
