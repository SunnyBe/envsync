import dotenv from 'dotenv';
import fs from 'fs';

export function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const contents = fs.readFileSync(filePath, 'utf8');
  return dotenv.parse(contents);
}

/**
 * Serialise a variables map back to .env format.
 *
 * Values are double-quoted when they contain spaces, `#`, `"`, `\n`, or
 * leading/trailing whitespace — the same cases where unquoted values would
 * be misread by dotenv on the next parse.
 */
export function writeEnvFile(filePath: string, variables: Record<string, string>): void {
  const lines = Object.entries(variables).map(([k, v]) => `${k}=${quoteIfNeeded(v)}`);
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

export function quoteIfNeeded(value: string): string {
  const needsQuoting =
    /[\s#"'\\]/.test(value) || value !== value.trim() || value.includes('\n');
  if (!needsQuoting) return value;
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
  return `"${escaped}"`;
}
