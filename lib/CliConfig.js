/**
 * Main CLI parser class
 */
class CliConfig
{
    /**
     * @param {Command} argv
     */
    constructor (argv)
    {
        // commander just returns undefined for missing flags, so transform them to boolean
        /**
         * @private
         * @type {boolean}
         */
        this.dev = !!argv.d || !!argv.dev;

        /**
         * @private
         * @type {boolean}
         */
        this.debug = !!argv.debug;

        /**
         * @private
         * @type {boolean}
         */
        this.sourceMaps = !!argv.withSourceMaps;

        /**
         * @private
         * @type {boolean}
         */
        this.watch = !!argv.watch;

        /**
         * @private
         * @type {boolean}
         */
        this.lint = !!argv.lint;

        /**
         * @private
         * @type {boolean}
         */
        this.bundleAnalyzer = !!argv.analyzeBundles;

        /**
         * @private
         * @type {boolean}
         */
        this.analyze = !!argv.analyze;
    }


    /**
     * Returns whether this is a debug build
     *
     * @return {boolean}
     */
    isDebug ()
    {
        return (this.debug || this.dev) && !this.isAnalyze();
    }


    /**
     * Returns whether to include sourcemaps
     *
     * @return {boolean}
     */
    includeSourceMaps ()
    {
        return this.sourceMaps || this.debug || this.dev;
    }


    /**
     * Returns whether the watcher should be activated
     *
     * @return {boolean}
     */
    isWatch ()
    {
        return (this.watch || this.dev) && !this.analyze;
    }


    /**
     * Returns whether the code should be linted
     *
     * @return {boolean}
     */
    isLint ()
    {
        return this.lint || this.dev || this.analyze;
    }


    /**
     * Returns whether the bundle sizes should be analyzed
     *
     * @return {boolean}
     */
    isBundleAnalyzerEnabled ()
    {
        return this.bundleAnalyzer && !this.analyze;
    }


    /**
     * Returns whether the bundles should only be compiled and analyzed
     *
     * @return {boolean}
     */
    isAnalyze ()
    {
        return this.analyze;
    }
}

module.exports = CliConfig;
