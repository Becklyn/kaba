"use strict";

const postcss = require("postcss");
const stylelint = require("stylelint");
const reporter = require("postcss-reporter");
const scssSyntax = require("postcss-scss");
const fs = require("fs");
const ScssDependencyResolver = require("./scss-dependency-resolver");


module.exports = class ScssLinter
{
    /**
     *
     * @param {InternalScssTaskConfig} config
     */
    constructor (config)
    {
        /**
         * @private
         * @type {InternalScssTaskConfig}
         */
        this.config = config;
    }


    /**
     * Lints the given file and all imported files
     *
     * @param {String} file the file path
     */
    lintWithDependencies (file)
    {
        let resolver = new ScssDependencyResolver(file);

        // remember which files were linted to only lint each file once
        let lintedFiles = {};

        // find the imported files
        let filesToLint = resolver.findDependencies(file);

        // add the current file
        filesToLint.push(file);

        filesToLint.forEach(
            (file) =>
            {
                // filter out duplicates
                if (!lintedFiles[file])
                {
                    this.lint(file);
                    lintedFiles[file] = true;
                }
            }
        );
    }


    /**
     * Lints the given file
     *
     * @param {String} file the file path
     */
    lint (file)
    {
        fs.readFile(file, "utf-8",
            (err, fileContent) =>
            {
                postcss([
                    stylelint({
                        configFile: __dirname + "/../../../.stylelintrc"
                    }),
                    reporter({clearMessages: true})
                ])
                    .process(fileContent, {
                        from: file // required to have file names in the report
                    })
                    .then();
            }
        );
    }
};
