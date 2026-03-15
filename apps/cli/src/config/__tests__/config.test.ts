import fs from 'fs';
import os from 'os';
import path from 'path';

// We patch the config paths before importing so each test gets an isolated dir
let tmpDir: string;

jest.mock('os', () => ({
  ...jest.requireActual<typeof os>('os'),
  homedir: () => tmpDir,
}));

// Import after mock is set up
let saveConfig: (c: { token: string; apiUrl: string }) => void;
let loadConfig: () => { token: string; apiUrl: string };
let clearConfig: () => void;
let configExists: () => boolean;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-cfg-'));
  // Reset module cache so homedir() mock is picked up freshly
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ({ saveConfig, loadConfig, clearConfig, configExists } = require('../config'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

describe('saveConfig / loadConfig', () => {
  it('round-trips a valid config', () => {
    saveConfig({ token: 'abc123', apiUrl: 'http://localhost:3001' });
    expect(loadConfig()).toEqual({ token: 'abc123', apiUrl: 'http://localhost:3001' });
  });

  it('creates the config directory if it does not exist', () => {
    saveConfig({ token: 'tok', apiUrl: 'http://api' });
    expect(fs.existsSync(path.join(tmpDir, '.envsync', 'config.json'))).toBe(true);
  });
});

describe('loadConfig', () => {
  it('throws if config file does not exist', () => {
    expect(() => loadConfig()).toThrow('Not logged in');
  });

  it('throws if config file is corrupted JSON', () => {
    const dir = path.join(tmpDir, '.envsync');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'config.json'), 'not-json');
    expect(() => loadConfig()).toThrow('corrupted');
  });

  it('throws if config is missing required fields', () => {
    const dir = path.join(tmpDir, '.envsync');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify({ token: '' }));
    expect(() => loadConfig()).toThrow('missing required fields');
  });
});

describe('clearConfig', () => {
  it('removes the config file', () => {
    saveConfig({ token: 'tok', apiUrl: 'http://api' });
    clearConfig();
    expect(configExists()).toBe(false);
  });

  it('is a no-op if config does not exist', () => {
    expect(() => clearConfig()).not.toThrow();
  });
});

describe('configExists', () => {
  it('returns false when not logged in', () => {
    expect(configExists()).toBe(false);
  });

  it('returns true after saveConfig', () => {
    saveConfig({ token: 'tok', apiUrl: 'http://api' });
    expect(configExists()).toBe(true);
  });
});
