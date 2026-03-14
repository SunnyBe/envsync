import { Command } from 'commander';
import axios from 'axios';
import path from 'path';
import { loadConfig } from '../config/config';
import { writeEnvFile } from '../utils/envParser';

export const pullCommand = new Command('pull')
  .description('Pull variables from EnvSync into a local .env file')
  .requiredOption('--project <projectId>', 'Project ID')
  .requiredOption('--env <environment>', 'Target environment (development|staging|production)')
  .option('--file <path>', 'Output .env file path', '.env')
  .action(async (opts) => {
    const config = loadConfig();

    const { data } = await axios.get(`${config.apiUrl}/env`, {
      params: { projectId: opts.project, env: opts.env },
      headers: { Authorization: `Bearer ${config.token}` },
    });

    writeEnvFile(path.resolve(opts.file), data.variables);
    console.log(`Pulled ${Object.keys(data.variables).length} variable(s) into ${opts.file}.`);
  });
