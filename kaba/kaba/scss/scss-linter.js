"use strict";

let postcss = require("postcss");
let stylelint = require("stylelint");
let reporter = require("postcss-reporter");
let doiuse = require("doiuse");
let scssSyntax = require("postcss-scss");
let fs = require("fs");


module.exports = class ScssLinter
{
    /**
     *
     * @param {ScssTaskOptions} options
     * @param {ScssDependencyResolver} dependencyResolver
     */
    constructor (options, dependencyResolver)
    {
        /**
         * @private
         * @type {ScssTaskOptions}
         */
        this.options = options;

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
        fs.readFile(file, "utf-8",
            (err, fileContent) =>
            {
                postcss([
                    stylelint({
                        configFile: __dirname + "/../../../.stylelintrc"
                    }),
                    doiuse({
                        browsers: this.options.browsers//,
                        //onFeatureUsage: console.log.bind(console)
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
