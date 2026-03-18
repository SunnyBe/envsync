#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { loginCommand } from './commands/login';
import { logoutCommand } from './commands/logout';
import { whoamiCommand } from './commands/whoami';
import { pushCommand } from './commands/push';
import { pullCommand } from './commands/pull';
import { projectCommand } from './commands/project';
import { CLI_NAME, CLI_VERSION, CLI_DESCRIPTION } from './meta';

const program = new Command();

program
  .name(CLI_NAME)
  .description(CLI_DESCRIPTION)
  .version(CLI_VERSION, '-V, --version', 'Show version number')
  .helpOption('-h, --help', 'Show help')
  .addHelpCommand('help [command]', 'Show help for a specific command')
  .addHelpText(
    'beforeAll',
    chalk.cyan(`\n  EnvSync CLI v${CLI_VERSION} — sync environment variables across your team\n`),
  );

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);
program.addCommand(pushCommand);
program.addCommand(pullCommand);
program.addCommand(projectCommand);

// Unknown command → friendly error instead of Commander's raw message
program.on('command:*', (operands: string[]) => {
  console.error(chalk.red(`\n  ✖ Unknown command: ${operands[0]}\n`));
  console.error(chalk.dim(`  Run ${chalk.white('envsync --help')} to see available commands.\n`));
  process.exit(1);
});

// No arguments → show help
if (process.argv.slice(2).length === 0) {
  program.outputHelp();
  process.exit(0);
}

program.parse(process.argv);
