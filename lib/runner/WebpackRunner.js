const chalk = require("chalk");
const fs = require("fs");
const Logger = require("../Logger");
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
        if (Object.keys(this.buildConfig.entry).length === 0)
        {
            return true;
        }

        return new Promise(
            (resolve) =>
            {
                this.logger.log("Launching webpack...");
                const start = process.hrtime();

                webpack(
                    this.buildConfig.js.webpack,
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
                        fs.writeFileSync(
                            path.join(this.buildConfig.output.path, `${this.buildConfig.js.javaScriptDependenciesFileName}.json`),
                            JSON.stringify(this.fetchEntryDependencies(stats)),
                            "utf-8"
                        );

                        this.logger.logWithDuration("webpack finished", process.hrtime(start));

                        if (stats.hasErrors())
                        {
                            return resolve(false);
                        }

                        resolve(true);
                    }
                );
            }
        );
    }


    /**
     * Fetches all entry dependencies
     *
     * @private
     * @param {Stats} stats
     * @return {Object<string, string[]>}
     */
    fetchEntryDependencies (stats)
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

        return entrypoints;
    }
}

module.exports = WebpackRunner;
