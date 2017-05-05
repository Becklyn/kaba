"use strict";

const fs = require("fs");
const postcss = require("postcss");
const reporter = require("postcss-reporter");
const scssSyntax = require("postcss-scss");
const stylelint = require("stylelint");
const filePathMatcher = require("../../lib/file-path-matcher");


module.exports = class ScssLinter
{
    /**
     *
     * @param {ScssTaskConfig} config
     * @param {ScssDependencyResolver} dependencyResolver
     */
    constructor (config, dependencyResolver)
    {
        /**
         * @private
         * @type {ScssTaskConfig}
         */
        this.config = config;

        /**
         * @private
         * @type {ScssDependencyResolver}
         */
        this.dependencyResolver = dependencyResolver;
    }


    /**
     * Lints the given file and all imported files
     *
     * @param {String} file the file path
     */
    lintWithDependencies (file)
    {
        // remember which files were linted to only lint each file once
        let lintedFiles = {};

        // find the imported files
        let filesToLint = this.dependencyResolver.findDependencies(file);

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
        if (filePathMatcher(file, this.config.ignoreLintFor))
        {
            return;
        }


        fs.readFile(file, "utf-8",
            (err, fileContent) =>
            {
                postcss([
                    stylelint({
                        configFile: __dirname + "/../../../.stylelintrc.yml",
                    }),
                    reporter({
                        clearMessages: true,
                    }),
                ])
                    .process(fileContent, {
                        from: file, // required to have file names in the report
                        syntax: scssSyntax,
                    })
                    .then();
            }
        );
    }
};
