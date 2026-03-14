import { Command } from 'commander';
import { saveConfig } from '../config/config';

export const loginCommand = new Command('login')
  .description('Save your API token locally')
  .requiredOption('--token <token>', 'Your EnvSync API token')
  .option('--api-url <url>', 'API base URL', 'http://localhost:3001')
  .action((opts) => {
    saveConfig({ token: opts.token, apiUrl: opts.apiUrl });
    console.log('Logged in successfully.');
  });
