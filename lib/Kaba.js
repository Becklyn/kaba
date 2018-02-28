const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CliConfig = require("./CliConfig");
const fs = require("fs-extra");
const path = require("path");
const program = require("commander");
const typeScriptErrorFormatter = require("@becklyn/typescript-error-formatter");

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
         * @type {{base : string, css : string, js : string}}
         */
        this.outputPaths = {};


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
        this.plugins = [];


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
     * @param {string} base
     * @param {string} cssSubDir
     * @param {string} jsSubDir
     * @return {Kaba}
     */
    setOutputPath (base, cssSubDir = "css", jsSubDir = "js")
    {
        this.outputPaths = {
            base: path.join(this.cwd, base),
            css: cssSubDir,
            js: jsSubDir,
        };
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
     * @return {Kaba}
     */
    disableModuleConcatenation ()
    {
        this.moduleConcatenationEnabled = false;
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
     * @return {SassBuildConfig}
     */
    buildSassConfig ()
    {
        return {
            entries: this.sassEntries,
            includePaths: this.sassIncludePaths,
            outputPath: path.join(this.outputPaths.base, this.outputPaths.css),
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
            (dir) => fs.removeSync(path.join(this.outputPaths.base, dir))
        );

        const babelLoader = {
            loader: "babel-loader?cacheDirectory",
            options: {
                babelrc: false,
                presets: [
                    require("kaba-babel-preset"),
                ],
            },
        };

        /** @type {webpack.options} config */
        const config = {
            // entry
            entry: this.entries,

            // mode
            mode: this.config.isDebug() ? "development" : "production",

            // output
            output: {
                path: path.join(this.outputPaths.base, this.outputPaths.js),
                filename: '[name].js',
                chunkFilename: '[name].chunk.js',
                publicPath: this.publicPath,
                pathinfo: !this.config.isDebug(),
            },

            // module
            module: {
                rules: [
                    // Babel
                    {
                        test: /\.jsx?$/,
                        use: [babelLoader],
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
                                loader: "ts-loader",
                                options: {
                                    context: this.cwd,
                                    configFile: path.join(this.libRoot, "tsconfig.json"),
                                    errorFormatter: (message, colors) => typeScriptErrorFormatter(message, colors, this.cwd),
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

            // optimization
            optimization: {
                concatenateModules: this.moduleConcatenationEnabled,
                splitChunks: {
                    chunks: "all",
                    minChunks: 1,
                    maxAsyncRequests: 5,
                    maxInitialRequests: 3,
                    name: true,
                    cacheGroups: {
                        default: {
                            minChunks: 2,
                            priority: -20,
                            reuseExistingChunk: true,
                        },
                        vendors: {
                            test: /[\\/]node_modules[\\/]/,
                            priority: -10,
                        },
                    },
                },
                runtimeChunk: "single",
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

        if (this.config.includeSourceMaps())
        {
            config.devtool = this.config.isDebug()
                ? "cheap-module-eval-source-map"
                : "hidden-source-map";
        }

        if (this.config.isLint() || this.config.isFix())
        {
            config.module.rules.push({
                enforce: "pre",
                test: /\.jsx?$/,
                exclude: /node_modules|vendor/,
                loader: "eslint-loader",
                options: {
                    cache: true,
                    configFile: path.join(this.libRoot, ".eslintrc.yml"),
                    fix: this.config.isFix(),
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
