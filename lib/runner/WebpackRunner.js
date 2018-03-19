const chalk = require("chalk");
const fs = require("fs");
const Logger = require("../Logger");
const path = require("path");
const webpack = require("webpack");


class WebpackRunner
{
    /**
     * Constructs a new runner
     * @param {KabaBuildConfig} buildConfig
     * @param {CliConfig} cliConfig
     */
    constructor (buildConfig, cliConfig)
    {
        /**
         * @private
         * @type {KabaBuildConfig}
         */
        this.buildConfig = buildConfig;

        /**
         * @private
         * @type {webpack.config}
         */
        this.webpackConfig = buildConfig.js.webpack;

        /**
         * @private
         * @type {CliConfig}
         */
        this.cliConfig = cliConfig;

        /**
         * @private
         * @type {Logger}
         */
        this.logger = new Logger(chalk.bgCyan.black(" webpack "));
    }


    /**
     * Runs the actual runner
     *
     * @return {Promise<boolean>} whether the build was successful and error-free
     */
    async run ()
    {
        if (Object.keys(this.webpackConfig.entry).length === 0)
        {
            return true;
        }

        return new Promise(
            (resolve) =>
            {
                this.logger.log("Launching webpack...");
                const start = process.hrtime();

                webpack(
                    this.webpackConfig,
                    /**
                     * @param {Error|null} error
                     * @param {webpack.stats} stats
                     * @return {void}
                     */
                    (error, stats) =>
                    {
                        if (error)
                        {
                            this.logger.logError("webpack error", error);
                            this.logger.logWithDuration("webpack finished", process.hrtime(start));
                            return resolve(false);
                        }

                        // log webpack output
                        console.log(stats.toString({
                            colors: true,
                        }));
                        console.log("");

                        // write dependencies file
                        this.writeDependenciesFile(stats);

                        this.logger.logWithDuration("webpack finished", process.hrtime(start));

                        if (!this.webpackConfig.watch)
                        {
                            if (stats.hasErrors())
                            {
                                return resolve(false);
                            }

                            resolve(true);
                        }
                    }
                );
            }
        );
    }


    /**
     * Writes the entry dependencies file
     *
     * @private
     * @param {Stats} stats
     */
    writeDependenciesFile (stats)
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

        const fileName = `${this.buildConfig.js.javaScriptDependenciesFileName}.json`;
        fs.writeFileSync(
            path.join(this.webpackConfig.output.path, fileName),
            JSON.stringify(entrypoints),
            "utf-8"
        );
        this.logger.log(chalk`Entrypoint dependencies written to {yellow ${fileName}}`);
    }
}

module.exports = WebpackRunner;
