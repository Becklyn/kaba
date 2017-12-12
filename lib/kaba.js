const cli = require("../cli/cli");



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
         * @type {Object<string,string>}
         */
        this.entries = {};


        this.outputPath = "asset-artifacts/";
        this.publicPath = "/assets/";
    }


    /**
     * Adds an entry
     *
     * @param {string} name
     * @param {string} path
     * @return {Kaba}
     */
    addEntry (name, path)
    {
        this.entries[name] = path;
        return this;
    }


    /**
     * Sets the output path
     *
     * @param {string} path
     * @return {Kaba}
     */
    setOutputPath (path)
    {
        this.outputPath = path;
        return this;
    }


    /**
     * Sets the relative public path (for automatic imports)
     *
     * @param {string} path
     * @return {Kaba}
     */
    setPublicPath (path)
    {
        this.publicPath = path;
        return this;
    }


    /**
     * Returns the built webpack config
     *
     * @return {Object}
     */
    getWebpackConfig ()
    {
        /** @type {webpack.options} config */
        const config = {
            entry: this.entries,

            output: {
                path: this.outputPath,
                filename: '[name].js',
                publicPath: this.publicPath,
                pathinfo: !cli.isDev(),
            },

            module: {

            },

            resolve: {
                extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
            },

            performance: {

            },

            context: process.cwd(),

            target: "web",

            externals: [

            ],

            stats: "errors-only",

            devServer: {

            },

            plugins: [

            ],
        };

        if (cli.isDev())
        {
            config.devtool = "inline-source-map";
        }

        return config;
    }
}

module.exports = Kaba;
