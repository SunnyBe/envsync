import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.envsync');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface Config {
  token: string;
  apiUrl: string;
}

export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_FILE)) {
    throw new Error('Not logged in. Run: envsync login --token <token>');
  }
  const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Config file is corrupted. Run: envsync login --token <token>');
  }
  if (!isValidConfig(parsed)) {
    throw new Error('Config file is missing required fields. Run: envsync login --token <token>');
  }
  return parsed;
}

export function saveConfig(config: Config): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

export function clearConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.rmSync(CONFIG_FILE);
  }
}

export function configExists(): boolean {
  return fs.existsSync(CONFIG_FILE);
}

function isValidConfig(value: unknown): value is Config {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Config).token === 'string' &&
    typeof (value as Config).apiUrl === 'string' &&
    (value as Config).token.length > 0 &&
    (value as Config).apiUrl.length > 0
  );
}
