const fs = require("fs-extra");
const {bgCyan, black, yellow} = require("kleur");
import {Logger} from "../Logger";
const path = require("path");
const webpack = require("webpack");


class WebpackRunner
{
    /**
     * Constructs a new runner
     * @param {KabaBuildConfig} buildConfig
     */
    constructor (buildConfig)
    {
        /**
         * @private
         * @type {KabaBuildConfig}
         */
        this.buildConfig = buildConfig;

        /**
         * @private
         * @type {ModularizedWebpackConfig[]}
         */
        this.webpackConfigs = buildConfig.js.webpack;

        /**
         * @private
         * @type {Logger}
         */
        this.logger = new Logger(bgCyan(black(" webpack ")));

        /**
         * @private
         * @type {Compiler.Watching[]}
         */
        this.watchers = [];

        /**
         * @private
         * @type {?function}
         */
        this.resolveCallback = null;
    }


    /**
     * Runs the actual runner
     *
     * @return {Promise<boolean>} whether the build was successful and error-free
     */
    async run ()
    {
        if (Object.keys(this.webpackConfigs).length === 0)
        {
            return true;
        }

        return new Promise(
            (resolve) =>
            {
                this.logger.log("Launching webpack...");
                const start = process.hrtime();

                if (null != this.buildConfig.js.customTypeScriptConfig)
                {
                    this.logger.log(`Using custom TypeScript config: ${yellow(path.relative(this.buildConfig.cwd, this.buildConfig.js.customTypeScriptConfig))}`);
                }

                if (this.webpackConfigs.some(entry => entry.config.watch))
                {
                    this.resolveCallback = resolve;
                }

                this.webpackConfigs.forEach(entry => {
                    const compiler = webpack(entry.config);

                    if (entry.config.watch)
                    {

                    }
                });


                if (this.webpackConfigs.watch)
                {
                    this.resolveCallback = resolve;

                    this.watcher = compiler.watch(
                        {},
                        (error, stats) => this.onCompilationFinished(error, stats)
                    );
                }
                else
                {
                    compiler.run(
                        (error, stats) => {
                            resolve(this.onCompilationFinished(error, stats));
                            this.logger.logBuildSuccess("(all files)", process.hrtime(start));
                        }
                    );
                }
            }
        );
    }


    /**
     * Callback on after the compilation has finished
     *
     * @param {Error|null} error
     * @param {webpack.stats} stats
     * @param {boolean} isModule
     * @return {boolean} whether the compilation had no errors
     */
    onCompilationFinished (error, stats, isModule)
    {
        if (error)
        {
            this.logger.logError("webpack error", error);
            this.logger.logWithDuration("webpack finished", process.hrtime(start));
            return false;
        }

        // log webpack output
        console.log(stats.toString({
            colors: true,
        }));
        console.log("");

        // write dependencies file
        this.writeDependenciesFile(stats, isModule);

        return !stats.hasErrors();
    }


    /**
     * Stops the runner
     */
    stop ()
    {
        if (null !== this.resolveCallback)
        {
            Promise.all(
                this.watchers.map(watcher =>
                    new Promise(resolve => watcher.close(resolve))
                )
            )
                .then(() => this.resolveCallback(true));
        }
    }


    /**
     * Writes the entry dependencies file
     *
     * @private
     * @param {Stats} stats
     * @param {boolean} isModule
     */
    writeDependenciesFile (stats, isModule)
    {
        const entrypoints = {};

        for (const mapEntry of stats.compilation.entrypoints.entries())
        {
            const entry = mapEntry[1];
            entrypoints[entry.name] = entry.chunks.reduce(
                (files, chunk) => {
                    return files.concat(chunk.files);
                },
                []
            );
        }

        // ensure that output path exists
        fs.ensureDirSync(this.webpackConfigs.output.path);

        const fileName = `${this.buildConfig.js.javaScriptDependenciesFileName}${isModule ? ".module" : ""}.json`;
        fs.writeFileSync(
            path.join(this.webpackConfigs.output.path, fileName),
            JSON.stringify(entrypoints),
            "utf-8"
        );
        this.logger.log(`Entrypoint dependencies written to ${yellow(fileName)}`);
    }
}

module.exports = WebpackRunner;
