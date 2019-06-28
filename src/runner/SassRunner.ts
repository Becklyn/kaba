import {KabaScss} from "kaba-scss/src";
import {kaba} from "../@types/kaba";
const path = require("path");


export class SassRunner
{
    private buildConfig: kaba.SassBuildConfig;
    private cliConfig: kaba.CliConfig;
    private compiler?: KabaScss;

    /**
     * Constructs a new runner
     */
    constructor (fullBuildConfig: kaba.BuildConfig, cliConfig: kaba.CliConfig)
    {
        this.buildConfig = fullBuildConfig.sass;
        this.cliConfig = cliConfig;
    }


    /**
     * Runs the actual runner
     *
     * @return {Promise<boolean>} whether the build was successful and error-free
     */
    async run () : Promise<boolean|null>
    {
        const entries = Object.keys(this.buildConfig.entries);

        // skip if no entries set
        if (entries.length === 0)
        {
            return true;
        }

        // lazy load it as it is optional

        const {KabaScss} = require("kaba-scss");
        this.compiler = new KabaScss({
            debug: this.cliConfig.debug,
            watch: this.cliConfig.watch,
            lint: this.cliConfig.lint,
            fix: this.cliConfig.fix,
            cwd: this.buildConfig.cwd,
        });

        entries.forEach(
            name =>
            {
                const src = path.join(this.buildConfig.cwd, this.buildConfig.entries[name]);
                const outputPath = `${this.buildConfig.outputPath}/${name}.css`;

                (this.compiler as KabaScss).addEntry(src, path.dirname(outputPath), path.basename(outputPath));
            }
        );

        return (this.compiler as KabaScss).run();
    }


    /**
     * Stops the runner
     */
    stop ()
    {
        if (this.compiler)
        {
            this.compiler.stop();
        }
    }
}
