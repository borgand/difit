import { realpathSync, statSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, isAbsolute, resolve, sep } from 'node:path';

const MAX_DESCRIPTION_BYTES = 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.md', '.markdown']);

function isInside(candidate: string, root: string): boolean {
  if (candidate === root) {
    return true;
  }
  return candidate.startsWith(root + sep);
}

export function loadDescription(inputPath: string): { content: string; resolvedPath: string } {
  if (typeof inputPath !== 'string' || inputPath.trim().length === 0) {
    throw new Error('--description requires a file path');
  }

  const extension = extname(inputPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error('--description must point to a .md or .markdown file');
  }

  const absoluteInput = isAbsolute(inputPath) ? inputPath : resolve(process.cwd(), inputPath);

  let resolvedPath: string;
  try {
    resolvedPath = realpathSync(absoluteInput);
  } catch {
    throw new Error(`Description file not found: ${inputPath}`);
  }

  const cwdReal = realpathSync(process.cwd());
  const tmpReal = realpathSync(tmpdir());
  if (!isInside(resolvedPath, cwdReal) && !isInside(resolvedPath, tmpReal)) {
    throw new Error(
      '--description path must resolve inside the current working directory or the system temp directory',
    );
  }

  const stats = statSync(resolvedPath);
  if (!stats.isFile()) {
    throw new Error('--description path must be a regular file');
  }

  if (stats.size > MAX_DESCRIPTION_BYTES) {
    throw new Error(
      `--description file exceeds ${MAX_DESCRIPTION_BYTES} bytes (got ${stats.size})`,
    );
  }

  const content = readFileSync(resolvedPath, 'utf8');
  return { content, resolvedPath };
}
