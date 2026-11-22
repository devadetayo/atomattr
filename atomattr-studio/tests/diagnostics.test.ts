import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BETA, buildReport, recordError, recentErrors, projectBackupJson } from '../src/state/diagnostics';

test('reports carry the build, the environment and recent errors, and no project content', () => {
  recordError(new Error('boom'));
  const r = buildReport('It froze when I dropped a file', true);
  assert.match(r, new RegExp(BETA.version.replace(/\./g, '\\.'))); assert.match(r, /It froze when I dropped a file/); assert.match(r, /Error: boom/);
  assert.doesNotMatch(buildReport('', false), /Recent errors/);
  assert.ok(recentErrors().length >= 1);
  assert.ok(projectBackupJson() === null || typeof projectBackupJson() === 'string');
});
