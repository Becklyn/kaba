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

return require('webpack/bin/webpack');
