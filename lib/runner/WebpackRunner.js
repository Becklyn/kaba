const fs = require("fs-extra");
const glob = require("glob");
const kleur = require("kleur");
const Logger = require("../Logger");
const path = require("path");
const webpack = require("webpack");


class WebpackRunner
{
    /**
     * Constructs a new runner
     * @param {KabaBuildConfig} buildConfig
     * @param {CliConfig} cliConfig
     * @param {string} workingDirectory
     */
    constructor (buildConfig, cliConfig, workingDirectory)
    {
        /**
         * @private
         * @type {KabaBuildConfig}
         */
        this.buildConfig = buildConfig;

        /**
         * @private
         * @type {webpack.Configuration}
         */
        this.webpackConfig = buildConfig.js.webpack;

        /**
         * @private
         * @type {CliConfig}
         */
        this.cliConfig = cliConfig;

        /**
         * @private
         * @type {string}
         */
        this.workingDirectory = workingDirectory;

        /**
         * @private
         * @type {Logger}
         */
        this.logger = new Logger(kleur.bgCyan.black(" webpack "));

        /**
         * @private
         * @type {?*}
         */
        this.watcher = null;

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
        if (Object.keys(this.webpackConfig.entry).length === 0)
        {
            return true;
        }

        return new Promise(
            (resolve) =>
            {
                this.logger.log("Launching webpack...");
                const start = process.hrtime();

                const compiler = webpack(this.webpackConfig);

                if (null != this.buildConfig.js.customTypeScriptConfig)
                {
                    this.logger.log(`Using custom TypeScript config: ${kleur.yellow(path.relative(this.workingDirectory, this.buildConfig.js.customTypeScriptConfig))}`);
                }

                if (this.webpackConfig.watch)
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
     * @return {boolean} whether the compilation had no errors
     */
    onCompilationFinished (error, stats)
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

        // remove obsolete files
        // this will also remove the dependencies file, so we need to write it afterwards
        this.removeObsoleteFiles(stats, this.buildConfig.js.webpack.output.path);

        // write dependencies file
        this.writeDependenciesFile(stats);

        return !stats.hasErrors();
    }


    /**
     * Stops the runner
     */
    stop ()
    {
        if (null !== this.resolveCallback)
        {
            this.watcher.close(
                () => {
                    this.resolveCallback(true);
                }
            );
        }
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

        // ensure that output path exists
        fs.ensureDirSync(this.webpackConfig.output.path);

        const fileName = `${this.buildConfig.js.javaScriptDependenciesFileName}.json`;
        fs.writeFileSync(
            path.join(this.webpackConfig.output.path, fileName),
            JSON.stringify(entrypoints),
            "utf-8"
        );
        this.logger.log(`Entrypoint dependencies written to ${kleur.yellow(fileName)}`);
    }


    /**
     * Removes all obsolete files
     *
     * @private
     * @param {Stats} stats
     * @param {string} outputPath
     */
    removeObsoleteFiles (stats, outputPath)
    {
        outputPath = outputPath.replace(/\/*$/, "");
        const usedFiles = this.getCurrentFiles(stats);
        const files = glob.sync(`${outputPath}/*`, {
            dot: false,
            absolute: true,
        });

        files.forEach(
            file => {
                const baseName = path.basename(file);
                const licenseFile = baseName.replace(/\.LICENSE/, "");

                if (usedFiles[baseName] !== true && usedFiles[licenseFile] !== true)
                {
                    fs.removeSync(file);
                }
            }
        );
    }


    /**
     * Returns the current files
     *
     * @private
     * @param {Stats} stats
     */
    getCurrentFiles (stats)
    {
        const usedFiles = {};

        for (const mapEntry of stats.compilation.entrypoints.entries())
        {
            const entry = mapEntry[1];
            entry.chunks.forEach(
                chunk => {
                    chunk.files.forEach(
                        file => {
                            usedFiles[file] = true;
                        }
                    );
                }
            );
        }

        return usedFiles;
    }
}

module.exports = WebpackRunner;
