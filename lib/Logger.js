const chalk = require("chalk");
const formatHrDuration = require("./utils").formatHrTimeDuration;

/**
 * Logger for all kinds of messages
 */
class Logger
{
    /**
     * @param {string} prefix
     */
    constructor (prefix)
    {
        /**
         * @private
         * @type {string}
         */
        this.prefix = prefix;
    }

    /**
     * Logs the start of a build
     */
    logBuildStart ()
    {
        this.log(chalk`{green Build started}`);
    }


    /**
     * Logs a build success
     *
     * @param {string} fileName
     * @param {array} duration  the duration as provided by hrtime()
     */
    logBuildSuccess (fileName, duration)
    {
        this.logWithDuration(chalk`{green Build finished}: {yellow ${fileName}}`, duration);
    }


    /**
     * Logs a message with a duration
     *
     * @param {string} message
     * @param {array} duration  the duration as provided by hrtime()
     */
    logWithDuration (message, duration)
    {
        this.log(`${message} after ${formatHrDuration(duration)}`);
    }


    /**
     * @param {string} message
     * @param {Error|{message: string}} error
     */
    logError (message, error)
    {
        this.log(chalk`{red ${message}}: ${error.message}`);
    }


    /**
     * Logs a compilation error
     *
     * @param {{file: string, line: number, message: string, formatted: string}} error
     */
    logCompileError (error)
    {
        const codeSegment = error.formatted
            .split("\n")
            .splice(2)
            .join("\n");

        this.log(chalk`{red Compilation Error} in file {yellow ${error.file}} on line {yellow ${error.line}}:`);
        console.log(`    ${error.message}`);
        console.log("");
        console.log(codeSegment);
        console.log("");
    }


    /**
     * Writes a log message
     *
     * @param {string} message
     */
    log (message)
    {
        console.log(chalk`{gray ${this.getCurrentTime()}} ${this.prefix} ${message}`);
    }


    /**
     * Returns the current time
     *
     * @private
     * @return {string}
     */
    getCurrentTime ()
    {
        const now = new Date();
        return `${this.padTime(now.getHours())}:${this.padTime(now.getMinutes())}:${this.padTime(now.getSeconds())}`;
    }


    /**
     * Pads the time
     *
     * @private
     * @param {number} time
     * @return {string}
     */
    padTime (time)
    {
        return ("" + time).padStart(2, "0");
    }
}

module.exports = Logger;
