"use strict";

const Promise = require("bluebird");
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
     *
     * @return {Promise}
     */
    lintWithDependencies (file)
    {
        return new Promise(
            (resolve) => {
                // remember which files were linted to only lint each file once
                const lintedFiles = {};
                const tasks = [];

                // find the imported files
                const filesToLint = this.dependencyResolver.findDependencies(file);

                // add the current file
                filesToLint.push(file);

                filesToLint.forEach(
                    (file) =>
                    {
                        // filter out duplicates
                        if (!lintedFiles[file])
                        {
                            tasks.push(this.lint(file));
                            lintedFiles[file] = true;
                        }
                    }
                );

                Promise.all(tasks)
                    .then(resolve);
            }
        );
    }


    /**
     * Lints the given file
     *
     * @param {String} file the file path
     *
     * @return {Promise}
     */
    lint (file)
    {
        return new Promise(
            (resolve, reject) =>
            {
                if (filePathMatcher(file, this.config.ignoreLintFor))
                {
                    resolve();
                    return;
                }


                fs.readFile(file, "utf-8",
                    (err, fileContent) =>
                    {
                        if (err)
                        {
                            reject(err);
                            return;
                        }

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
                            .then(resolve);
                    }
                );
            }
        );
    }
};
