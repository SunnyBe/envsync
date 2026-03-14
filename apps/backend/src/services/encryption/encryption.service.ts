import crypto from 'crypto';

// AES-256-GCM: authenticated encryption — provides confidentiality (the data is secret)
// AND integrity (if anyone tampers with the stored value, decryption fails loudly).
// The key is derived from ENV_SYNC_SECRET, which must be a 32-byte hex string (64 hex chars = 256 bits).
const ALGORITHM = 'aes-256-gcm';
const SECRET = process.env.ENV_SYNC_SECRET!;

/**
 * Encrypts a plaintext string and returns a storable payload.
 *
 * NOTE: `iv` (Initialization Vector) is NOT a salt.
 * - Salt: used in PASSWORD HASHING (bcrypt, argon2) to prevent rainbow table attacks.
 * - IV:   used in SYMMETRIC ENCRYPTION to ensure that encrypting the same plaintext
 *         twice with the same key produces different ciphertexts. Required for GCM mode.
 *
 * Stored format: `<iv_hex>:<ciphertext_hex>:<authTag_hex>`
 *   - iv (16 bytes):      random nonce, safe to store alongside ciphertext
 *   - ciphertext:         the encrypted data
 *   - authTag (16 bytes): GCM authentication tag — decryption fails if this doesn't match,
 *                         preventing silent data corruption or tampering
 */
export function encrypt(plaintext: string): string {
  const key = Buffer.from(SECRET, 'hex');
  // Generate a fresh random IV for every encryption — never reuse an IV with the same key
  const initializationVector = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, initializationVector);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  // GCM authentication tag: proves the ciphertext was not tampered with after encryption
  const authenticationTag = cipher.getAuthTag();

  return [
    initializationVector.toString('hex'),
    ciphertext.toString('hex'),
    authenticationTag.toString('hex'),
  ].join(':');
}

/**
 * Decrypts a payload produced by `encrypt`. Throws if the payload is tampered or malformed.
 */
export function decrypt(encryptedPayload: string): string {
  const [ivHex, ciphertextHex, authTagHex] = encryptedPayload.split(':');

  const key = Buffer.from(SECRET, 'hex');
  const initializationVector = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const authenticationTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, initializationVector);
  // setAuthTag must be called BEFORE any update/final calls
  decipher.setAuthTag(authenticationTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
