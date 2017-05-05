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
const webpack = require("webpack");

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
     * @param {BuildLogger} logger
     */
    constructor (srcDir, config, logger)
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
         * @type {BuildLogger}
         */
        this.logger = logger;
    }


    /**
     * Runs the task
     */
    run ()
    {
        this.compileProject();
    }


    /**
     * Compiles the complete project
     */
    compileProject ()
    {
        glob(this.inputFilesGlob,
            (err, files) => {
                files.forEach(
                    (file) => {
                        console.time("build");

                        const webpackConfig = {
                            // entry and context
                            entry: file,

                            // output
                            output: {
                                path: this.generateOutputDirectory(file),
                                filename: this.generateOutputFileName(file),
                            },

                            // module
                            module: {
                                rules: [
                                    // Babel
                                    {
                                        test: /\.js$/,
                                        exclude: /node_modules/,
                                        use: {
                                            loader: "babel-loader",
                                            options: {
                                                presets: ["env"],
                                            },
                                        },
                                    },
                                ],
                            },

                            // resolve
                            resolve: {
                                extensions: [".js", ".json", ".jsx"],
                            },

                            // plugins
                            plugins: [

                            ],

                            // devtool
                            devtool: this.config.debug ? "inline-source-map" : "hidden-source-map",

                            // target
                            target: "web",

                            // watch
                            watch: this.config.watch,
                            watchOptions: {
                                ignored: /node_modules/,
                            },

                            // externals
                            externals: this.config.externals,
                        };

                        if (!this.config.debug)
                        {
                            webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
                                compress: {
                                    warnings: false,
                                    drop_console: false,
                                },
                            }));
                        }

                        const compiler = webpack(webpackConfig);

                        // if (this.config.watch)
                        // {
                        //     compiler.watch({
                        //
                        //     }, (error, stats) => {
                        //         console.log(stats);
                        //     });
                        // }
                        //

                        compiler.run();

                        // // create browserify instance
                        // const browserifyInstance = browserify({
                        //     cache: {},
                        //     packageCache: {},
                        //     entries: file,
                        //     debug: this.config.debug,
                        //     fullPaths: this.config.debug,
                        //     comments: this.config.debug,
                        // });

                        // // load plugins + presets
                        // const babelPresets = [presetES2015];
                        // const babelPlugins = [];
                        //
                        // if (this.config.react || this.config.preact)
                        // {
                        //     babelPresets.push("react");
                        // }
                        //
                        // if (this.config.preact)
                        // {
                        //     babelPlugins.push(["transform-react-jsx", {pragma: "h"}]);
                        // }
                        //
                        // browserifyInstance.transform("babelify", {
                        //     global: true,
                        //     presets: babelPresets,
                        //     plugins: babelPlugins,
                        // });
                        //
                        // browserifyInstance.transform(globalsTransform, {
                        //     global: true,
                        //     globals: this.config.externals,
                        // });
                        //
                        // // register user transforms
                        // this.config.transforms
                        //     .forEach((transformConfigs) => browserifyInstance.transform(...transformConfigs));
                        //
                        // // register event listeners
                        // browserifyInstance
                        //     .on("file", (f) => this.logger.log(`Build: ${f}`));
                        //
                        // // whether to start a watcher
                        // if (this.config.watch)
                        // {
                        //     // add watchify as plugin
                        //     browserifyInstance.plugin(watchify);
                        //
                        //     // register event listener for linter and update
                        //     browserifyInstance
                        //         .on("update", () => this.buildFromBrowserify(browserifyInstance, file))
                        //         .on("file", (f) => lint(f, this.srcDir, this.config));
                        // }
                        //
                        // // if not debug, build from the browserify instance
                        // this.buildFromBrowserify(browserifyInstance, file);
                    }
                );
            }
        );
    }

    //
    // /**
    //  * Builds the file from the given browserify instance
    //  *
    //  * @param {browserify} browserifyInstance
    //  * @param {string} file
    //  */
    // buildFromBrowserify (browserifyInstance, file)
    // {
    //     StreamHelper.readStream(browserifyInstance.bundle())
    //         .then(
    //             (code) => {
    //
    //                 if (!this.config.debug)
    //                 {
    //                     code = minify(code);
    //                 }
    //
    //                 if (null !== code)
    //                 {
    //                     fileWriter(this.generateOutputFileName(file), code);
    //                 }
    //             }
    //         )
    //         .catch(
    //             (error) => this.logger.log(chalk.red(`ERROR: ${error.message}`))
    //         );
    // }


    /**
     * Generates the output file name
     * @param {string} file
     * @returns {string}
     */
    generateOutputDirectory (file)
    {
        return path.join(
            this.outputDir,
            path.dirname(path.relative(this.srcDir, file))
        );
    }

    /**
     * Generates the output file name
     *
     * @param {string} file
     * @returns {string}
     */
    generateOutputFileName (file)
    {
        return this.config.outputFileName(path.basename(file));
    }
};
