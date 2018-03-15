const chalk = require("chalk");
const KabaScss = require("kaba-scss");
const Logger = require("../Logger");
const path = require("path");


class SassRunner
{
    /**
     * Constructs a new runner
     * @param {KabaBuildConfig} fullBuildConfig
     * @param {CliConfig} cliConfig
     */
    constructor (fullBuildConfig, cliConfig)
    {
        /**
         * @private
         * @type {SassBuildConfig}
         */
        this.buildConfig = fullBuildConfig.sass;

        /**
         * @private
         * @type {CliConfig}
         */
        this.cliConfig = cliConfig;

        /**
         * @private
         * @type {Logger}
         */
        this.logger = new Logger(chalk.bgMagenta.black(" Sass "));
    }


    /**
     * Runs the actual runner
     *
     * @return {Promise<boolean>} whether the build was successful and error-free
     */
    async run ()
    {
        const entries = Object.keys(this.buildConfig.entries);

        // skip if no entries set
        if (entries.length === 0)
        {
            return true;
        }

        const compiler = new KabaScss({
            isDebug: this.cliConfig.isDebug(),
            includeSourceMaps: this.cliConfig.includeSourceMaps(),
            isWatch: this.cliConfig.isWatch(),
            lint: this.cliConfig.isLint(),
            analyze: this.cliConfig.isAnalyze(),
            cwd: this.buildConfig.cwd,
            browserList: this.buildConfig.browserList,
            fix: this.cliConfig.isFix(),
        }, this.logger);

        entries.forEach(
            name =>
            {
                const src = this.buildConfig.entries[name];
                const outputPath = `${this.buildConfig.outputPath}/${name}.css`;

                compiler.addEntry(src, path.dirname(outputPath), path.basename(outputPath));
            }
        );

        return compiler.run();
    }
}

module.exports = SassRunner;
