const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CliConfig = require("./CliConfig");
const kabaBabelPreset = require("kaba-babel-preset");
const path = require("path");
const program = require("commander");
const TerserPlugin = require('terser-webpack-plugin');
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
 *      js: {
 *          javaScriptDependenciesFileName: string,
 *          webpack: webpack.Configuration,
 *      },
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
         * @type {string[]}
         */
        this.browserList = [];


        /**
         * @private
         * @type {boolean}
         */
        this.moduleConcatenationEnabled = true;


        /**
         * The webpack plugins
         *
         * @private
         * @type {Array}
         */
        this.plugins = [];


        /**
         * @private
         * @type {string}
         */
        this.javaScriptDependenciesFileName = "_dependencies";

        /**
         * @private
         * @type {{enabled: boolean, compileJs: boolean}}
         */
        this.typescript = {
            enabled: false,
            compileJs: false,
        };


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


        // set defaults
        this
            .setOutputPath("build")
            .setPublicPath("/assets/")
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
     * Enables compilation of JS files via TypeScript
     *
     * @param {boolean} compileJs whether the compile all JS via TypeScript
     * @returns {Kaba}
     */
    enableTypeScript (compileJs = false)
    {
        this.typescript = {
            enabled: true,
            compileJs: compileJs,
        };

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
     * @return {KabaBuildConfig}
     */
    getBuildConfig ()
    {
        return {
            sass: this.buildSassConfig(),
            js: {
                javaScriptDependenciesFileName: this.javaScriptDependenciesFileName,
                webpack: this.buildWebpackConfig(),
            },
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
     * @return {webpack.Configuration}
     */
    buildWebpackConfig ()
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

        /** @type {webpack.Configuration} config */
        const config = {
            // entry
            entry: this.jsEntries,

            // mode
            mode: this.config.isDebug() ? "development" : "production",

            // output
            output: {
                path: path.join(this.outputPaths.base, this.outputPaths.js),
                filename: this.hashFileNames ? '[name].[chunkhash].js' : '[name].js',
                publicPath: this.publicPath,
                pathinfo: !this.config.isDebug(),
            },

            // module
            module: {
                rules: [
                    // Babel + TS are added below

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
                extensions: [".js", ".jsx", ".json"],
                modules: [
                    path.join(this.cwd, "node_modules"),
                    path.join(this.libRoot, "node_modules"),
                ],
            },

            // optimization
            optimization: {
                concatenateModules: this.moduleConcatenationEnabled,
                minimizer: [],
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

        // add typescript support
        if (this.typescript.enabled)
        {
            // add extensions
            config.resolve.extensions.unshift(".tsx", ".ts");

            // add TypeScript loader
            config.module.rules.unshift({
                test: this.typescript.compileJs ? /\.[jt]sx?$/ : /\.tsx?$/,
                use: [
                    // run TypeScript through Babel, so that ES5 compatibility is ensured
                    babelLoader,
                    {
                        loader: "ts-loader",
                        options: {
                            context: this.cwd,
                            configFile: path.join(this.libRoot, "tsconfig.json"),
                            errorFormatter: (message, colors) => typeScriptErrorFormatter(message, colors, this.cwd),
                            compilerOptions: {
                                allowJs: this.useTypeScriptForJsFiles,
                                checkJs: this.useTypeScriptForJsFiles,
                            },
                        },
                    },
                ],
            });

            // add Babel, if JS is is not compiled via TS
            if (!this.typescript.compileJs)
            {
                config.module.rules.unshift({
                    test: /\.jsx?$/,
                    use: [babelLoader],
                });
            }
        }
        else
        {
            // add Babel
            config.module.rules.unshift({
                test: /\.jsx?$/,
                use: [babelLoader],
            });
        }

        if (!cliConfig.isDebug())
        {
            config.optimization.minimizer.push(new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: cliConfig.includeSourceMaps(),
                extractComments: !cliConfig.isDebug(),
                terserOptions: {
                    ecma: 5,
                    warnings: cliConfig.isDebug(),
                },
            }));
        }

        if (cliConfig.includeSourceMaps())
        {
            config.devtool = cliConfig.isDebug()
                ? "cheap-module-source-map"
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
