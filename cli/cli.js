const minimist = require('minimist');


class KabaCli
{
    /**
     * @param {Object} cliArgv
     */
    constructor (cliArgv)
    {
        const argv = minimist(cliArgv, {
            boolean: ["dev", "d", "h", "help", "v", "version"],
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
        this.version = argv.v || argv.version;

        /**
         * @private
         * @type {boolean}
         */
        this.help = argv.h || argv.help;
    }


    /**
     * Returns whether this is a dev build
     *
     * @return {boolean}
     */
    isDev ()
    {
        return this.dev;
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
     * Returns whether the help should be shown
     *
     * @return {boolean}
     */
    showHelp ()
    {
        return this.help;
    }
}

module.exports = new KabaCli(process.argv.slice(2));
