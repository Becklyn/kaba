const KabaScss = require("kaba-scss");
const path = require("path");


class SassRunner
{
    /**
     * Constructs a new runner
     * @param {SassBuildConfig} buildConfig
     * @param {CliConfig} cliConfig
     */
    constructor (buildConfig, cliConfig)
    {
        /**
         * @private
         * @type {SassBuildConfig}
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
     * @return {Promise<boolean>|null}
     */
    run ()
    {
        const entries = Object.keys(this.buildConfig.entries);

        // skip if no entries set
        if (entries.length === 0)
        {
            return null;
        }

        const compiler = new KabaScss({
            isDebug: this.cliConfig.isDebug(),
            includeSourceMaps: this.cliConfig.includeSourceMaps(),
            isWatch: this.cliConfig.isWatch(),
            lint: this.cliConfig.isLint(),
            analyze: this.cliConfig.isAnalyze(),
            cwd: this.buildConfig.cwd,
            browserlist: this.buildConfig.browserList,
        });

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