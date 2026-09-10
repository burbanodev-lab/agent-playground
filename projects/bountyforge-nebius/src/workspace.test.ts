import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createIsolatedWorkspace } from './workspace.js';

test('isolated workspace copies files without mutating source', async () => {
  const source = await mkdtemp(join(tmpdir(), 'bountyforge-source-'));
  await writeFile(join(source, 'example.txt'), 'original');

  const workspace = await createIsolatedWorkspace(source);
  try {
    await writeFile(join(workspace.repository, 'example.txt'), 'changed by agent');
    assert.equal(await readFile(join(source, 'example.txt'), 'utf8'), 'original');
    assert.equal(await readFile(join(workspace.repository, 'example.txt'), 'utf8'), 'changed by agent');
  } finally {
    const root = workspace.root;
    await workspace.cleanup();
    await assert.rejects(access(root));
    await rm(source, { recursive: true, force: true });
  }
});

test('cleanup is idempotent', async () => {
  const source = await mkdtemp(join(tmpdir(), 'bountyforge-source-'));
  const workspace = await createIsolatedWorkspace(source);
  await workspace.cleanup();
  await workspace.cleanup();
  await rm(source, { recursive: true, force: true });
});
