import {blue, red, yellow} from "kleur";
const path = require("path");
import * as webpack from "webpack";
import {DefinePlugin, ProvidePlugin} from "webpack";
const TerserPlugin = require('terser-webpack-plugin');
const typeScriptErrorFormatter = require("@becklyn/typescript-error-formatter");
import {kaba} from "./@types/kaba";
import CliConfig = kaba.CliConfig;
const kabaBabelPreset = require("kaba-babel-preset");


interface Entries
{
    [name: string]: string;
}

interface OutputPaths
{
    base: string;
    css: string;
    js: string;
}

interface Externals
{
    [name: string]: string;
}


/**
 * Main Kaba class
 */
export class Kaba
{
    private cwd: string;
    private libRoot: string;
    private jsEntries: Entries = {};
    private sassEntries: Entries = {};
    private sassIncludePaths: string[] = [];
    private outputPaths: OutputPaths = {
        base: "",
        css: "",
        js: "",
    };
    private publicPath: string = "/assets/app/js/";
    private externals: Externals = {};
    private moduleConcatenationEnabled: boolean = false;
    private plugins: webpack.Plugin[] = [];
    private javaScriptDependenciesFileName: string = "_dependencies";
    private splitChunks: boolean = true;
    private hashFileNames: boolean = true;
    private buildModern: boolean = true;


    /**
     *
     */
    public constructor ()
    {
        this.cwd = process.cwd();
        this.libRoot = path.dirname(__dirname);
        this.plugins = [
            new ProvidePlugin({
                h: ["preact", "h"],
            }),
        ];

        // set defaults
        this.setOutputPath("build");
    }


    /**
     * Adds JS entries
     */
    public addJavaScriptEntries (mapping: Entries): this
    {
        this.addEntriesToList(mapping, this.jsEntries, "js");
        return this;
    }


    /**
     * Adds Sass entries
     */
    public addSassEntries (mapping: Entries): this
    {
        this.addEntriesToList(mapping, this.sassEntries, "sass");
        return this;
    }


    /**
     * Adds items from a mapping to list
     */
    private addEntriesToList (mapping: Entries, list: Entries, type: string): void
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
            },
        );
    }


    /**
     * Sets the output path
     */
    public setOutputPath (base: string, cssSubDir: string = "css", jsSubDir: string = "js"): this
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
     */
    public setPublicPath (publicPath: string): this
    {
        this.publicPath = publicPath;
        return this;
    }


    /**
     * Sets the externally available instances
     */
    public setExternals (externals: Externals): this
    {
        this.externals = externals;
        return this;
    }


    /**
     * Disables module concatenation
     */
    public disableModuleConcatenation (): this
    {
        this.moduleConcatenationEnabled = false;
        return this;
    }


    /**
     * Enables module concatenation
     */
    public enableModuleConcatenation (): this
    {
        this.moduleConcatenationEnabled = true;
        return this;
    }


    /**
     * Adds `node_modules` to the include dir of sass.
     */
    public enableSassNodeModulesIncludePaths (): this
    {
        this.sassIncludePaths = [
            path.join(this.cwd, "node_modules"),
        ];
        return this;
    }


    /**
     * Sets the file name of the javascript dependencies file
     */
    public setJavaScriptDependenciesName (name: string): this
    {
        this.javaScriptDependenciesFileName = name;
        return this;
    }


    /**
     * Disables chunk splitting
     */
    public disableChunkSplitting (): this
    {
        this.splitChunks = false;
        return this;
    }


    /**
     * Disables chunk hashes in file names
     */
    public disableFileNameHashing (): this
    {
        this.hashFileNames = false;
        return this;
    }


    /**
     * Disables the modern build
     */
    public disableModernBuild (): this
    {
        this.buildModern = false;
        return this;
    }


    /**
     * Returns the kaba config
     *
     * @internal
     */
    public getBuildConfig (cliConfig: CliConfig): kaba.BuildConfig
    {
        let jsConfig: any = null;

        if (Object.keys(this.sassEntries).length)
        {
            try
            {
                require("kaba-scss");
            }
            catch (e)
            {
                if (-1 !== e.message.indexOf("Cannot find module 'node-sass'"))
                {
                    console.log(`${red("ERROR")} It seems that ${yellow("kaba-scss")} is not installed. Install it with ${blue("npm install -D kaba-scss")}`);
                }
                else
                {
                    console.log(`${red("ERROR")} while loading ${yellow("kaba-scss")}: ${e.message}`);

                    if (cliConfig.verbose)
                    {
                        console.error(e);
                    }
                }

                process.exit(1);
            }
        }


        if (Object.keys(this.jsEntries).length)
        {
            jsConfig = {
                common: this.buildWebpackCommon(cliConfig),
                module: this.buildModern
                    ? this.buildWebpackConfig(cliConfig, true)
                    : null,
                legacy: this.buildWebpackConfig(cliConfig, false),
                javaScriptDependenciesFileName: this.javaScriptDependenciesFileName,
            };
        }

        return {
            sass: {
                entries: this.sassEntries,
                includePaths: this.sassIncludePaths,
                outputPath: path.join(this.outputPaths.base, this.outputPaths.css),
                cwd: this.cwd,
            },
            js: jsConfig,
            cwd: this.cwd,
        };
    }


    /**
     * Builds the common webpack config, that is common between legacy & module
     */
    private buildWebpackCommon (cliConfig: kaba.CliConfig): Partial<webpack.Configuration>
    {
        const config: Partial<webpack.Configuration> = {
            // mode
            mode: cliConfig.debug ? "development" : "production",

            // output
            output: {
                path: path.join(this.outputPaths.base, this.outputPaths.js),
                filename: this.hashFileNames ? '[name].[chunkhash].js' : '[name].js',
                publicPath: this.publicPath,
                pathinfo: cliConfig.debug,
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

            // module
            module: {
                rules: [],
            },

            // optimization
            optimization: {
                concatenateModules: this.moduleConcatenationEnabled,
                minimizer: [],
            },

            // performance

            // devtool (source maps)
            devtool: cliConfig.debug
                ? "inline-cheap-source-map"
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
            watch: cliConfig.watch,

            // node
            // don't automatically polyfill certain node libraries
            // as we don't care about these implementations and they just add weight
            node: false,
        };

        if (this.splitChunks)
        {
            (config.optimization as any).splitChunks = {
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

            (config.optimization as any).runtimeChunk = "single";
        }

        if (!cliConfig.debug)
        {
            (config.optimization as any).minimizer.push(new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: true,
                extractComments: true,
                terserOptions: {
                    ecma: 5,
                },
            }));
        }

        if (cliConfig.openBundleAnalyzer)
        {
            try
            {
                const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
                (config.plugins as any[]).push(new BundleAnalyzerPlugin());
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


    /**
     * Builds the specialized webpack config for a legacy / module build
     */
    private buildWebpackConfig (cliConfig: kaba.CliConfig, isModule: boolean): Partial<webpack.Configuration>
    {
        const babelLoader = {
            loader: "babel-loader?cacheDirectory",
            options: {
                babelrc: false,
                presets: [
                    [isModule ? kabaBabelPreset.modern : kabaBabelPreset.legacy],
                ],
            },
        };

        let entries = this.jsEntries;

        if (isModule)
        {
            entries = {};
            Object.keys(this.jsEntries).forEach(
                entry =>
                {
                    entries[`_modern.${entry}`] = this.jsEntries[entry];
                },
            );
        }

        let typeScriptConfig = path.join(
            this.libRoot,
            "configs",
            isModule ? "tsconfig.modern.json" : "tsconfig.legacy.json",
        );

        let config = {
            // entry
            entry: entries,

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
                                    configFile: typeScriptConfig,
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

            // plugins
            plugins: [
                new DefinePlugin({
                    'process.env.MODERN_BUILD': isModule,
                }),
            ],
        };

        if (cliConfig.lint || cliConfig.fix)
        {
            (config.module as any).rules.push({
                test: /\.m?jsx?$/,
                exclude: /node_modules|tests|vendor/,
                loader: "eslint-loader",
                options: {
                    cache: true,
                    configFile: path.join(this.libRoot, "configs/.eslintrc.yml"),
                    fix: cliConfig.fix,
                    parser: "babel-eslint",
                },
            });
        }

        return config;
    }
}

export default Kaba;
module.exports = Kaba;
