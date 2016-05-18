"use strict";

let chalk = require("chalk");
let fileReader = require("./file-reader");
let path = require("path");


class Logger
{
    constructor (prefix, color, baseDir)
    {
        if (!chalk[color])
        {
            throw new Error("Unknown color: " + color);
        }

        this.prefix = "[" + chalk[color](prefix) + "] ";
        this.emptyPrefix = " ".repeat(prefix.length + 3);
        this.baseDir = baseDir;
    }


    logAction (action, message)
    {
        this.logLine(action, "yellow", message);
    }


    log (message)
    {
        console.log(this.prefix + message);
    }


    logWithoutPrefix (message)
    {
        console.log(this.emptyPrefix + message);
    }


    /**
     * @deprecated
     * @param message
     */
    logLine (message)
    {
        this.log(message);
    }

    /**
     * @deprecated
     * @param message
     */
    logLineWithoutPrefix (message)
    {
        this.logWithoutPrefix(message);
    }


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

        this.logLine(chalk.red("Error") + ` ${error}`);
    }

    logBuildUpdate (file)
    {
        let relativeFile = path.relative(this.baseDir, file);
        this.logLine(chalk.yellow("Build") + ` ${relativeFile}`);
    }

    logBuildError (error)
    {
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

        this.logLine(chalk.red("Build Error") + " in " + chalk.yellow(relativeFile) + " (" + chalk.yellow(`${error.line}:${error.column}`) + "): " + error.message);

        line.split("\n").forEach(
            (l) => this.logLineWithoutPrefix("    " + chalk.gray(l))
        );

        console.log("");
    }
}

module.exports = Logger;
