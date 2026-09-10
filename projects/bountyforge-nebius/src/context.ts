import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DEFAULT_MAX_FILES = 40;
const DEFAULT_MAX_BYTES = 120_000;
const SKIP = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', 'coverage']);
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue', '.json', '.md', '.sql', '.py', '.go', '.rs', '.yml', '.yaml']);

function extension(path: string) {
  const index = path.lastIndexOf('.');
  return index >= 0 ? path.slice(index).toLowerCase() : '';
}

async function walk(root: string, dir: string, files: string[]): Promise<void> {
  if (files.length >= DEFAULT_MAX_FILES) return;
  for (const entry of await readdir(dir)) {
    if (files.length >= DEFAULT_MAX_FILES) return;
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) {
      await walk(root, full, files);
    } else if (TEXT_EXTENSIONS.has(extension(entry))) {
      files.push(full);
    }
  }
}

export async function collectRepositoryContext(root: string): Promise<string> {
  const files: string[] = [];
  await walk(root, root, files);

  let remaining = DEFAULT_MAX_BYTES;
  const chunks: string[] = [];
  for (const file of files) {
    if (remaining <= 0) break;
    const text = await readFile(file, 'utf8');
    const clipped = text.slice(0, remaining);
    remaining -= Buffer.byteLength(clipped, 'utf8');
    chunks.push(`\n--- FILE: ${relative(root, file)} ---\n${clipped}`);
  }

  return chunks.join('\n');
}
