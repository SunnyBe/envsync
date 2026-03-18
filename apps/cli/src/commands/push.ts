import { Command } from 'commander';
import axios from 'axios';
import path from 'path';
import { CLI_SOURCE_HEADER } from '../lib/api';
import chalk from 'chalk';
import { loadConfig } from '../config/config';
import { parseEnvFile } from '../utils/envParser';
import { handleError } from '../utils/error';
import { VALID_ENVIRONMENTS, Environment } from '../utils/environments';

interface PushOptions {
  project: string;
  env: string;
  file: string;
}

export async function runPush(opts: PushOptions): Promise<void> {
  if (!VALID_ENVIRONMENTS.includes(opts.env as Environment)) {
    throw new Error(
      `Invalid environment "${opts.env}". Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`,
    );
  }

  const config = loadConfig();
  const filePath = path.resolve(opts.file);
  const variables = parseEnvFile(filePath);
  const count = Object.keys(variables).length;

  if (count === 0) {
    throw new Error(`No variables found in ${opts.file}`);
  }

  await axios.post(
    `${config.apiUrl}/projects/${opts.project}/env`,
    { variables },
    {
      params: { env: opts.env },
      headers: { ...CLI_SOURCE_HEADER, Authorization: `Bearer ${config.token}` },
    },
  );

  console.log(
    chalk.green(`✔ Pushed ${count} variable${count !== 1 ? 's' : ''} to`) +
      chalk.bold(` [${opts.env}]`),
  );
}

export const pushCommand = new Command('push')
  .description('Push local .env variables to EnvSync')
  .requiredOption('--project <projectId>', 'Project ID')
  .requiredOption('--env <environment>', `Target environment (${VALID_ENVIRONMENTS.join('|')})`)
  .option('--file <path>', 'Path to .env file', '.env')
  .action((opts: PushOptions) => runPush(opts).catch(handleError));
