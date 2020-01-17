import {blue, red, yellow, cyan, green, gray} from "kleur";
const path = require("path");
import * as webpack from "webpack";
import {DefinePlugin, ProvidePlugin} from "webpack";
const TerserPlugin = require('terser-webpack-plugin');
const typeScriptErrorFormatter = require("@becklyn/typescript-error-formatter");
import {kaba} from "./@types/kaba";
import CliConfig = kaba.CliConfig;
const kabaBabelPreset = require("kaba-babel-preset");
const DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');


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
    private javaScriptDependenciesFileName: string = "_dependencies";
    private hashFileNames: boolean = true;
    private buildModern: boolean = true;
    private nodeSettings: webpack.Node|false = false;


    /**
     *
     */
    public constructor ()
    {
        this.cwd = process.cwd();
        this.libRoot = path.dirname(__dirname);

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
     * Setting for polyfilling core node packages
     */
    public polyfillNode (setting: webpack.Node|false) : this
    {
        this.nodeSettings = setting;
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
            const compilerConfigs: kaba.WebpackBuildConfig[] = [];

            Object.keys(this.jsEntries).forEach((entry: string) => {
                compilerConfigs.push(this.buildWebpackConfig(entry, this.jsEntries[entry], cliConfig, false));

                if (this.buildModern)
                {
                    compilerConfigs.push(this.buildWebpackConfig(entry, this.jsEntries[entry], cliConfig, true));
                }
            });

            jsConfig = {
                watch: cliConfig.watch,
                configs: compilerConfigs,
                javaScriptDependenciesFileName: this.javaScriptDependenciesFileName,
                basePath: path.join(this.outputPaths.base, this.outputPaths.js),
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
     * Builds the specialized webpack config for a legacy / module build
     */
    private buildWebpackConfig (entry: string, entryFile: string, cliConfig: kaba.CliConfig, isModule: boolean): Partial<webpack.Configuration>
    {
        const babelLoader: webpack.RuleSetUseItem = {
            loader: "babel-loader?cacheDirectory",
            options: {
                babelrc: false,
                presets: [
                    [isModule ? kabaBabelPreset.modern : kabaBabelPreset.legacy],
                ],
            },
        };

        let typeScriptConfig = path.join(
            this.libRoot,
            "configs",
            isModule ? "tsconfig.modern.json" : "tsconfig.legacy.json",
        );

        const entryName = isModule ? `_modern.${entry}` : entry;

            name: isModule ? "modern" : "legacy",
        let configTemplate: webpack.Configuration = {
            entry: {
                [entryName]: entryFile,
            },

            // mode
            mode: cliConfig.debug ? "development" : "production",

            // resolve
            resolve: {
                modules: [
                    // first try from the root project (as otherwise symlinked projects will fail)
                    path.resolve(this.cwd, "node_modules"),
                    // default search algorithm
                    "node_modules",
                ],

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

            // output
            output: {
                path: path.join(this.outputPaths.base, this.outputPaths.js, isModule ? "modern" : "legacy"),
                filename: this.hashFileNames ? '[name].[chunkhash].js' : '[name].js',
                // the slash at the end is required of the public path entries
                publicPath: path.join(this.publicPath, isModule ? "modern/" : "legacy/"),
                pathinfo: cliConfig.debug,
            },

            // module
            module: {
                rules: [
                    // TypeScript
                    {
                        test: /\.tsx?$/,
                        use: [
                            'cache-loader',
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
                        use: ['cache-loader', babelLoader],
                    },

                    // content files
                    {
                        test: /\.(svg|txt)$/,
                        loader: "raw-loader",
                    },

                    // ignore CSS files
                    {
                        test: /\.css$/,
                        loader: "ignore-loader",
                    }
                ],
            },

            // optimization
            optimization: {
                concatenateModules: this.moduleConcatenationEnabled,
                minimizer: [],
            },

            // devtool (source maps)
            devtool: cliConfig.debug
                ? "inline-cheap-source-map"
                // We need to cast to `any` here, as this specific config value isn't listed in webpack's typescript
                // types.
                : ("hidden-cheap-module-source-map" as any),

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
                hash: !isModule,
                version: !isModule,
                modules: !isModule,
            },

            // plugins
            plugins: [
                new ProgressBarPlugin({
                    complete: green("─"),
                    incomplete: gray("─"),
                    width: 50,
                    format: ` ${cyan("build")} :bar ${green(":percent")} ${gray(":msg")} `,
                }),
                new DuplicatePackageCheckerPlugin({
                    emitError: true,
                    strict: true,
                }),
                new ProvidePlugin({
                    h: ["preact", "h"],
                    Fragment: ["preact", "Fragment"],
                }),
                new CleanWebpackPlugin(),
                new DefinePlugin({
                    'process.env.MODERN_BUILD': isModule,
                    'MODERN_BUILD': isModule,
                    'process.env.DEBUG': cliConfig.debug,
                    'DEBUG': cliConfig.debug,
                }),
            ],

            // watch
            watch: cliConfig.watch,

            // node
            // don't automatically polyfill certain node libraries
            // as we don't care about these implementations and they just add weight
            node: this.nodeSettings,
        } as Partial<webpack.Configuration>;

        if (!cliConfig.debug)
        {
            (configTemplate.optimization as any).minimizer.push(new TerserPlugin({
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
                (configTemplate.plugins as any[]).push(new BundleAnalyzerPlugin());
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

        if (!isModule)
        {
            (configTemplate.module as webpack.Module).rules.push({
                // ESLint
                test: /\.m?jsx?$/,
                // only lint files that are in the project dir & exclude tests, vendor and node_modules
                include: (path) => path.startsWith(this.cwd) && !/node_modules|tests|vendor/.test(path),
                loader: "eslint-loader",
                options: {
                    cache: true,
                    configFile: path.join(this.libRoot, "configs/.eslintrc.yml"),
                    fix: cliConfig.fix,
                    parser: "babel-eslint",
                    quiet: !cliConfig.lint,
                    // always only emit a warning, so to actually never fail the webpack build
                    emitWarning: true,
                },
            });
        }

        return configTemplate;
    }
}

export default Kaba;
module.exports = Kaba;
