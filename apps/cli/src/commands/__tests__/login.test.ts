import fs from 'fs';
import os from 'os';
import path from 'path';

let tmpDir: string;

jest.mock('os', () => ({
  ...jest.requireActual<typeof os>('os'),
  homedir: () => tmpDir,
}));

jest.mock('axios');

let runLogin: (opts: { token: string; apiUrl: string }) => Promise<void>;
let mockAxios: { get: jest.Mock };

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-login-'));
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ({ runLogin } = require('../login'));
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mockAxios = require('axios');
  mockAxios.get = jest.fn().mockResolvedValue({ data: { email: 'user@example.com' } });
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
  jest.restoreAllMocks();
});

describe('runLogin', () => {
  it('verifies token against /auth/me before saving', async () => {
    await runLogin({ token: 'mytoken', apiUrl: 'http://localhost:3001' });
    expect(mockAxios.get).toHaveBeenCalledWith(
      'http://localhost:3001/auth/me',
      { headers: { Authorization: 'Bearer mytoken' } }
    );
  });

  it('saves config to disk on valid token', async () => {
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

  it('does not save config if API rejects the token', async () => {
    const error = Object.assign(new Error('Request failed'), { response: { status: 401 } });
    mockAxios.get = jest.fn().mockRejectedValue(error);
    await expect(runLogin({ token: 'bad-token', apiUrl: 'http://localhost:3001' })).rejects.toThrow();
    const configFile = path.join(tmpDir, '.envsync', 'config.json');
    expect(fs.existsSync(configFile)).toBe(false);
  });
});
