/**
 * Unit tests for auth Zod validation schemas.
 * Pure function tests — no database, no HTTP.
 */
import { registerSchema } from '../auth.validation';

describe('registerSchema', () => {
  it('accepts a valid email', () => {
    const result = registerSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from email', () => {
    const result = registerSchema.safeParse({ email: '  user@example.com  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects a missing email', () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email format', () => {
    const result = registerSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects an email that is too long', () => {
    const result = registerSchema.safeParse({ email: 'a'.repeat(250) + '@example.com' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string', () => {
    const result = registerSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });
});
