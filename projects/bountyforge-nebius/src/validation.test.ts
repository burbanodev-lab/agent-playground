import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateRepository } from './validation.js';

test('returns false when package.json is missing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bountyforge-no-package-'));
  const result = await validateRepository(root);
  assert.equal(result.passed, false);
  assert.deepEqual(result.attempted, []);
});

test('runs repository test script and reports success', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bountyforge-validation-'));
  await writeFile(join(root, 'package.json'), JSON.stringify({
    scripts: {
      test: 'node -e "process.exit(0)"'
    }
  }));

  const result = await validateRepository(root);
  assert.deepEqual(result.attempted, ['test']);
  assert.equal(result.passed, true);
  assert.equal(result.results[0]?.exitCode, 0);
});
