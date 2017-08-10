const CheckerPlugin = require("awesome-typescript-loader").CheckerPlugin;
const CLIEngine = require("eslint").CLIEngine;
const CompilationStartNotifier = require("./CompilationStartNotifier");
const chalk = require("chalk");
const filePathMatcher = require("../../lib/file-path-matcher");
const glob = require("glob");
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
        this.inputFilesGlob = `${srcDir}/*.{js,jsx,ts,tsx}`;

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


    //region Compilation
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
                                test: /\.jsx?$/,
                                loader: "babel-loader?cacheDirectory",
                                options: {
                                    babelrc: false,
                                    presets: [
                                        require("kaba-babel-preset"),
                                    ],
                                },
                            },
                            {
                                test: /\.tsx?$/,
                                loader: "awesome-typescript-loader",
                                query: {
                                    configFileName: path.resolve(__dirname, `../../../tsconfig.json`),
                                },
                            },
                        ],
                    },

                    // resolve
                    resolve: {
                        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],

                        modules: [
                            `${process.cwd()}/node_modules`,
                            this.srcDir,
                        ],
                    },

                    resolveLoader: {
                        modules: [
                            `${process.cwd()}/node_modules`,
                            `${__dirname}/../../../node_modules`,
                        ],
                    },

                    // plugins
                    plugins: [
                        new CompilationStartNotifier(this.logger),
                        new CheckerPlugin(),
                        new webpack.optimize.ModuleConcatenationPlugin(),
                    ],

                    // devtool
                    devtool: this.config.debug ? "inline-source-map" : (this.config.sourceMaps ? "hidden-source-map" : false),

                    // target
                    target: "web",

                    // externals
                    externals: this.config.externals,

                    // don't automatically polyfill certain node libraries
                    // as we don't care about these implementations and they just add weight
                    node: false,
                };

                // append custom loaders
                webpackConfig.module.rules = webpackConfig.module.rules.concat(this.config.loaders);

                if (!this.config.debug)
                {
                    webpackConfig.plugins.push(
                        new webpack.optimize.UglifyJsPlugin({
                            compress: {
                                warnings: false,
                                drop_console: false,
                            },
                            extractComments: true,
                            sourceMap: this.config.debug || this.config.sourceMaps,
                        })
                    );

                    webpackConfig.plugins.push(
                        new webpack.DefinePlugin({
                            'process.env.NODE_ENV': '"production"',
                        })
                    );
                }

                if (this.config.lint)
                {
                    webpackConfig.module.rules.push({
                        enforce: "pre",
                        test: /\.jsx?$/,
                        exclude: /node_modules|vendor/,
                        loader: "eslint-loader",
                        options: {
                            presets: ["es2015"],
                            configFile: `${__dirname}/../../../.eslintrc.yml`,
                        },
                    });
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
                    const watcher = compiler.watch({
                            ignored: /node_modules/,
                        },
                        (err, stats) =>
                        {
                            if (err)
                            {
                                reject(err);
                                return;
                            }

                            this.logStats(stats);
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
    //endregion


    //region Linting
    /**
     * Lints the complete project
     *
     * @returns {Promise}
     */
    lint ()
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

                        const taskResults = files.map(
                            (file) => this.lintFile(file)
                        );

                        resolve(taskResults.includes(true));
                    }
                );
            }
        );
    }


    /**
     * Lints the given file
     *
     * @param {string} file
     * @return {boolean} whether there was a linting error
     */
    lintFile (file)
    {
        if (filePathMatcher(file, this.config.ignoreLintFor))
        {
            return false;
        }

        let esLintConfig = {
            configFile: __dirname + "/../../../.eslintrc.yml",
            ignore: false,
            ecmaFeatures: {}
        };

        // set specific options for different file extensions
        switch (path.extname(file))
        {
            case ".jsx":
                esLintConfig.ecmaFeatures.jsx = true;
                break;

            case ".js":
                // continue with linting
                break;

            default:
                // abort linting, as any other file extension is given
                return false;
        }

        let engine = new CLIEngine(esLintConfig);
        let formatter = engine.getFormatter();
        let report = engine.executeOnFiles([file]);

        if (report.errorCount || report.warningCount)
        {
            // make all paths relative
            report.results = report.results.map(
                (entry) =>
                {
                    entry.filePath = path.relative(process.cwd(), entry.filePath);
                    return entry;
                }
            );

            console.log(formatter(report.results));
        }

        return report.errorCount > 0;
    }
    //endregion


    /**
     * Logs the stats as given by webpack
     *
     * @private
     * @param {Stats} stats
     */
    logStats (stats)
    {
        this.logger.log("");

        this.logger.log(stats.toString({
            colors: true,
        }));

        this.logger.log("");
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
