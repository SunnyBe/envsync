import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import { loadConfig } from '../config/config';
import { handleError } from '../utils/error';

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

// ── list ──────────────────────────────────────────────────────────────────────

const listSubcommand = new Command('list')
  .description('List all your projects')
  .action(async () => {
    try {
      const config = loadConfig();
      const res = await axios.get<{ projects: Project[] }>(`${config.apiUrl}/projects`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });
      const projects = res.data.projects;

      if (projects.length === 0) {
        console.log(chalk.dim('No projects found. Create one with: envsync project create <name>'));
        return;
      }

      console.log(
        chalk.bold('\n  NAME                ID                                    CREATED'),
      );
      console.log(chalk.dim('  ' + '─'.repeat(72)));
      for (const p of projects) {
        const date = new Date(p.createdAt).toLocaleDateString();
        console.log(`  ${p.name.padEnd(20)}${chalk.cyan(p.id)}  ${chalk.dim(date)}`);
      }
      console.log();
    } catch (err) {
      handleError(err);
    }
  });

// ── create ────────────────────────────────────────────────────────────────────

const createSubcommand = new Command('create')
  .description('Create a new project')
  .argument('<name>', 'Project name')
  .action(async (name: string) => {
    try {
      const config = loadConfig();
      const res = await axios.post<Project>(
        `${config.apiUrl}/projects`,
        { name },
        { headers: { Authorization: `Bearer ${config.token}` } },
      );
      console.log(chalk.green(`✔ Project created`));
      console.log(`  Name: ${chalk.bold(res.data.name)}`);
      console.log(`  ID:   ${chalk.cyan(res.data.id)}`);
    } catch (err) {
      handleError(err);
    }
  });

// ── get ───────────────────────────────────────────────────────────────────────

const getSubcommand = new Command('get')
  .description('Show details for a project')
  .argument('<id>', 'Project ID')
  .action(async (id: string) => {
    try {
      const config = loadConfig();
      const res = await axios.get<Project>(`${config.apiUrl}/projects/${id}`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });
      const p = res.data;
      console.log(`\n  ${chalk.bold(p.name)}`);
      console.log(`  ID:      ${chalk.cyan(p.id)}`);
      console.log(`  Created: ${chalk.dim(new Date(p.createdAt).toLocaleString())}\n`);
    } catch (err) {
      handleError(err);
    }
  });

// ── update ────────────────────────────────────────────────────────────────────

const updateSubcommand = new Command('update')
  .description('Rename a project')
  .argument('<id>', 'Project ID')
  .requiredOption('--name <name>', 'New project name')
  .action(async (id: string, opts: { name: string }) => {
    try {
      const config = loadConfig();
      const res = await axios.patch<Project>(
        `${config.apiUrl}/projects/${id}`,
        { name: opts.name },
        { headers: { Authorization: `Bearer ${config.token}` } },
      );
      console.log(chalk.green(`✔ Project renamed to "${res.data.name}"`));
    } catch (err) {
      handleError(err);
    }
  });

// ── delete ────────────────────────────────────────────────────────────────────

const deleteSubcommand = new Command('delete')
  .description('Delete a project')
  .argument('<id>', 'Project ID')
  .action(async (id: string) => {
    try {
      const config = loadConfig();
      await axios.delete(`${config.apiUrl}/projects/${id}`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });
      console.log(chalk.green(`✔ Project deleted`));
    } catch (err) {
      handleError(err);
    }
  });

// ── parent command ─────────────────────────────────────────────────────────────

export const projectCommand = new Command('project').description('Manage projects');

projectCommand.addCommand(listSubcommand);
projectCommand.addCommand(createSubcommand);
projectCommand.addCommand(getSubcommand);
projectCommand.addCommand(updateSubcommand);
projectCommand.addCommand(deleteSubcommand);
