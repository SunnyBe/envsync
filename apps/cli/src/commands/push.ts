import { Command } from 'commander';
import axios from 'axios';
import path from 'path';
import { loadConfig } from '../config/config';
import { parseEnvFile } from '../utils/envParser';

export const pushCommand = new Command('push')
  .description('Push local .env variables to EnvSync')
  .requiredOption('--project <projectId>', 'Project ID')
  .requiredOption('--env <environment>', 'Target environment (development|staging|production)')
  .option('--file <path>', 'Path to .env file', '.env')
  .action(async (opts) => {
    const config = loadConfig();
    const variables = parseEnvFile(path.resolve(opts.file));

    await axios.post(
      `${config.apiUrl}/env`,
      { projectId: opts.project, env: opts.env, variables },
      { headers: { Authorization: `Bearer ${config.token}` } }
    );

    console.log(`Pushed ${Object.keys(variables).length} variable(s) to [${opts.env}].`);
  });
