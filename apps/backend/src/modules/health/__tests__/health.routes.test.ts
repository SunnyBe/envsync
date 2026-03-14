/**
 * Integration tests for health routes.
 * We use Supertest to make real HTTP requests against the Express app.
 * Prisma is mocked so no database is needed.
 */
import request from 'supertest';

// Mock Prisma before importing app — jest hoists jest.mock calls
jest.mock('../../../infrastructure/prisma/client', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}));

// Mock pino-http to suppress log output during tests
jest.mock('pino-http', () => () => (_req: any, _res: any, next: any) => next());

import app from '../../../app';
import prisma from '../../../infrastructure/prisma/client';

describe('GET /health/live', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /health/ready', () => {
  it('returns 200 when database is reachable', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([{ '?column?': 1 }]);
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  it('returns 503 when database is unreachable', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.database).toBe('unreachable');
  });
});

describe('GET /health/system', () => {
  const SECRET = 'test-health-secret';

  beforeAll(() => {
    process.env.HEALTH_SECRET = SECRET;
  });

  it('returns 401 without the token', async () => {
    const res = await request(app).get('/health/system');
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong token', async () => {
    const res = await request(app).get('/health/system').set('x-health-token', 'wrong');
    expect(res.status).toBe(401);
  });

  it('returns 200 with system info when token is correct', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([{ '?column?': 1 }]);
    const res = await request(app).get('/health/system').set('x-health-token', SECRET);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      database: 'connected',
      node: expect.stringMatching(/^v\d+/),
    });
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.memory.heapUsed).toBe('number');
  });
});
