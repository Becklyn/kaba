class WebpackRunner
{
    /**
     * Constructs a new runner
     * @param {webpack.config} config
     * @param {CliConfig} cliConfig
     */
    constructor (config, cliConfig)
    {
        /**
         * @private
         * @type {webpack.config}
         */
        this.config = config;

        /**
         * @private
         * @type {CliConfig}
         */
        this.cliConfig = cliConfig;
    }


    /**
     * Runs the actual runner
     */
    run ()
    {
        return null;
    }
}

module.exports = WebpackRunner;
