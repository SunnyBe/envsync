import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, configExists } from '../config/config';
import { handleError } from '../utils/error';

export async function runWhoami(): Promise<void> {
  if (!configExists()) {
    console.log(chalk.yellow('Not logged in. Run: envsync login --token <token>'));
    process.exit(0);
  }
  const config = loadConfig();
  console.log(chalk.green('✔ Logged in'));
  console.log(`  API: ${chalk.cyan(config.apiUrl)}`);
  // Show masked token — never expose the full value
  const masked = config.token.slice(0, 4) + '••••••••••••' + config.token.slice(-4);
  console.log(`  Token: ${chalk.dim(masked)}`);
}

export const whoamiCommand = new Command('whoami')
  .description('Show your current login status and API URL')
  .action(() => runWhoami().catch(handleError));
