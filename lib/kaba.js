const Config = require("./config");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const fs = require("fs-extra");
const path = require("path");
const postCssReporter = require("postcss-reporter");
const postCssScssSyntax = require("postcss-scss");
const program = require("commander");
const stylelint = require("stylelint");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require("webpack");


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
         * @type {Config}
         */
        this.config = new Config(program);


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
         * @type {string[]}
         */
        this.removeOutputSubDirectories = [];


        /**
         * @private
         * @type {string[]}
         */
        this.sassIncludePaths = [];


        /**
         * @private
         * @type {?{names: string[], minChunks: number}}
         */
        this.sharedEntryConfig = null;


        // set defaults
        this
            .setOutputPath("build")
            .setPublicPath("/assets/")
            .cleanOutputDir(["css", "js"])
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
        for (const name in mapping)
        {
            if (!mapping.hasOwnProperty(name))
            {
                continue;
            }

            if (this.entries[name] !== undefined)
            {
                throw new Error(`Can't add entry named ${name}: an entry with this name already exists.`);
            }

            if (null !== this.sharedEntryConfig && -1 !== this.sharedEntryConfig.names.indexOf(name))
            {
                throw new Error(`Can't add entry named ${name}: it is named like the extracted shared entries.`);
            }

            this.entries[name] = mapping[name];
        }

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
    setExternals (externals)
    {
        this.externals = externals;
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
     * @param {string[]} vendorFiles
     * @param {string} vendorName
     * @param {string|null} runtimeName
     * @return {Kaba}
     */
    extractSharedEntry (vendorFiles = [], vendorName = "vendor", runtimeName = "runtime")
    {
        if (null === vendorName)
        {
            throw new Error("extractSharedLibraries() failed: vendorName can not be null.");
        }

        if (this.sharedEntryConfig !== null)
        {
            throw new Error("extractSharedLibraries() can only be called once: only one vendor entry can be created.");
        }

        if (this.entries[vendorName] !== undefined)
        {
            throw new Error("Cannot extract shared entry: there already is a regular entry with the same name as the vendor name.");
        }

        if (runtimeName !== null && this.entries[runtimeName] !== undefined)
        {
            throw new Error("Cannot extract shared entry: there already is a regular entry with the same name as the runtime name.");
        }

        const names = [vendorName];

        if (null !== runtimeName)
        {
            names.push(runtimeName);
        }

        // first add entry, as it checks the name for conflicts with the shared entry config name
        if (vendorFiles.length > 0)
        {
            this.addEntries({
                [vendorName]: vendorFiles,
            });
        }

        this.sharedEntryConfig = {
            names: names,
            minChunks: 3,
        };

        return this;
    }


    /**
     * Enables cleaning the output dir before the build
     *
     * @param {string[]} subDirectories
     * @return {Kaba}
     */
    cleanOutputDir (subDirectories)
    {
        this.removeOutputSubDirectories = subDirectories;
        return this;
    }


    /**
     * Adds `node_modules` to the include dir of sass.
     *
     * @return {Kaba}
     */
    enableSassNodeModulesIncludePaths ()
    {
        this.sassIncludePaths = [
            path.join(this.cwd, "node_modules"),
        ];
        return this;
    }


    /**
     * Returns the built webpack config
     *
     * @return {Object}
     */
    getWebpackConfig ()
    {
        // clean output sub directories
        this.removeOutputSubDirectories.map(
            (dir) => fs.removeSync(path.join(this.outputPath, dir))
        );

        const stylelintLoader = [];

        if (this.config.isLint())
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
                chunkFilename: 'chunk.[name].js',
                publicPath: this.publicPath,
                pathinfo: !this.config.isDebug(),
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
                        use: [
                            // run TypeScript through Babel, so that ES5 compatibility is ensured
                            {
                                loader: "babel-loader?cacheDirectory",
                                options: {
                                    babelrc: false,
                                    presets: [
                                        require("kaba-babel-preset"),
                                    ],
                                },
                            },
                            {
                                loader: "awesome-typescript-loader",
                                query: {
                                    configFileName: path.join(this.libRoot, "tsconfig.json"),
                                },
                            },
                        ],
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
                                        minimize: !this.config.isDebug(),
                                        sourceMap: this.config.includeSourceMaps(),
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
                                        sourceMap: this.config.includeSourceMaps(),
                                    },
                                },
                                {
                                    loader: "sass-loader",
                                    options: {
                                        outputStyle: "compact",
                                        sourceMapEmbed: this.config.includeSourceMaps(),
                                        includePaths: this.sassIncludePaths,
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
            stats: {
                // hide children information (like from the ExtractTextPlugin)
                children: false,
                // errors are shown through the FriendlyErrorsWebpackPlugin instead
                errors: false,
            },

            // devServer

            // plugins
            plugins: [
                new webpack.DefinePlugin({
                    "process.env.NODE_ENV": this.config.isDebug() ? '"development"' : '"production"',
                }),
                new ExtractTextPlugin({
                    filename: "[name].css",
                }),
                new FriendlyErrorsWebpackPlugin({
                    clearConsole: this.config.isWatch(),
                }),
            ],

            // watch
            watch: this.config.isWatch(),

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

        if (this.config.isDebug() || this.config.includeSourceMaps())
        {
            config.devtool = this.config.isDebug()
                ? "inline-source-map"
                : "hidden-source-map";
        }
        else
        {
            config.plugins.push(
                new UglifyJsPlugin({
                    uglifyOptions: {
                        warnings: false,
                        //eslint-disable-next-line camelcase
                        drop_console: false,
                    },
                    parallel: true,
                    extractComments: true,
                    sourceMap: this.config.isDebug(),
                }),
            );
        }

        if (this.config.isLint())
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

        if (null !== this.sharedEntryConfig)
        {
            config.plugins.push(
                new webpack.optimize.CommonsChunkPlugin(this.sharedEntryConfig),
            );
        }

        return config;
    }
}

module.exports = Kaba;
