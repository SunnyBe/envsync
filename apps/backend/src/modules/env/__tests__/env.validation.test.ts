/**
 * Unit tests for env Zod validation schemas.
 */
import { pushEnvSchema, pullEnvSchema } from '../env.validation';

describe('pushEnvSchema', () => {
  const validBase = {
    env: 'development',
    variables: { KEY: 'value' },
  };

  it('accepts valid input', () => {
    expect(pushEnvSchema.safeParse(validBase).success).toBe(true);
  });

  it('accepts all supported environments', () => {
    for (const env of ['development', 'staging', 'production']) {
      expect(pushEnvSchema.safeParse({ ...validBase, env }).success).toBe(true);
    }
  });

  it('rejects unknown environment', () => {
    const result = pushEnvSchema.safeParse({ ...validBase, env: 'local' });
    expect(result.success).toBe(false);
  });

  it('rejects empty variables object', () => {
    const result = pushEnvSchema.safeParse({ ...validBase, variables: {} });
    expect(result.success).toBe(false);
  });

  it('rejects non-string variable values', () => {
    const result = pushEnvSchema.safeParse({ ...validBase, variables: { KEY: 123 } });
    expect(result.success).toBe(false);
  });

  it('rejects more than 100 variables', () => {
    const tooMany: Record<string, string> = {};
    for (let i = 0; i <= 100; i++) tooMany[`KEY_${i}`] = 'value';
    const result = pushEnvSchema.safeParse({ ...validBase, variables: tooMany });
    expect(result.success).toBe(false);
  });
});

describe('pullEnvSchema', () => {
  const validBase = {
    projectId: '550e8400-e29b-41d4-a716-446655440000',
    env: 'production',
  };

  it('accepts valid input', () => {
    expect(pullEnvSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects non-UUID projectId', () => {
    const result = pullEnvSchema.safeParse({ ...validBase, projectId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid env', () => {
    const result = pullEnvSchema.safeParse({ ...validBase, env: 'test' });
    expect(result.success).toBe(false);
  });
});
