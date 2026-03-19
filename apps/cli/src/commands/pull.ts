import { Command } from 'commander';
import axios from 'axios';
import path from 'path';
import { CLI_SOURCE_HEADER } from '../lib/api';
import chalk from 'chalk';
import { loadConfig } from '../config/config';
import { writeEnvFile } from '../utils/envParser';
import { handleError } from '../utils/error';
import { VALID_ENVIRONMENTS, Environment } from '../utils/environments';
import { resolveProject } from '../utils/resolveProject';

interface PullOptions {
  project: string;
  env: string;
  file: string;
}

export async function runPull(opts: PullOptions): Promise<void> {
  if (!VALID_ENVIRONMENTS.includes(opts.env as Environment)) {
    throw new Error(
      `Invalid environment "${opts.env}". Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`,
    );
  }

  const config = loadConfig();
  const projectId = await resolveProject(opts.project, config);

  const { data } = await axios.get<{ variables: Record<string, string> }>(
    `${config.apiUrl}/projects/${projectId}/env`,
    {
      params: { env: opts.env },
      headers: { ...CLI_SOURCE_HEADER, Authorization: `Bearer ${config.token}` },
    },
  );

  const variables = data.variables;
  const count = Object.keys(variables).length;
  const filePath = path.resolve(opts.file);
  writeEnvFile(filePath, variables);

  console.log(
    chalk.green(`✔ Pulled ${count} variable${count !== 1 ? 's' : ''} from`) +
      chalk.bold(` [${opts.env}]`) +
      chalk.green(` → ${opts.file}`),
  );
}

export const pullCommand = new Command('pull')
  .description('Pull variables from EnvSync into a local .env file')
  .requiredOption('--project <name|id>', 'Project name or ID')
  .requiredOption('--env <environment>', `Target environment (${VALID_ENVIRONMENTS.join('|')})`)
  .option('--file <path>', 'Output .env file path', '.env')
  .action((opts: PullOptions) => runPull(opts).catch(handleError));
