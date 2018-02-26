#!/usr/bin/env node

const chalk = require("chalk");
const Config = require("../lib/Config");
const program = require("commander");
const printPackageVersions = require("../lib/print-package-versions");
const ScssRunner = require("../lib/runner/ScssRunner");
const WebpackRunner = require("../lib/runner/WebpackRunner");


console.log(``);
console.log(`  ${chalk.black.bgYellow("  ~~~~~~~~~~  ")}`);
console.log(`  ${chalk.black.bgYellow("   🍫  kaba    ")}`);
console.log(`  ${chalk.black.bgYellow("  ~~~~~~~~~~  ")}`);
console.log(``);

program
    .option('-d, --dev', 'enables debug, file watchers, linting and source maps')
    .option('--debug', 'enables debug builds (non-minified and with env `development`)')
    .option('--with-source-maps', 'outputs source maps')
    .option('--analyze-bundles', 'opens the bundle analyzer')
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
        "kaba-scss": "yellow",
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
    const cliConfig = new Config(program);
    const buildConfig = require(`${process.cwd()}/kaba.js`);

    const scss = new ScssRunner(buildConfig);
    const webpack = new WebpackRunner(buildConfig);

    Promise.all([scss.run(), webpack.run()])
        .then(
            ([scssOk, webpackOk]) =>
            {
                if (cliConfig.isAnalyze() && (!scssOk || !webpackOk))
                {
                    process.exit(1);
                }
            }
        );
}
catch (e)
{
    if (/cannot find module.*?kaba\.js/i.test(e.message))
    {
        console.log(chalk`{red Error}: Could not find {yellow kaba.js}`);
    }
    else
    {
        console.log(chalk`{red Run Error: ${e.message}}`);
    }

    if (program.verbose)
    {
        console.error(e);
    }
}
