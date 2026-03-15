import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseEnvFile, writeEnvFile, quoteIfNeeded } from '../envParser';

// Use a real temp dir — no mocks, these are pure I/O functions
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

describe('parseEnvFile', () => {
  it('parses simple KEY=VALUE pairs', () => {
    const file = path.join(tmpDir, '.env');
    fs.writeFileSync(file, 'FOO=bar\nBAZ=qux\n');
    expect(parseEnvFile(file)).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comment lines', () => {
    const file = path.join(tmpDir, '.env');
    fs.writeFileSync(file, '# comment\nKEY=value\n');
    expect(parseEnvFile(file)).toEqual({ KEY: 'value' });
  });

  it('parses quoted values with spaces', () => {
    const file = path.join(tmpDir, '.env');
    fs.writeFileSync(file, 'GREETING="Hello World"\n');
    expect(parseEnvFile(file)).toEqual({ GREETING: 'Hello World' });
  });

  it('throws if file does not exist', () => {
    expect(() => parseEnvFile(path.join(tmpDir, 'missing.env'))).toThrow('File not found');
  });
});

describe('writeEnvFile', () => {
  it('writes KEY=VALUE pairs', () => {
    const file = path.join(tmpDir, '.env');
    writeEnvFile(file, { KEY: 'value', OTHER: 'thing' });
    const contents = fs.readFileSync(file, 'utf8');
    expect(contents).toContain('KEY=value');
    expect(contents).toContain('OTHER=thing');
  });

  it('round-trips through parseEnvFile', () => {
    const file = path.join(tmpDir, '.env');
    const original = { PLAIN: 'simple', WITH_SPACE: 'hello world', WITH_HASH: 'val#ue' };
    writeEnvFile(file, original);
    expect(parseEnvFile(file)).toEqual(original);
  });

  it('ends with a newline', () => {
    const file = path.join(tmpDir, '.env');
    writeEnvFile(file, { A: 'b' });
    expect(fs.readFileSync(file, 'utf8').endsWith('\n')).toBe(true);
  });
});

describe('quoteIfNeeded', () => {
  it('returns plain values unchanged', () => {
    expect(quoteIfNeeded('simple')).toBe('simple');
    expect(quoteIfNeeded('with_underscore')).toBe('with_underscore');
  });

  it('quotes values containing spaces', () => {
    expect(quoteIfNeeded('hello world')).toBe('"hello world"');
  });

  it('quotes values containing #', () => {
    expect(quoteIfNeeded('val#ue')).toBe('"val#ue"');
  });

  it('escapes double-quotes inside quoted values', () => {
    expect(quoteIfNeeded('say "hi"')).toBe('"say \\"hi\\""');
  });

  it('encodes newlines as \\n', () => {
    expect(quoteIfNeeded('line1\nline2')).toBe('"line1\\nline2"');
  });
});
