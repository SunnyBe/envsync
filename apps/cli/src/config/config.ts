import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.envsync');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface Config {
  token: string;
  apiUrl: string;
}

export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_FILE)) {
    throw new Error('Not logged in. Run: envsync login --token <token>');
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

export function saveConfig(config: Config): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
