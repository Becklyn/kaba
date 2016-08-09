"use strict";

const chalk = require("chalk");
const fileReader = require("./file-reader");
const path = require("path");


class Logger
{
    /**
     *
     * @param {string} prefix
     * @param {string} color
     * @param {string} baseDir
     */
    constructor (prefix, color, baseDir)
    {
        if (!chalk[color])
        {
            throw new Error("Unknown color: " + color);
        }

        /**
         * @private
         * @type {string}
         */
        this.prefix = "[" + chalk[color](prefix) + "] ";


        /**
         * @private
         * @type {string}
         */
        this.emptyPrefix = " ".repeat(prefix.length + 3);


        /**
         * @private
         * @type {string}
         */
        this.baseDir = baseDir;
    }


    /**
     * Logs the given message
     *
     * @param {string} message
     */
    log (message)
    {
        let now = new Date();
        let time = [
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
        ]
            .map((number) => 1 === number.toString().length ? `0${number}` : number)
            .join(":");

        let date = chalk.gray(`[${time}]`);

        console.log(`${date} ${this.prefix}${message}`);
    }


    /**
     * Logs the given message without prefix
     *
     * @param {string} message
     */
    logWithoutPrefix (message)
    {
        console.log(this.emptyPrefix + message);
    }


    /**
     * Logs the given error
     * @param {string|{toString: function}|Error} error
     */
    logError (error)
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

        this.log(chalk.red("Error") + ` ${error}`);
    }


    /**
     * Logs the given build error
     *
     * @param {BuildError} buildError
     */
    logBuildError (buildError)
    {
        let error = buildError.reason;
        let line = fileReader.getLine(error.file, error.line);
        let relativeFile = path.relative(this.baseDir, error.file);

        if (!line)
        {
            line = error.formatted;
        }
        else
        {
            line += "\n" + "-".repeat(error.column - 1) + "^";
        }

        this.log(chalk.red("Build Error") + " in " + chalk.yellow(relativeFile) + " (" + chalk.yellow(`${error.line}:${error.column}`) + "): " + error.message);

        line.split("\n").forEach(
            (l) => this.logWithoutPrefix("    " + chalk.gray(l))
        );

        console.log("");
    }
}

module.exports = Logger;
