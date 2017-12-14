#!/usr/bin/env node

const chalk = require("chalk");
const program = require("commander");
const printPackageVersions = require("../lib/print-package-versions");


console.log(``);
console.log(`  ${chalk.black(chalk.bgYellow("  ~~~~~~~~~~  "))}`);
console.log(`  ${chalk.black(chalk.bgYellow("   🍫  kaba    "))}`);
console.log(`  ${chalk.black(chalk.bgYellow("  ~~~~~~~~~~  "))}`);
console.log(``);

program
    .option('-d, --dev', 'enables debug, file watchers, linting and source maps')
    .option('--debug', 'enables debug builds (non-minified and with env `development`)')
    .option('--with-source-maps', 'outputs source maps')
    .option('--watch', 'starts the file watcher')
    .option('--lint', 'lints all compiled files')
    .option('--verbose', 'show all errors in the runner / config file with stack trace')
    .option('-V, --versions', 'output version info')
    .parse(process.argv);


if (program.versions)
{
    printPackageVersions({
        kaba: "yellow",
        "kaba-babel-preset": "yellow",
        webpack: "cyan",
        "babel-core": "blue",
        "node-sass": "blue",
        typescript: "blue",
        eslint: "blue",
        stylelint: "blue",
    });
    process.exit(0);
}


try
{
    // strip all other arguments to not confuse webpack
    process.argv = process.argv.slice(0,2);

    console.log(chalk`Running {cyan webpack} ...`);
    console.log();
    require('webpack/bin/webpack');
}
catch (e)
{
    console.log(chalk`{red Webpack Error: ${e.message}}`);

    if (program.verbose)
    {
        console.error(e);
    }
}
