/**
 * Unit tests for the encryption service.
 * These are pure function tests — no database, no HTTP, no mocking needed.
 * We set ENV_SYNC_SECRET directly in the test environment.
 *
 * NOTE: The encryption service captures the key at module load time, so we use
 * jest.resetModules() + require() to ensure the env var is read after being set.
 */

// 64 hex chars = 32 bytes = valid AES-256 key
const TEST_SECRET = 'a'.repeat(64);

let encrypt: (plaintext: string) => string;
let decrypt: (encryptedPayload: string) => string;

beforeAll(() => {
  process.env.ENV_SYNC_SECRET = TEST_SECRET;
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('../encryption.service');
  encrypt = mod.encrypt;
  decrypt = mod.decrypt;
});

describe('encrypt', () => {
  it('returns a string in iv:ciphertext:authTag format', () => {
    const result = encrypt('hello');
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(32); // 16 bytes as hex = 32 chars
    expect(parts[2]).toHaveLength(32); // auth tag 16 bytes = 32 chars
  });

  it('produces different ciphertext each time (IV is random)', () => {
    const a = encrypt('same-value');
    const b = encrypt('same-value');
    expect(a).not.toBe(b);
  });

  it('produces non-empty ciphertext for non-empty input', () => {
    const result = encrypt('DATABASE_URL=postgres://localhost:5432/mydb');
    const [, ciphertext] = result.split(':');
    expect(ciphertext.length).toBeGreaterThan(0);
  });
});

describe('decrypt', () => {
  it('roundtrip: decrypt(encrypt(x)) === x', () => {
    const original = 'SECRET_KEY=my-super-secret';
    expect(decrypt(encrypt(original))).toBe(original);
  });

  it('handles empty string roundtrip', () => {
    expect(decrypt(encrypt(''))).toBe('');
  });

  it('handles long strings', () => {
    const long = 'A'.repeat(10_000);
    expect(decrypt(encrypt(long))).toBe(long);
  });

  it('handles special characters and unicode', () => {
    const special = 'postgres://user:p@$$w0rd!@host:5432/db?ssl=true&☃';
    expect(decrypt(encrypt(special))).toBe(special);
  });

  it('throws when the auth tag is tampered (integrity check)', () => {
    const encrypted = encrypt('sensitive-value');
    const parts = encrypted.split(':');
    // Flip the last char of the auth tag
    parts[2] = parts[2].slice(0, -1) + (parts[2].endsWith('a') ? 'b' : 'a');
    const tampered = parts.join(':');
    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws when the ciphertext is tampered', () => {
    const encrypted = encrypt('sensitive-value');
    const parts = encrypted.split(':');
    parts[1] = parts[1].slice(0, -1) + (parts[1].endsWith('a') ? 'b' : 'a');
    const tampered = parts.join(':');
    expect(() => decrypt(tampered)).toThrow();
  });
});
