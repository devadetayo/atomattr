import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogItems, catalogCategories } from '../catalog-data.js';
import { parseAttribute } from '../src/engine/parser.js';

const htmlAttributes = new Set(`id class href target rel type name value required disabled readonly autocomplete placeholder for role title alt src srcdoc loading tabindex aria-label aria-labelledby aria-current aria-pressed aria-hidden controls open max min step action method accept checked selected download autofocus multiple form popover popovertarget`.split(' '));

test('catalog publishes substantial component and section collections only', () => {
  assert.deepEqual(catalogCategories, ['Components', 'Sections', 'Templates']);
  assert.ok(catalogItems.length >= 25);
  assert.ok(catalogItems.filter(item => item.category === 'Components').length >= 15);
  assert.ok(catalogItems.filter(item => item.category === 'Sections').length >= 10);
  assert.equal(catalogItems.filter(item => item.category === 'Templates').length, 0);
  assert.equal(catalogItems.filter(item => item.category === 'Premium').length, 0);
});

test('published records have complete metadata and copyable source', () => {
  const ids = catalogItems.map(item => item.id);
  const slugs = catalogItems.map(item => item.slug);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(slugs).size, slugs.length);

  for (const item of catalogItems) {
    assert.ok(item.slug);
    assert.ok(['component', 'section'].includes(item.kind));
    assert.equal(item.publicationStatus, 'published');
    assert.equal(item.access, 'free');
    assert.ok(item.description.trim());
    assert.ok(item.tags.length > 0);
    assert.deepEqual(item.frameworks, ['HTML', 'React']);
    assert.deepEqual(item.sourceVariants, ['HTML', 'React']);
    assert.ok(item.preview.trim(), `${item.id} needs actual preview markup`);

    for (const [, name, value] of item.preview.matchAll(/([\w-]+)="([^"]*)"/g)) {
      if (htmlAttributes.has(name) || name.startsWith('aria-') || name.startsWith('data-')) continue;
      assert.ok(parseAttribute(name, value), `${item.id}: unsupported AtomAttr attribute ${name}`);
    }
  }
});
