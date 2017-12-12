const ExtractTextPlugin = require("extract-text-webpack-plugin");
const cli = require("../cli/cli");
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
     */
    setBrowserList (list)
    {
        this.browserList = list;
    }


    /**
     * Returns the built webpack config
     *
     * @return {Object}
     */
    getWebpackConfig ()
    {
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
            performance: {

            },

            // context
            context: this.cwd,

            // target
            target: "web",

            // externals
            externals: this.externals,

            // stats
            stats: "errors-only",

            // plugins
            plugins: [
                new ExtractTextPlugin({
                    filename: "[name].css",
                }),
            ],

            // watch
            watch: cli.isWatch(),

            // node
            // don't automatically polyfill certain node libraries
            // as we don't care about these implementations and they just add weight
            node: false,
        };

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
                    presets: ["es2015"],
                    configFile: path.join(this.libRoot, ".eslintrc.yml"),
                },
            });
        }

        return config;
    }
}

module.exports = Kaba;
