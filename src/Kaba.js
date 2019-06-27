const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const kabaBabelPreset = require("kaba-babel-preset");
const {blue, red, yellow} = require("kleur");
const fs = require("fs-extra");
const path = require("path");
const {ProvidePlugin} = require("webpack");
const TerserPlugin = require('terser-webpack-plugin');
const typeScriptErrorFormatter = require("@becklyn/typescript-error-formatter");

/**
 * @typedef {{
 *      entries: Object<string, string>,
 *      includePaths: string[],
 *      outputPath: string,
 *      cwd: string,
 * }} SassBuildConfig
 *
 * @typedef {{
 *     config: webpack.Configuration,
 *     module: true,
 * }} ModularizedWebpackConfig
 *
 * @typedef {{
 *      sass: SassBuildConfig,
 *      js: {
 *          javaScriptDependenciesFileName: string,
 *          webpack: ModularizedWebpackConfig[],
 *          customTypeScriptConfig: string|null,
 *      },
 *      cwd: string,
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
         * @type {Object<string,string>}
         */
        this.jsEntries = {};

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
         * @type {boolean}
         */
        this.moduleConcatenationEnabled = false;

        /**
         * The webpack plugins
         *
         * @private
         * @type {Array}
         */
        this.plugins = [
            new CleanWebpackPlugin(),
            new ProvidePlugin({
                h: ["preact", "h"],
            }),
        ];

        /**
         * @private
         * @type {string}
         */
        this.javaScriptDependenciesFileName = "_dependencies";

        /**
         * @private
         * @type {boolean}
         */
        this.splitChunks = true;

        /**
         * @private
         * @type {boolean}
         */
        this.hashFileNames = true;

        /**
         * @private
         * @type {?string}
         */
        this.customTypeScriptConfig = null;


        // set defaults
        this
            .setOutputPath("build")
            .setPublicPath("/assets/")
        ;
    }


    /**
     * Adds an entry
     *
     * @deprecated
     * @param {Object<string,string>} mapping
     * @return {Kaba}
     */
    addEntries (mapping)
    {
        Object.keys(mapping).forEach(
            name =>
            {
                const source = mapping[name];
                const entry = {
                    [name]: source,
                };

                if (/\.scss$/.test(source))
                {
                    this.addSassEntries(entry);
                }
                else
                {
                    this.addJsEntries(entry);
                }
            }
        );

        return this;
    }


    /**
     * Adds JS entries
     *
     * @param {Object<string,string>} mapping
     * @return {Kaba}
     */
    addJavaScriptEntries (mapping)
    {
        this.addEntriesToList(mapping, this.jsEntries, "js");
        return this;
    }


    /**
     * Adds Sass entries
     *
     * @param {Object<string,string>} mapping
     * @return {Kaba}
     */
    addSassEntries (mapping)
    {
        try
        {
            require("kaba-scss");
        }
        catch (e)
        {
            console.log(`${red("ERROR")} It seems that ${yellow("kaba-scss")} is not installed. Install it with ${blue("npm install -D kaba-scss")}`);
            process.exit(1);
        }

        this.addEntriesToList(mapping, this.sassEntries, "sass");
        return this;
    }


    /**
     * Adds items from a mapping to list
     *
     * @private
     * @param {Object<string,string>} mapping
     * @param {Object<string,string>} list
     * @param {string} type
     */
    addEntriesToList (mapping, list, type)
    {
        Object.keys(mapping).forEach(
            name =>
            {
                let source = mapping[name];

                if (!/^[./]/.test(source))
                {
                    source = `./${source}`;
                }

                if (list[name] !== undefined)
                {
                    throw new Error(`Can't add ${type} entry named ${name}: an entry with this name already exists.`);
                }

                list[name] = source;
            }
        );
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
     * Disables module concatenation
     *
     * @return {Kaba}
     */
    disableModuleConcatenation ()
    {
        this.moduleConcatenationEnabled = false;
        return this;
    }


    /**
     * Enables module concatenation
     *
     * @return {Kaba}
     */
    enableModuleConcatenation ()
    {
        this.moduleConcatenationEnabled = true;
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
     * Sets the file name of the javascript dependencies file
     *
     * @param {string} name
     * @return {Kaba}
     */
    setJavaScriptDependenciesName (name)
    {
        this.javaScriptDependenciesFileName = name;
        return this;
    }


    /**
     * Disables chunk splitting
     *
     * @returns {Kaba}
     */
    disableChunkSplitting ()
    {
        this.splitChunks = false;
        return this;
    }


    /**
     * Disables chunk hashes in file names
     *
     * @returns {Kaba}
     */
    disableFileNameHashing ()
    {
        this.hashFileNames = false;
        return this;
    }


    /**
     * Returns the kaba config
     *
     * @internal
     * @private
     * @param {CliConfig} cliConfig
     * @return {KabaBuildConfig}
     */
    getBuildConfig (cliConfig)
    {
        return {
            sass: this.buildSassConfig(),
            js: {
                javaScriptDependenciesFileName: this.javaScriptDependenciesFileName,
                webpack: [
                    {
                        config: this.buildWebpackConfig(cliConfig, false),
                        module: false,
                    },
                    {
                        config: this.buildWebpackConfig(cliConfig, true),
                        module: true,
                    },
                ],
                customTypeScriptConfig: this.customTypeScriptConfig,
            },
            cwd: this.cwd,
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
            cwd: this.cwd,
        };
    }


    /**
     * Builds the webpack config
     *
     * @private
     * @param {CliConfig} cliConfig
     * @return {webpack.Configuration}
     */
    buildWebpackConfig (cliConfig)
    {
        const babelLoader = {
            loader: "babel-loader?cacheDirectory",
            options: {
                babelrc: false,
                presets: [
                    kabaBabelPreset,
                ],
            },
        };

        let customTypeScriptConfig = path.join(this.cwd, "tsconfig.json");
        if (fs.pathExistsSync(customTypeScriptConfig))
        {
            this.customTypeScriptConfig = customTypeScriptConfig;
        }

        /** @type {webpack.Configuration} config */
        const config = {
            // entry
            entry: this.jsEntries,

            // mode
            mode: cliConfig.isDebug() ? "development" : "production",

            // output
            output: {
                path: path.join(this.outputPaths.base, this.outputPaths.js),
                filename: this.hashFileNames ? '[name].[chunkhash].js' : '[name].js',
                publicPath: this.publicPath,
                pathinfo: !cliConfig.isDebug(),
            },

            // module
            module: {
                rules: [
                    // TypeScript
                    {
                        test: /\.tsx?$/,
                        use: [
                            babelLoader,
                            {
                                loader: "ts-loader",
                                options: {
                                    context: this.cwd,
                                    configFile: this.customTypeScriptConfig || path.join(this.libRoot, "tsconfig.json"),
                                    errorFormatter: (message, colors) => typeScriptErrorFormatter(message, colors, this.cwd),
                                },
                            },
                        ],
                    },

                    // Babel
                    {
                        test: /\.m?jsx?$/,
                        use: [babelLoader],
                    },

                    // content files
                    {
                        test: /\.(svg|txt)$/,
                        loader: "raw-loader",
                    },
                ],
            },

            // resolve
            resolve: {
                // TS is potentially added below
                extensions: [
                    ".mjs",
                    ".mjsx",
                    ".js",
                    ".jsx",
                    ".ts",
                    ".tsx",
                    ".json",
                ],
            },

            // optimization
            optimization: {
                concatenateModules: this.moduleConcatenationEnabled,
                minimizer: [],
            },

            // performance

            // devtool (source maps)
            devtool: cliConfig.isDebug()
                ? "eval"
                : "hidden-source-map",

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
            },

            // devServer

            // plugins
            plugins: this.plugins,

            // watch
            watch: cliConfig.isWatch(),

            // node
            // don't automatically polyfill certain node libraries
            // as we don't care about these implementations and they just add weight
            node: false,
        };

        if (this.splitChunks)
        {
            config.optimization.splitChunks = {
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
            };

            config.optimization.runtimeChunk = "single";
        }

        if (!cliConfig.isDebug())
        {
            config.optimization.minimizer.push(new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: true,
                terserOptions: {
                    ecma: 5,
                },
            }));
        }

        if (cliConfig.isLint() || cliConfig.isFix())
        {
            config.module.rules.push({
                enforce: "pre",
                test: /\.m?jsx?$/,
                exclude: /node_modules|tests|vendor/,
                loader: "eslint-loader",
                options: {
                    cache: true,
                    configFile: path.join(this.libRoot, ".eslintrc.yml"),
                    fix: cliConfig.isFix(),
                    parser: "babel-eslint",
                },
            });
        }

        if (cliConfig.isBundleAnalyzerEnabled())
        {
            try
            {
                const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
                config.plugins.push(new BundleAnalyzerPlugin());
            }
            catch (e)
            {
                console.log("");

                if (/Cannot find module 'webpack-bundle-analyzer'/.test(e.message))
                {
                    console.log(red("You need to manually install the analyzer plugin:"));
                    console.log(red("    npm i webpack-bundle-analyzer"));
                }
                else
                {
                    console.log(red(e.message));
                }

                process.exit(1);
            }

        }

        return config;
    }
}

module.exports = Kaba;
