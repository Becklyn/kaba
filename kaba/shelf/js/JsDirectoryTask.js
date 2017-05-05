const chalk = require("chalk");
const glob = require("glob");
const lint = require("./lint");
const path = require("path");
const webpack = require("webpack");


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
     * Compiles the complete project
     *
     * @return {Promise}
     */
    compile ()
    {
        return new Promise(
            (resolve, reject) =>
            {
                glob(this.inputFilesGlob,
                    {
                        absolute: true,
                    },
                    (err, files) =>
                    {
                        if (err)
                        {
                            reject(err);
                            return;
                        }

                        const tasks = files.map(
                            (file) => this.compileFile(file)
                        );

                        Promise.all(tasks)
                            .then(resolve);
                    }
                );
            }
        );
    }



    /**
     * Compiles the given file
     *
     * @param {string} file
     * @returns {Promise}
     */
    compileFile (file)
    {
        return new Promise(
            (resolve, reject) =>
            {
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
                                        presets: ["es2015"],
                                        plugins: [
                                            [require("babel-plugin-transform-react-jsx"), {
                                                pragma: "h",
                                            }],
                                        ],
                                    },
                                },
                            },
                        ],
                    },

                    // resolve
                    resolve: {
                        extensions: [".js", ".json", ".jsx"],

                        modules: [
                            `${process.cwd()}/node_modules`,
                            this.srcDir,
                        ],
                    },

                    // plugins
                    plugins: [

                    ],

                    // devtool
                    devtool: this.config.debug ? "inline-source-map" : "hidden-source-map",

                    // target
                    target: "web",

                    // Watching
                    watchOptions: {
                        ignored: /node_modules/,
                    },

                    // externals
                    externals: this.config.externals,
                };

                if (!this.config.debug)
                {
                    webpackConfig.plugins.push(
                        new webpack.optimize.UglifyJsPlugin({
                            compress: {
                                warnings: false,
                                drop_console: true,
                            },
                        })
                    );

                    webpackConfig.plugins.push(
                        new webpack.DefinePlugin({
                            'process.env.NODE_ENV': '"production"',
                        })
                    );
                }

                const compiler = webpack(webpackConfig);

                if (!this.config.watch)
                {
                    compiler.run(
                        (err, stats) =>
                        {
                            if (err)
                            {
                                reject(err);
                                return;
                            }

                            this.logStats(stats);
                            resolve();
                        }
                    );
                }
                else
                {
                    const watcher = compiler.watch(
                        (err, stats) =>
                        {
                            if (err)
                            {
                                reject(err);
                                return;
                            }
                        }
                    );

                    process
                        .on("SIGINT", () => {
                            watcher.close(resolve);
                        });
                }
            }
        );
    }


    /**
     * Logs the stats as given by webpack
     *
     * @private
     * @param {Stats} stats
     */
    logStats (stats)
    {
        this.logger.log(stats.toString({
            colors: true,
        }));
    }


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
