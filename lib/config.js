/**
 * Main CLI parser class
 */
class Config
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
    }


    /**
     * Returns whether this is a debug build
     *
     * @return {boolean}
     */
    isDebug ()
    {
        return this.debug || this.dev;
    }


    /**
     * Returns whether to include sourcemaps
     *
     * @return {boolean}
     */
    includeSourceMaps ()
    {
        return this.sourceMaps || this.dev;
    }


    /**
     * Returns whether the watcher should be activated
     *
     * @return {boolean}
     */
    isWatch ()
    {
        return this.watch || this.dev;
    }


    /**
     * Returns whether the code should be linted
     *
     * @return {boolean}
     */
    isLint ()
    {
        return this.lint || this.dev;
    }
}

module.exports = Config;
