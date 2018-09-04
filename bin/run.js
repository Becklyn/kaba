#!/usr/bin/env node

const CliConfig = require("../lib/CliConfig");
const kleur = require("kleur");
const Logger = require("../lib/Logger");
const printPackageVersions = require("../lib/print-package-versions");
const sade = require("sade");
const SassRunner = require("../lib/runner/SassRunner");
const WebpackRunner = require("../lib/runner/WebpackRunner");


console.log(``);
console.log(`  ${kleur.black.bgYellow("  ~~~~~~~~~~  ")}`);
console.log(`  ${kleur.black.bgYellow("   🍫  kaba   ")}`);
console.log(`  ${kleur.black.bgYellow("  ~~~~~~~~~~  ")}`);
console.log(``);

const program = sade("kaba");
const kabaVersion = require("../package").version;

program
    .version(kabaVersion)
    .option('--verbose', 'show all errors in the runner / config file with stack trace');

program
    .command("dev")
    .describe("Starts a watcher, builds debug builds with source maps + lints. Use this for development.")
    .action(opts =>
    {
        runKaba({
            debug: true,
            sourceMaps: true,
            watch: true,
            lint: true,
            openBundleAnalyzer: !!opts["analyze-bundles"],
        }, !!opts.verbose);
    });

program
    .command("build")
    .describe("Generates a production build. Use this for release / deployment.")
    .option('--analyze-bundles', 'opens the bundle analyzer')
    .option('--debug', 'enables debug builds (non-minified and with env `development`)')
    .option('--lint', 'lints all compiled files')
    .option('--watch', 'starts the file watcher')
    .option('--with-source-maps', 'outputs source maps')
    .action(opts =>
    {
        console.log(`  ${kleur.bgYellow.black(" Dev ")}`);
        console.log("");

        runKaba({
            debug: !!opts.debug,
            sourceMaps: !!opts["with-source-maps"],
            watch: !!opts.watch,
            lint: !!opts.lint,
            openBundleAnalyzer: !!opts["analyze-bundles"],
        }, !!opts.verbose);
    });


program
    .command("analyze")
    .describe("Analyzes and lints the assets and exits with an appropriate exit code (use this for you CI)")
    .action(opts =>
    {
        console.log(`  ${kleur.bgYellow.black(" Analyze ")}`);
        console.log("");

        runKaba({
            analyze: true,
            lint: true,
        }, !!opts.verbose);
    });


program
    .command("fix")
    .describe("Automatically fixes all CS and lint errors (as good as possible)")
    .action(opts =>
    {
        console.log(`  ${kleur.bgYellow.black(" Fix ")}`);
        console.log("");

        runKaba({
            fix: true,
        }, !!opts.verbose);
    });

// Command: Versions
program
    .command("versions")
    .describe("Prints all relevant versions")
    .action(() =>
    {
        console.log(`  ${kleur.bgYellow.black(" Versions ")}`);
        console.log("");
        printPackageVersions(kabaVersion, {
            "kaba-babel-preset": "yellow",
            "kaba-scss": "yellow",
            webpack: "cyan",
            "babel-core": "blue",
            typescript: "blue",
            eslint: "blue",
            "node-sass": "magenta",
            stylelint: "magenta",
        });

        process.exit(0);
    });

// set default command to "build"
program.default = program.curr = "build";

program.parse(process.argv);


/**
 * Main kaba function
 *
 * @param {CliConfigArguments} opts
 * @param {boolean} isVerbose
 */
function runKaba (opts, isVerbose)
{
    try
    {
        const logger = new Logger(kleur.bgYellow.black(" kaba "));
        logger.log("kaba started");
        const start = process.hrtime();
        const cliConfig = new CliConfig(opts);
        /** @type {Kaba} kaba */
        const kaba = require(`${process.cwd()}/kaba.js`);
        const buildConfig = kaba.getBuildConfig(cliConfig);

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

                    logger.logWithDuration(`kaba ${status}`, process.hrtime(start));

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
            console.log(`${kleur.red("Error")}: Could not find ${kleur.yellow("kaba.js")}`);
        }
        else
        {
            console.log(kleur.red(`Run Error: ${e.message}`));
        }

        if (isVerbose)
        {
            console.error(e);
        }

        process.exit(1);
    }
}
