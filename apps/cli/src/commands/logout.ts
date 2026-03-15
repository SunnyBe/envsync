import { Command } from 'commander';
import chalk from 'chalk';
import { clearConfig, configExists } from '../config/config';
import { handleError } from '../utils/error';

export async function runLogout(): Promise<void> {
  if (!configExists()) {
    console.log(chalk.dim('Already logged out.'));
    return;
  }
  clearConfig();
  console.log(chalk.green('✔ Logged out. Config removed.'));
}

export const logoutCommand = new Command('logout')
  .description('Remove your locally stored API token')
  .action(() => runLogout().catch(handleError));
