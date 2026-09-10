import { spawn } from 'node:child_process';

export type CommandResult = {
  command: string;
  args: string[];
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
};

const ALLOWED_COMMANDS = new Set(['npm', 'npx', 'node']);
const MAX_OUTPUT_BYTES = 64_000;

function clip(value: string): string {
  return Buffer.byteLength(value, 'utf8') <= MAX_OUTPUT_BYTES
    ? value
    : `${value.slice(0, MAX_OUTPUT_BYTES)}\n[output clipped]`;
}

/**
 * Runs a deliberately small allow-list of development commands without a shell.
 * This is not a container boundary; callers should point cwd at an isolated copy
 * of the repository. Network access and filesystem permissions remain those of
 * the host process.
 */
export async function runSandboxedCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs = 60_000,
): Promise<CommandResult> {
  if (!ALLOWED_COMMANDS.has(command)) {
    throw new Error(`Command not allowed: ${command}`);
  }

  const startedAt = Date.now();
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        CI: '1',
        NODE_ENV: 'test',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 1_000).unref();
    }, timeoutMs);

    child.on('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', exitCode => {
      clearTimeout(timer);
      resolve({
        command,
        args,
        exitCode,
        timedOut,
        stdout: clip(stdout),
        stderr: clip(stderr),
        durationMs: Date.now() - startedAt,
      });
    });
  });
}
