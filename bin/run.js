#!/usr/bin/env node

const chalk = require("chalk");
const CliConfig = require("../lib/CliConfig");
const formatHrTimeDuration = require("../lib/utils").formatHrTimeDuration;
const program = require("commander");
const printPackageVersions = require("../lib/print-package-versions");
const SassRunner = require("../lib/runner/SassRunner");
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
    const start = process.hrtime();
    const cliConfig = new CliConfig(program);
    /** @type {KabaBuildConfig} buildConfig */
    const buildConfig = require(`${process.cwd()}/kaba.js`);

    const scss = new SassRunner(buildConfig.sass, cliConfig);
    const webpack = new WebpackRunner(buildConfig.webpack, cliConfig);

    Promise.all([scss.run(), webpack.run()])
        .then(
            ([scssOk, webpackOk]) =>
            {
                const duration = process.hrtime(start);
                const failed = cliConfig.isAnalyze() && (false === scssOk || false === webpackOk);
                const status = failed
                    ? chalk.red("failed")
                    : chalk.green("succeeded");

                console.log(chalk`Build ${status} after {blue ${formatHrTimeDuration(duration)}}`);

                if (failed)
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
