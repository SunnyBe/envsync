import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import { runPull } from '../pull';

jest.mock('axios');
jest.mock('../../config/config', () => ({
  loadConfig: () => ({ token: 'test-token', apiUrl: 'http://localhost:3001' }),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsync-pull-'));
  mockedAxios.get = jest.fn().mockResolvedValue({
    data: { variables: { API_KEY: 'secret', PORT: '3000' } },
  });
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
  jest.restoreAllMocks();
});

describe('runPull', () => {
  it('calls the correct API endpoint', async () => {
    const outFile = path.join(tmpDir, '.env');
    await runPull({ project: 'proj-456', env: 'production', file: outFile });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:3001/projects/proj-456/env',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'X-EnvSync-Source': 'cli',
        }),
        params: { env: 'production' },
      }),
    );
  });

  it('writes the pulled variables to the output file', async () => {
    const outFile = path.join(tmpDir, '.env');
    await runPull({ project: 'proj-456', env: 'staging', file: outFile });
    const contents = fs.readFileSync(outFile, 'utf8');
    expect(contents).toContain('API_KEY=secret');
    expect(contents).toContain('PORT=3000');
  });

  it('rejects an invalid environment', async () => {
    await expect(
      runPull({ project: 'proj-456', env: 'dev', file: path.join(tmpDir, '.env') }),
    ).rejects.toThrow('Invalid environment');
  });
});
