#!/usr/bin/env node
import { Command } from 'commander';
import { loginCommand } from './commands/login';
import { pushCommand } from './commands/push';
import { pullCommand } from './commands/pull';

const program = new Command();

program
  .name('envsync')
  .description('Sync environment variables across your team')
  .version('0.1.0');

program.addCommand(loginCommand);
program.addCommand(pushCommand);
program.addCommand(pullCommand);

program.parse(process.argv);
