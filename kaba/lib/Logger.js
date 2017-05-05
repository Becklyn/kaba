const chalk = require("chalk");
const path = require("path");


/**
 * A generic, prefixed logger
 */
module.exports = class Logger
{
    /**
     *
     * @param {string} prefix
     * @param {string} color
     */
    constructor (prefix, color)
    {
        if (typeof chalk[color] === "undefined")
        {
            throw new Error(`Unknown color: ${color}`);
        }

        /**
         * Builds a new child logger.
         * Needs to pass the reference to the child class explicitly to break the circular dependency
         *
         * @type {function}
         */
        this.createChildLogger = (ChildClass, baseDir) => new ChildClass(prefix, color, baseDir);


        /**
         * @private
         * @type {string}
         */
        this.prefix = chalk[color](prefix);


        /**
         * @private
         * @type {string}
         */
        this.emptyPrefix = " ".repeat(prefix.length + 3);
    }


    /**
     * Logs the given message
     *
     * @param {string} message
     */
    log (message)
    {
        const now = new Date();
        const time = [
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
        ]
            .map((number) => 1 === number.toString().length ? `0${number}` : number)
            .join(":");

        console.log(`${chalk.gray(`[${time}]`)} [${this.prefix}] ${message}`);
    }


    /**
     * Logs the given message without prefix
     *
     * @param {string} message
     */
    raw (message)
    {
        console.log(this.emptyPrefix + message);
    }


    /**
     * Logs the given error
     * @param {string|{toString: function}|Error} error
     */
    error (error)
    {
        if (typeof error === "object")
        {
            if (error instanceof Error)
            {
                error = error.message;
            }
            else if (error.toString)
            {
                error = error.toString();
            }
            else
            {
                error = "Can't print error object, as it has now toString() method.";
            }
        }

        this.log(`${chalk.red("Error")} ${error}`);
    }
};
