const browserify = require("browserify");
const chalk = require("chalk");
const fileWriter = require("../../lib/file-writer");
const glob = require("glob");
const globalsTransform = require("../../browserify/globals-transform");
const Logger = require("../../lib/logger");
const path = require("path");
const StreamHelper = require("../../lib/stream-helper");
const watchify = require("watchify");
const presetES2015 = require("babel-preset-es2015");

const minify = require("./minify");
const lint = require("./lint");


/**
 *
 */
module.exports = class JsDirectoryTask
{
    /**
     * @param {string} srcDir
     * @param {JsTaskConfig} config
     */
    constructor (srcDir, config)
    {
        /**
         * @private
         * @type {JsTaskConfig}
         */
        this.config = config;

        /**
         * @private
         * @type {string}
         */
        this.srcDir = srcDir;


        /**
         * The input glob with which the files are matched
         *
         * @private
         * @type {string}
         */
        this.inputFilesGlob = `${srcDir}/*.js`;

        /**
         * @private
         * @type {string}
         */
        this.outputDir = path.resolve(this.srcDir, config.output);

        /**
         * @private
         * @type {Logger}
         */
        this.logger = new Logger("JS", "blue", srcDir);
    }


    /**
     * Runs the task
     *
     * @param {Boolean} debug Flag, whether the task should run in debug mode
     */
    run (debug)
    {
        this.compileProject(debug);
    }


    /**
     *
     * @param {boolean} debug
     */
    compileProject (debug)
    {
        glob(this.inputFilesGlob,
            (err, files) => {
                files.forEach(
                    (file) => {
                        console.time("build");

                        // create browserify instance
                        const browserifyInstance = browserify({
                            cache: {},
                            packageCache: {},
                            entries: file,
                            debug: debug,
                            fullPaths: debug,
                        });

                        // load plugins + presets
                        const babelPresets = [presetES2015];
                        const babelPlugins = [];

                        if (this.config.react || this.config.preact)
                        {
                            babelPresets.push("react");
                        }

                        if (this.config.preact)
                        {
                            babelPlugins.push(["transform-react-jsx", {pragma: "h"}]);
                        }


                        browserifyInstance.transform("babelify", {
                            global: true,
                            presets: babelPresets,
                            plugins: babelPlugins,
                        });
                        browserifyInstance.transform(globalsTransform, {
                            global: true,
                            globals: this.config.externals,
                        });

                        // register user transforms
                        this.config.transforms
                            .forEach((transformConfigs) => browserifyInstance.transform(...transformConfigs));

                        // register event listeners
                        browserifyInstance
                            .on("file", (file) => this.logger.log("Build: " + file));

                        // register debug modes
                        if (debug)
                        {
                            // add watchify as plugin
                            browserifyInstance.plugin(watchify);

                            // register event listener for linter and update
                            browserifyInstance
                                .on("update", () => this.buildFromBrowserify(browserifyInstance, file, debug))
                                .on("file", (file) => lint(file, this.srcDir, this.config));
                        }

                        // if not debug, build from the browserify instance
                        this.buildFromBrowserify(browserifyInstance, file, debug);
                    }
                );
            }
        );
    }

    /**
     * Builds the file from the given browserify instance
     *
     * @param {browserify} browserifyInstance
     * @param {string} file
     * @param {boolean} debug
     */
    buildFromBrowserify (browserifyInstance, file, debug)
    {
        StreamHelper.readStream(browserifyInstance.bundle())
            .then(
                (code) => {

                    if (!debug)
                    {
                        code = minify(code);
                    }

                    if (null !== code)
                    {
                        fileWriter(this.generateOutputFileName(file), code);
                    }
                }
            )
            .catch(
                (error) => this.logger.log(chalk.red(`ERROR: ${error.message}`))
            );
    }


    /**
     * Generates the output file name
     * @param {string} file
     * @returns {string}
     */
    generateOutputFileName (file)
    {
        return path.join(
            this.outputDir,
            path.relative(this.srcDir, file)
        );
    }
};
