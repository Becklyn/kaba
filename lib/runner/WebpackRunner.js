const chalk = require("chalk");
const Logger = require("../Logger");
const webpack = require("webpack");


class WebpackRunner
{
    /**
     * Constructs a new runner
     * @param {webpack.config} buildConfig
     * @param {CliConfig} cliConfig
     */
    constructor (buildConfig, cliConfig)
    {
        /**
         * @private
         * @type {webpack.config}
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
                    this.buildConfig,
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
}

module.exports = WebpackRunner;
