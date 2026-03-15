#!/usr/bin/env node
import { Command } from 'commander';
import { loginCommand } from './commands/login';
import { logoutCommand } from './commands/logout';
import { whoamiCommand } from './commands/whoami';
import { pushCommand } from './commands/push';
import { pullCommand } from './commands/pull';

const program = new Command();

program
  .name('envsync')
  .description('Sync environment variables across your team')
  .version('1.0.0');

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);
program.addCommand(pushCommand);
program.addCommand(pullCommand);

program.parse(process.argv);
