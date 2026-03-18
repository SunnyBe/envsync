import chalk from 'chalk';
import { AxiosError } from 'axios';

const NETWORK_ERRORS = new Set(['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT']);

/**
 * Print a user-friendly error and exit with code 1.
 * Never shows raw stack traces — only the message from the API or Node.
 */
export function handleError(err: unknown): never {
  if (err instanceof AxiosError) {
    const apiMessage = (err.response?.data as { error?: string })?.error;
    const status = err.response?.status;
    const url = err.config?.url ?? err.config?.baseURL ?? 'unknown URL';

    if (apiMessage) {
      console.error(chalk.red(`✖ API error (${status}): ${apiMessage}`));
    } else if (err.code && NETWORK_ERRORS.has(err.code)) {
      console.error(chalk.red(`✖ Cannot reach the backend at ${url}`));
      console.error(chalk.dim('  Is the server running? Check your API URL with: envsync whoami'));
    } else {
      console.error(chalk.red(`✖ ${err.message}`));
      console.error(chalk.dim(`  URL: ${url}`));
    }
  } else if (err instanceof Error) {
    console.error(chalk.red(`✖ ${err.message}`));
  } else {
    console.error(chalk.red('✖ An unexpected error occurred'));
  }
  process.exit(1);
}
