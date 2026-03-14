import dotenv from 'dotenv';
import fs from 'fs';

export function parseEnvFile(filePath: string): Record<string, string> {
  const contents = fs.readFileSync(filePath, 'utf8');
  return dotenv.parse(contents);
}

export function writeEnvFile(filePath: string, variables: Record<string, string>): void {
  const lines = Object.entries(variables).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(filePath, lines.join('\n') + '\n');
}
