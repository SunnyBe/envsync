import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import { runPush } from '../push';

jest.mock('axios');
jest.mock('../../config/config', () => ({
  loadConfig: () => ({ token: 'test-token', apiUrl: 'http://localhost:3001' }),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

let tmpDir: string;
let envFile: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-push-'));
  envFile = path.join(tmpDir, '.env');
  fs.writeFileSync(envFile, 'DB_URL=postgres://localhost/test\nSECRET=abc123\n');
  mockedAxios.post = jest.fn().mockResolvedValue({ data: { ok: true } });
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
  jest.restoreAllMocks();
});

describe('runPush', () => {
  it('calls the correct API endpoint', async () => {
    await runPush({
      project: '550e8400-e29b-41d4-a716-446655440001',
      env: 'development',
      file: envFile,
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3001/projects/550e8400-e29b-41d4-a716-446655440001/env',
      { variables: { DB_URL: 'postgres://localhost/test', SECRET: 'abc123' } },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'X-EnvSync-Source': 'cli',
        }),
        params: { env: 'development' },
      }),
    );
  });

  it('sends the correct variables from the .env file', async () => {
    await runPush({
      project: '550e8400-e29b-41d4-a716-446655440001',
      env: 'staging',
      file: envFile,
    });
    const [, body] = (mockedAxios.post as jest.Mock).mock.calls[0];
    expect(body.variables).toHaveProperty('DB_URL');
    expect(body.variables).toHaveProperty('SECRET');
  });

  it('rejects an invalid environment', async () => {
    await expect(
      runPush({
        project: '550e8400-e29b-41d4-a716-446655440001',
        env: 'production-bad',
        file: envFile,
      }),
    ).rejects.toThrow('Invalid environment');
  });

  it('rejects a missing .env file', async () => {
    await expect(
      runPush({
        project: '550e8400-e29b-41d4-a716-446655440001',
        env: 'development',
        file: path.join(tmpDir, 'missing.env'),
      }),
    ).rejects.toThrow('File not found');
  });

  it('rejects an empty .env file', async () => {
    const emptyFile = path.join(tmpDir, 'empty.env');
    fs.writeFileSync(emptyFile, '');
    await expect(
      runPush({
        project: '550e8400-e29b-41d4-a716-446655440001',
        env: 'development',
        file: emptyFile,
      }),
    ).rejects.toThrow('No variables found');
  });
});
