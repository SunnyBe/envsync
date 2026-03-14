import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET = process.env.ENV_SYNC_SECRET!;

export function encrypt(text: string): string {
  const key = Buffer.from(SECRET, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), ciphertext.toString('hex'), authTag.toString('hex')].join(':');
}

export function decrypt(payload: string): string {
  const [ivHex, ciphertextHex, authTagHex] = payload.split(':');
  const key = Buffer.from(SECRET, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
