import assert from 'node:assert/strict';
import test from 'node:test';
import { runSandboxedCommand } from './sandbox.js';

test('rejects commands outside the development allow-list', async () => {
  await assert.rejects(
    runSandboxedCommand('sh', ['-c', 'echo unsafe'], process.cwd()),
    /Command not allowed/,
  );
});

test('executes node without a shell and captures output', async () => {
  const result = await runSandboxedCommand(
    'node',
    ['-e', 'console.log("bountyforge-ok")'],
    process.cwd(),
    5_000,
  );
  assert.equal(result.exitCode, 0);
  assert.equal(result.timedOut, false);
  assert.match(result.stdout, /bountyforge-ok/);
});
