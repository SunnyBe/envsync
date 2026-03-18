#!/usr/bin/env node
import { Command } from 'commander';
import { loginCommand } from './commands/login';
import { logoutCommand } from './commands/logout';
import { whoamiCommand } from './commands/whoami';
import { pushCommand } from './commands/push';
import { pullCommand } from './commands/pull';
import { projectCommand } from './commands/project';
import { CLI_NAME, CLI_VERSION, CLI_DESCRIPTION } from './meta';

const program = new Command();

program.name(CLI_NAME).description(CLI_DESCRIPTION).version(CLI_VERSION);

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);
program.addCommand(pushCommand);
program.addCommand(pullCommand);
program.addCommand(projectCommand);

program.parse(process.argv);
