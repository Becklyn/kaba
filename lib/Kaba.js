const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CliConfig = require("./CliConfig");
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const fs = require("fs-extra");
const path = require("path");
const program = require("commander");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require("webpack");

/**
 * @typedef {{
 *      entries: Object<string, string>,
 *      includePaths: string[],
 *      outputPath: string,
 *      browserList: string[],
 *      cwd: string,
 * }} SassBuildConfig
 *
 * @typedef {{
 *      sass: SassBuildConfig,
 *      webpack: webpack.config,
 * }} KabaBuildConfig
 */

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
         * @type {CliConfig}
         */
        this.config = new CliConfig(program);


        /**
         * @private
         * @type {Object<string,string>}
         */
        this.entries = {};

        /**
         * @private
         * @type {Object<string, string>}
         */
        this.sassEntries = {};

        /**
         * @private
         * @type {string}
         */
        this.sassIncludePaths = [];


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
         * @type {?{names: string[], minChunks: number}}
         */
        this.sharedEntryConfig = null;

        /**
         * The webpack plugins
         *
         * @private
         * @type {Array}
         */
        this.plugins = [
            new webpack.DefinePlugin({
                "process.env.NODE_ENV": this.config.isDebug() ? '"development"' : '"production"',
            }),
            new FriendlyErrorsWebpackPlugin({
                clearConsole: this.config.isWatch(),
            }),
        ];


        // set defaults
        this
            .setOutputPath("build")
            .setPublicPath("/assets/")
            .cleanOutputDir(["js"])
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

            const source = mapping[name];

            // special handling for SCSS files
            if (/\.scss$/.test(source))
            {
                if (this.sassEntries[name] !== undefined)
                {
                    throw new Error(`Can't add scss entry named ${name}: an entry with this name already exists.`);
                }

                this.sassEntries[name] = source;
            }
            else
            {
                if (this.entries[name] !== undefined)
                {
                    throw new Error(`Can't add js entry named ${name}: an entry with this name already exists.`);
                }

                if (null !== this.sharedEntryConfig && -1 !== this.sharedEntryConfig.names.indexOf(name))
                {
                    throw new Error(`Can't add entry named ${name}: it is named like the extracted shared entries.`);
                }

                this.entries[name] = source;
            }
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

        this.plugins.push(
            new webpack.optimize.CommonsChunkPlugin(this.sharedEntryConfig),
        );

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
     * Returns the kaba config
     *
     * @return {KabaBuildConfig}
     */
    getKabaConfig ()
    {
        return {
            sass: this.buildSassConfig(),
            webpack: this.buildWebpackConfig(),
        };
    }


    /**
     * Builds the SCSS config
     *
     * @private
     * @return {*}
     */
    buildSassConfig ()
    {
        return {
            entries: this.sassEntries,
            includePaths: this.sassIncludePaths,
            outputPath: this.outputPath,
            browserList: this.browserList,
            cwd: this.cwd,
        };
    }


    /**
     * Builds the webpack config
     *
     * @private
     * @return {Object}
     */
    buildWebpackConfig ()
    {
        // clean output sub directories
        this.removeOutputSubDirectories.map(
            (dir) => fs.removeSync(path.join(this.outputPath, dir))
        );


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
            plugins: this.plugins,

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

        if (this.config.includeSourceMaps())
        {
            config.devtool = this.config.isDebug()
                ? "cheap-module-eval-source-map"
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
                    sourceMap: true,
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

        if (this.config.isBundleAnalyzerEnabled())
        {
            config.plugins.push(new BundleAnalyzerPlugin());
        }

        return config;
    }
}

module.exports = Kaba;
