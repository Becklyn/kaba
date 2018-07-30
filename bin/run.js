#!/usr/bin/env node

const CliConfig = require("../lib/CliConfig");
const kleur = require("kleur");
const Logger = require("../lib/Logger");
const printPackageVersions = require("../lib/print-package-versions");
const program = require("commander");
const SassRunner = require("../lib/runner/SassRunner");
const WebpackRunner = require("../lib/runner/WebpackRunner");


console.log(``);
console.log(`  ${kleur.black.bgYellow("  ~~~~~~~~~~  ")}`);
console.log(`  ${kleur.black.bgYellow("   🍫  kaba    ")}`);
console.log(`  ${kleur.black.bgYellow("  ~~~~~~~~~~  ")}`);
console.log(``);

program
    .option('-d, --dev', 'enables debug, file watchers, linting and source maps')
    .option('--debug', 'enables debug builds (non-minified and with env `development`)')
    .option('--with-source-maps', 'outputs source maps')
    .option('--analyze-bundles', 'opens the bundle analyzer')
    .option('--analyze', 'analyzes and lints the code. Should be used in CI')
    .option('--watch', 'starts the file watcher')
    .option('--lint', 'lints all compiled files')
    .option('--fix', 'automatically fixes the code style (as good as possible)')
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
    const logger = new Logger(kleur.bgYellow.black(" kaba "));
    logger.log("kaba started");
    const start = process.hrtime();
    const cliConfig = new CliConfig(program);
    /** @type {Kaba} kaba */
    const kaba = require(`${process.cwd()}/kaba.js`);
    const buildConfig = kaba.getBuildConfig();

    const scss = new SassRunner(buildConfig, cliConfig);
    const webpack = new WebpackRunner(buildConfig, cliConfig);

    Promise.all([scss.run(), webpack.run()])
        .then(
            ([scssOk, webpackOk]) =>
            {
                const failed = (false === scssOk || false === webpackOk);
                const status = failed
                    ? kleur.red("failed")
                    : kleur.green("succeeded");

                logger.logWithDuration(kleur`kaba ${status}`, process.hrtime(start));

                process.exit(failed ? 1 : 0);
            }
        )
        .catch(
            (...args) => console.log("something broke", args)
        );

    if (cliConfig.isWatch())
    {
        const exitCallback = () => {
            scss.stop();
            webpack.stop();
        };

        process.on("exit", exitCallback);
        process.on("SIGINT", exitCallback);
        process.on("SIGUSR1", exitCallback);
        process.on("SIGUSR2", exitCallback);
    }
}
catch (e)
{
    if (/cannot find module.*?kaba\.js/i.test(e.message))
    {
        console.log(`${kleur.red("Error")}: Could not find {yellow kaba.js}`);
    }
    else
    {
        console.log(kleur.red(`Run Error: ${e.message}`));
    }

    if (program.verbose)
    {
        console.error(e);
    }

    process.exit(1);
}
