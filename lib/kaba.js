const ExtractTextPlugin = require("extract-text-webpack-plugin");
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const cli = require("../cli/cli");
const fs = require("fs-extra");
const path = require("path");
const postCssReporter = require("postcss-reporter");
const postCssScssSyntax = require("postcss-scss");
const stylelint = require("stylelint");
const webpack = require("webpack");
const xtend = require("xtend");


/**
 * Main Kaba class
 */
class Kaba
{
    /**
     *
     */
    constructor ()
    {
        /**
         * @private
         * @type {string}
         */
        this.cwd = process.cwd();

        /**
         * @private
         * @†ype {string}
         */
        this.libRoot = path.dirname(__dirname);

        /**
         * @private
         * @type {Object<string,string>}
         */
        this.entries = {};

        /**
         * @private
         * @type {string}
         */
        this.outputPath = "";

        /**
         * @private
         * @type {string}
         */
        this.publicPath = "";

        /**
         * @private
         * @type {Object<string,string>}
         */
        this.externals = {};

        /**
         * @private
         * @type {string[]}
         */
        this.browserList = [];

        /**
         * @private
         * @type {boolean}
         * @deprecated
         */
        this.moduleConcatenationEnabled = true;

        /**
         * @private
         * @type {?null}
         */
        this.sharedVendorEntryName = null;

        /**
         * @private
         * @type {boolean}
         */
        this.shouldCleanOutputDir = false;


        // set defaults
        this
            .setOutputPath("asset-artifacts/")
            .setPublicPath("/assets/")
            .addExternals({
                jquery: "window.jQuery",
                routing: "window.Routing",
            })
            .setBrowserList(["last 2 versions", "IE 11"])
        ;
    }


    /**
     * Adds an entry
     *
     * @param {Object<string,string>} mapping
     * @return {Kaba}
     */
    addEntries (mapping)
    {
        this.entries = xtend(this.entries, mapping);
        return this;
    }


    /**
     * Sets the output path
     *
     * @param {string} outputPath
     * @return {Kaba}
     */
    setOutputPath (outputPath)
    {
        this.outputPath = path.join(this.cwd, outputPath);
        return this;
    }


    /**
     * Sets the relative public path (for automatic imports)
     *
     * @param {string} publicPath relative to the cwd
     * @return {Kaba}
     */
    setPublicPath (publicPath)
    {
        this.publicPath = publicPath;
        return this;
    }

    /**
     *
     * @param {Object<string,string>} externals
     * @return {Kaba}
     */
    addExternals (externals)
    {
        this.externals = xtend(this.externals, externals);
        return this;
    }

    /**
     * Sets the browser list
     *
     * @param {string[]} list
     * @return {Kaba}
     */
    setBrowserList (list)
    {
        this.browserList = list;
        return this;
    }


    /**
     * Disabled module concatenation
     *
     * @deprecated will be removed, as soon as webpack is updated to v4
     * @return {Kaba}
     */
    disableModuleConcatenation ()
    {
        this.moduleConcatenationEnabled = false;
        return this;
    }


    /**
     * Creates a shared vendor entry name
     *
     * @param {string[]} files
     * @param {string} name
     * @return {Kaba}
     */
    createSharedVendorEntry (files, name = "vendor")
    {
        if (this.sharedVendorEntryName !== null)
        {
            throw new Error("createSharedVendorEntry() can only be called once: only one shared entry can be created.");
        }

        if (this.entries[name] !== undefined)
        {
            throw new Error("Cannot creatae shared vendor entry: there already is a regular entry with the same name.");
        }

        this.sharedVendorEntryName = name;
        this.addEntries({
            [name]: files,
        });
        return this;
    }


    /**
     * Enables cleaning the output dir before the build
     * 
     * @return {Kaba}
     */
    cleanOutputDir ()
    {
        this.shouldCleanOutputDir = true;
        return this;
    }


    /**
     * Returns the built webpack config
     *
     * @return {Object}
     */
    getWebpackConfig ()
    {
        if (this.shouldCleanOutputDir)
        {
            fs.removeSync(this.outputPath);
        }

        const stylelintLoader = [];

        if (cli.isLint())
        {
            stylelintLoader.push({
                loader: "postcss-loader",
                options: {
                    syntax: postCssScssSyntax,
                    plugins: [
                        stylelint({
                            configFile: path.join(this.libRoot, ".stylelintrc.yml"),
                        }),
                        postCssReporter({
                            clearMessages: true,
                        }),
                    ],
                },
            });
        }

        /** @type {webpack.options} config */
        const config = {
            // entry
            entry: this.entries,

            // output
            output: {
                path: this.outputPath,
                filename: '[name].js',
                publicPath: this.publicPath,
                pathinfo: !cli.isDebug(),
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
                    // TypeScript
                    {
                        test: /\.tsx?$/,
                        loader: "awesome-typescript-loader",
                        query: {
                            configFileName: path.join(this.libRoot, "tsconfig.json"),
                        },
                    },
                    // SCSS
                    {
                        test: /\.scss$/,
                        use: ExtractTextPlugin.extract({
                            use: [
                                {
                                    loader: "css-loader",
                                    options: {
                                        url: false,
                                        import: false,
                                        modules: false,
                                        minimize: !cli.isDebug(),
                                        sourceMap: cli.includeSourceMaps(),
                                    },
                                },
                                {
                                    loader: "postcss-loader",
                                    options: {
                                        plugins: [
                                            require("autoprefixer")({
                                                browsers: this.browserList,
                                            }),
                                        ],
                                        sourceMap: cli.includeSourceMaps(),
                                    },
                                },
                                {
                                    loader: "sass-loader",
                                    options: {
                                        outputStyle: "compact",
                                        sourceMapEmbed: cli.includeSourceMaps(),
                                    },
                                },
                            ].concat(stylelintLoader),
                        }),
                    },
                ],
            },

            // resolve
            resolve: {
                extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
                modules: [
                    path.join(this.cwd, "node_modules"),
                    path.join(this.libRoot, "node_modules"),
                ],
            },

            // performance

            // context
            context: this.cwd,

            // target
            target: "web",

            // externals
            externals: this.externals,

            // stats
            stats: "errors-only",

            // devServer

            // plugins
            plugins: [
                new ExtractTextPlugin({
                    filename: "[name].css",
                }),
                new FriendlyErrorsWebpackPlugin(),
            ],

            // watch
            watch: cli.isWatch(),

            // node
            // don't automatically polyfill certain node libraries
            // as we don't care about these implementations and they just add weight
            node: false,
        };

        // @deprecated
        // in webpack 4 this will always be enabled
        if (this.moduleConcatenationEnabled)
        {
            config.plugins.push(
                new webpack.optimize.ModuleConcatenationPlugin(),
            );
        }

        if (cli.isDebug() || cli.includeSourceMaps())
        {
            config.devtool = cli.isDebug()
                ? "inline-source-map"
                : "hidden-source-map";
        }
        else
        {
            config.plugins.push(
                new webpack.optimize.UglifyJsPlugin({
                    compress: {
                        warnings: false,
                        drop_console: false,
                    },
                    extractComments: true,
                    sourceMap: cli,
                })
            );
        }

        if (cli.isLint())
        {
            config.module.rules.push({
                enforce: "pre",
                test: /\.jsx?$/,
                exclude: /node_modules|vendor/,
                loader: "eslint-loader",
                options: {
                    cache: true,
                    configFile: path.join(this.libRoot, ".eslintrc.yml"),
                    parser: "babel-eslint",
                },
            });
        }

        if (null !== this.sharedVendorEntryName)
        {
            config.plugins.push(
                new webpack.optimize.CommonsChunkPlugin({
                    name: this.sharedVendorEntryName,
                    minChunks: Infinity,
                })
            );
        }

        return config;
    }
}

module.exports = Kaba;
