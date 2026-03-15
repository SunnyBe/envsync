import fs from 'fs';
import os from 'os';
import path from 'path';

let tmpDir: string;

jest.mock('os', () => ({
  ...jest.requireActual<typeof os>('os'),
  homedir: () => tmpDir,
}));

let runLogin: (opts: { token: string; apiUrl: string }) => Promise<void>;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-login-'));
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ({ runLogin } = require('../login'));
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
  jest.restoreAllMocks();
});

describe('runLogin', () => {
  it('saves config to disk', async () => {
    await runLogin({ token: 'mytoken', apiUrl: 'http://localhost:3001' });
    const configFile = path.join(tmpDir, '.envsync', 'config.json');
    const saved = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    expect(saved).toEqual({ token: 'mytoken', apiUrl: 'http://localhost:3001' });
  });

  it('strips trailing slash from apiUrl', async () => {
    await runLogin({ token: 'tok', apiUrl: 'http://localhost:3001/' });
    const configFile = path.join(tmpDir, '.envsync', 'config.json');
    const saved = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    expect(saved.apiUrl).toBe('http://localhost:3001');
  });

  it('throws if token is empty', async () => {
    await expect(runLogin({ token: '  ', apiUrl: 'http://localhost:3001' })).rejects.toThrow(
      'Token cannot be empty'
    );
  });
});
