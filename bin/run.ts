#!/usr/bin/env node

import {kaba} from "../src/@types/kaba";
import {Kaba} from "../src/Kaba";
import {Logger} from "../src/Logger";
const sade = require("sade");
import {bgYellow, black, blue, cyan, green, magenta, red, yellow} from "kleur";
import {printPackageVersions} from "../src/print-package-versions";
import {SassRunner} from "../src/runner/SassRunner";
import {WebpackRunner} from "../src/runner/WebpackRunner";


console.log(``);
console.log(`  ${black(bgYellow("  ~~~~~~~~~~  "))}`);
console.log(`  ${black(bgYellow("   🍫  kaba   "))}`);
console.log(`  ${black(bgYellow("  ~~~~~~~~~~  "))}`);
console.log(``);

const program = sade("kaba");
const kabaVersion = require("../package").version;

program
    .version(kabaVersion)
    .option('--verbose', 'show all errors in the runner / config file with stack trace');

program
    .command("dev")
    .describe("Starts a watcher, builds debug builds + lints. Use this for development.")
    .option('--analyze-bundles', 'opens the bundle analyzer')
    .action(opts =>
    {
        runKaba({
            debug: true,
            watch: true,
            lint: true,
            openBundleAnalyzer: !!opts["analyze-bundles"],
            verbose: !!opts.verbose,
        });
    });

program
    .command("build")
    .describe("Generates a production build. Use this for release / deployment.")
    .option('--analyze-bundles', 'opens the bundle analyzer')
    .option('--debug', 'enables debug builds (non-minified and with env `development`)')
    .option('--lint', 'lints all compiled files')
    .option('--watch', 'starts the file watcher')
    .action(opts =>
    {
        console.log(`  ${bgYellow(black(" Dev "))}`);
        console.log("");

        runKaba({
            debug: !!opts.debug,
            watch: !!opts.watch,
            lint: !!opts.lint,
            openBundleAnalyzer: !!opts["analyze-bundles"],
            verbose: !!opts.verbose,
        });
    });


program
    .command("analyze")
    .describe("Analyzes and lints the assets and exits with an appropriate exit code (use this for you CI)")
    .action(opts =>
    {
        console.log(`  ${bgYellow(black(" Analyze "))}`);
        console.log("");

        runKaba({
            lint: true,
            verbose: !!opts.verbose,
        });
    });


program
    .command("fix")
    .describe("Automatically fixes all CS and lint errors (as good as possible)")
    .action(opts =>
    {
        console.log(`  ${bgYellow(black(" Fix "))}`);
        console.log("");

        runKaba({
            fix: true,
            verbose: !!opts.verbose,
        });
    });

// Command: Versions
program
    .command("versions")
    .describe("Prints all relevant versions")
    .action(() =>
    {
        console.log(`  ${bgYellow(black(" Versions "))}`);
        console.log("");
        printPackageVersions(kabaVersion, {
            "kaba-babel-preset": yellow,
            "kaba-scss": yellow,
            webpack: cyan,
            "@babel/core": blue,
            typescript: blue,
            eslint: blue,
            "node-sass": magenta,
            stylelint: magenta,
        });

        process.exit(0);
    });

// set default command to "build"
program.default = program.curr = "build";

program.parse(process.argv);


/**
 * Main kaba function
 */
function runKaba (cliConfig: kaba.CliConfig) : void
{
    try
    {
        const logger = new Logger(bgYellow(black(" kaba ")));
        logger.log("kaba started");
        const start = process.hrtime();

        const kaba: Kaba = require(`${process.cwd()}/kaba.js`);
        const buildConfig = kaba.getBuildConfig(cliConfig);

        const scss = new SassRunner(buildConfig, cliConfig);
        const webpack = new WebpackRunner(buildConfig);

        Promise.all([scss.run(), webpack.run()])
            .then(
                ([scssOk, webpackOk]) =>
                {
                    const failed = !scssOk || !webpackOk;
                    const status = failed
                        ? red("failed")
                        : green("succeeded");

                    logger.logWithDuration(`kaba ${status}`, process.hrtime(start));

                    process.exit(failed ? 1 : 0);
                }
            )
            .catch(
                (...args) => console.log("something broke", args)
            );

        if (cliConfig.watch)
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
            console.log(`${red("Error")}: Could not find ${yellow("kaba.js")}`);
        }
        else
        {
            console.log(red(`Run Error: ${e.message}`));
        }

        if (cliConfig.verbose)
        {
            console.error(e);
        }

        process.exit(1);
    }
}
