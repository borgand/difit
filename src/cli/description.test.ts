import { mkdtempSync, mkdirSync, rmSync, writeFileSync, symlinkSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadDescription } from './description.js';

describe('loadDescription', () => {
  let originalCwd: string;
  let sandboxCwd: string;
  let tmpScratch: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    sandboxCwd = mkdtempSync(join(realpathSync(tmpdir()), 'difit-desc-cwd-'));
    tmpScratch = mkdtempSync(join(realpathSync(tmpdir()), 'difit-desc-tmp-'));
    process.chdir(sandboxCwd);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(sandboxCwd, { recursive: true, force: true });
    rmSync(tmpScratch, { recursive: true, force: true });
  });

  it('accepts a .md file inside cwd', () => {
    const file = join(sandboxCwd, 'desc.md');
    writeFileSync(file, '# hello');
    const result = loadDescription('desc.md');
    expect(result.content).toBe('# hello');
  });

  it('accepts a .markdown file inside cwd', () => {
    const file = join(sandboxCwd, 'desc.markdown');
    writeFileSync(file, '# hi');
    const result = loadDescription(file);
    expect(result.content).toBe('# hi');
  });

  it('accepts a file inside the system tmp directory', () => {
    const file = join(tmpScratch, 'desc.md');
    writeFileSync(file, 'tmp content');
    const result = loadDescription(file);
    expect(result.content).toBe('tmp content');
  });

  it('rejects a non-markdown extension', () => {
    const file = join(sandboxCwd, 'notes.txt');
    writeFileSync(file, 'nope');
    expect(() => loadDescription(file)).toThrow(/\.md or \.markdown/);
  });

  it('rejects a missing file', () => {
    expect(() => loadDescription(join(sandboxCwd, 'does-not-exist.md'))).toThrow(/not found/);
  });

  it('rejects a directory', () => {
    const dir = join(sandboxCwd, 'dir.md');
    mkdirSync(dir);
    expect(() => loadDescription(dir)).toThrow(/regular file/);
  });

  it('rejects a symlink that escapes cwd and tmpdir', () => {
    const trueCwd = realpathSync(sandboxCwd);
    const link = join(trueCwd, 'escape.md');
    symlinkSync('/etc/hosts', link);
    expect(() => loadDescription(link)).toThrow(/inside the current working directory/);
  });

  it('rejects empty path', () => {
    expect(() => loadDescription('')).toThrow(/requires a file path/);
  });

  it('rejects oversized file', () => {
    const file = join(sandboxCwd, 'big.md');
    const big = Buffer.alloc(1024 * 1024 + 1, 0x61);
    writeFileSync(file, big);
    expect(() => loadDescription(file)).toThrow(/exceeds/);
  });

  it('resolves relative path via process.cwd', () => {
    const nested = join(sandboxCwd, 'docs');
    mkdirSync(nested);
    writeFileSync(join(nested, 'desc.md'), '# nested');
    const result = loadDescription('docs/desc.md');
    expect(result.content).toBe('# nested');
    expect(result.resolvedPath).toBe(resolve(realpathSync(sandboxCwd), 'docs/desc.md'));
  });
});
