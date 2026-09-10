import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

export type IsolatedWorkspace = {
  root: string;
  repository: string;
  cleanup: () => Promise<void>;
};

/**
 * Copies a repository into a fresh temporary directory before agent execution.
 * This prevents generated patches and test commands from mutating the source
 * checkout. It is a filesystem isolation layer, not a security boundary.
 */
export async function createIsolatedWorkspace(sourceRepository: string): Promise<IsolatedWorkspace> {
  const source = resolve(sourceRepository);
  const root = await mkdtemp(join(tmpdir(), 'bountyforge-'));
  const repository = join(root, basename(source) || 'repository');

  try {
    await cp(source, repository, {
      recursive: true,
      filter: path => {
        const relative = path.slice(source.length).replaceAll('\\', '/');
        return !relative.includes('/.git/')
          && !relative.includes('/node_modules/')
          && !relative.includes('/dist/')
          && !relative.includes('/coverage/');
      },
    });
  } catch (error) {
    await rm(root, { recursive: true, force: true });
    throw error;
  }

  let cleaned = false;
  return {
    root,
    repository,
    cleanup: async () => {
      if (cleaned) return;
      cleaned = true;
      await rm(root, { recursive: true, force: true });
    },
  };
}
