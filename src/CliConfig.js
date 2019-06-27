/**
 * @typedef {{
 *     debug: ?boolean,
 *     watch: ?boolean,
 *     lint: ?boolean,
 *     openBundleAnalyzer: ?boolean,
 *     analyze: ?boolean,
 *     fix: ?boolean,
 * }} CliConfigArguments
 */


/**
 * Main CLI parser class
 */
class CliConfig
{
    /**
     * @param {CliConfigArguments} argv
     */
    constructor (argv)
    {
        // commander just returns undefined for missing flags, so transform them to boolean
        /**
         * @private
         * @type {boolean}
         */
        this.debug = !!argv.debug;

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
        this.bundleAnalyzer = !!argv.openBundleAnalyzer;

        /**
         * @private
         * @type {boolean}
         */
        this.analyze = !!argv.analyze;

        /**
         * @private
         * @type {boolean}
         */
        this.fix = !!argv.fix;
    }


    /**
     * Returns whether this is a debug build
     *
     * @return {boolean}
     */
    isDebug ()
    {
        return this.debug;
    }


    /**
     * Returns whether the watcher should be activated
     *
     * @return {boolean}
     */
    isWatch ()
    {
        return this.watch;
    }


    /**
     * Returns whether the code should be linted
     *
     * @return {boolean}
     */
    isLint ()
    {
        return this.lint;
    }


    /**
     * Returns whether the bundle sizes should be analyzed
     *
     * @return {boolean}
     */
    isBundleAnalyzerEnabled ()
    {
        return this.bundleAnalyzer;
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


    /**
     * Returns whether the code should automatically be fixed for code style
     *
     * @return {boolean}
     */
    isFix ()
    {
        return this.fix;
    }
}

module.exports = CliConfig;
