const minimist = require('minimist');

/**
 * Main CLI parser class
 */
class KabaCli
{
    /**
     * @param {Object} cliArgv
     */
    constructor (cliArgv)
    {
        const argv = minimist(cliArgv, {
            boolean: [
                // dev = debug + watch + sourceMaps + lint
                "dev",
                "d",

                // debug
                "debug",

                // sourceMaps
                "with-sourcemaps",
                "with-source-maps",

                // watch
                "watch",

                // lint
                "lint",

                // help
                "h",
                "help",

                // version
                "v",
                "version",

                // verbose
                "verbose",
            ],
        });

        /**
         * @private
         * @type {boolean}
         */
        this.dev = argv.d || argv.dev;

        /**
         * @private
         * @type {boolean}
         */
        this.debug = argv.debug;

        /**
         * @private
         * @type {boolean}
         */
        this.sourceMaps = argv["with-sourcemaps"] || argv["with-source-maps"];

        /**
         * @private
         * @type {boolean}
         */
        this.watch = argv.watch;

        /**
         * @private
         * @type {boolean}
         */
        this.lint = argv.lint;

        /**
         * @private
         * @type {boolean}
         */
        this.help = argv.h || argv.help;

        /**
         * @private
         * @type {boolean}
         */
        this.version = argv.v || argv.version;

        /**
         * @private
         * @type {boolean}
         */
        this.verbose = argv.verbose;
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


    /**
     * Returns whether the help should be shown
     *
     * @return {boolean}
     */
    showHelp ()
    {
        return this.help;
    }


    /**
     * Returns whether the version info should be shown
     *
     * @return {boolean}
     */
    showVersion ()
    {
        return this.version;
    }


    /**
     * Returns whether the cli was run in verbose mode
     *
     * @return {boolean}
     */
    isVerbose ()
    {
        return this.verbose;
    }
}

module.exports = new KabaCli(process.argv.slice(2));
