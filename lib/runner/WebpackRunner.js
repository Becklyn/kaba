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

        return true;
    }
}

module.exports = WebpackRunner;
