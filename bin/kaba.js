#!/usr/bin/env node

const chalk = require("chalk");
const cli = require("../cli/cli");

console.log(``);
console.log(`${chalk.black(chalk.bgYellow("  ~~~~~~~~~~  "))}`);
console.log(`${chalk.black(chalk.bgYellow("   🍫  kaba    "))}`);
console.log(`${chalk.black(chalk.bgYellow("  ~~~~~~~~~~  "))}`);
console.log(``);

console.log('Running webpack ...');
console.log();

if (cli.showHelp())
{
    // @todo implement
    console.log("show help");
    process.exit(0);
}
else if (cli.showVersion())
{
    // @todo implement
    console.log("show version");
    process.exit(0);
}

// set environment
process.env.NODE_ENV = cli.isDebug() ? '"development"' : '"production"';

// strip all other arguments
process.argv = process.argv.slice(0,2);

require('webpack/bin/webpack');