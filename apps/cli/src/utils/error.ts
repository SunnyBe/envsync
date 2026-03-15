import chalk from 'chalk';
import { AxiosError } from 'axios';

/**
 * Print a user-friendly error and exit with code 1.
 * Never shows raw stack traces — only the message from the API or Node.
 */
export function handleError(err: unknown): never {
  if (err instanceof AxiosError) {
    const apiMessage = (err.response?.data as { error?: string })?.error;
    const status = err.response?.status;
    if (apiMessage) {
      console.error(chalk.red(`✖ API error (${status}): ${apiMessage}`));
    } else if (err.code === 'ECONNREFUSED') {
      console.error(chalk.red('✖ Could not connect to the API. Is the server running?'));
      console.error(chalk.dim('  Tip: check --api-url or run: envsync whoami'));
    } else {
      console.error(chalk.red(`✖ ${err.message}`));
    }
  } else if (err instanceof Error) {
    console.error(chalk.red(`✖ ${err.message}`));
  } else {
    console.error(chalk.red('✖ An unexpected error occurred'));
  }
  process.exit(1);
}
