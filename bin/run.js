#!/usr/bin/env node

const chalk = require("chalk");
const cli = require("./cli");

console.log(``);
console.log(`${chalk.black(chalk.bgYellow("  ~~~~~~~~~~  "))}`);
console.log(`${chalk.black(chalk.bgYellow("   🍫  kaba    "))}`);
console.log(`${chalk.black(chalk.bgYellow("  ~~~~~~~~~~  "))}`);
console.log(``);

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

try
{
    console.log(chalk`Running {cyan webpack} ...`);
    console.log();
    require('webpack/bin/webpack');
}
catch (e)
{
    console.log(chalk`{red Webpack Error: ${e.message}}`);

    if (cli.isVerbose())
    {
        console.error(e);
    }
}
