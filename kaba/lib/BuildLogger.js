const Logger = require("./Logger");
const chalk = require("chalk");
const fileReader = require("./file-reader");
const path = require("path");


/**
 * A specialized logger, that can also log build errors
 */
module.exports = class BuildLogger extends Logger
{
    /**
     *
     * @param {string} prefix
     * @param {string} color
     * @param {string} baseDir
     */
    constructor (prefix, color, baseDir)
    {
        super(prefix, color);


        /**
         * @private
         * @type {string}
         */
        this.baseDir = baseDir;
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
            (l) => this.raw("    " + chalk.gray(l))
        );

        console.log("");
    }
};
