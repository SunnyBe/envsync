import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import { saveConfig } from '../config/config';
import { handleError } from '../utils/error';
import { DEFAULT_API_URL } from '../meta';

interface LoginOptions {
  token: string;
  apiUrl: string;
}

export async function runLogin(opts: LoginOptions): Promise<void> {
  if (!opts.token.trim()) {
    throw new Error('Token cannot be empty');
  }
  const url = opts.apiUrl.replace(/\/$/, '');

  // Verify the token is valid before saving it
  const { data } = await axios.get<{ email: string }>(`${url}/auth/me`, {
    headers: { Authorization: `Bearer ${opts.token.trim()}` },
  });

  saveConfig({ token: opts.token.trim(), apiUrl: url });
  console.log(chalk.green('✔ Logged in successfully.'));
  console.log(chalk.dim(`  Authenticated as: ${data.email}`));
  console.log(chalk.dim(`  API: ${url}`));
}

export const loginCommand = new Command('login')
  .description('Save your API token locally')
  .requiredOption('--token <token>', 'Your EnvSync API token')
  .option('--api-url <url>', 'API base URL', DEFAULT_API_URL)
  .action((opts: LoginOptions) => runLogin(opts).catch(handleError));
