import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runSandboxedCommand, type CommandResult } from './sandbox.js';

export type ValidationSummary = {
  attempted: string[];
  results: CommandResult[];
  passed: boolean;
};

type PackageJson = {
  scripts?: Record<string, string>;
};

/**
 * Runs only repository-owned npm scripts from a small, fixed validation set.
 * Commands are executed without a shell through the sandbox allow-list.
 */
export async function validateRepository(root: string): Promise<ValidationSummary> {
  let packageJson: PackageJson;
  try {
    packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as PackageJson;
  } catch {
    return { attempted: [], results: [], passed: false };
  }

  const scripts = packageJson.scripts ?? {};
  const candidates = ['test', 'build', 'lint', 'typecheck'].filter(name => Boolean(scripts[name]));
  const results: CommandResult[] = [];

  for (const script of candidates) {
    results.push(await runSandboxedCommand('npm', ['run', script, '--if-present'], root));
  }

  return {
    attempted: candidates,
    results,
    passed: candidates.length > 0 && results.every(result => result.exitCode === 0 && !result.timedOut),
  };
}
