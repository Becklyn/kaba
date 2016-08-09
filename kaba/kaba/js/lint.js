"use strict";

const CLIEngine = require("eslint").CLIEngine;
const Promise = require("bluebird");
const fs = require("fs");
const path = require("path");
const filePathMatcher = require("../../lib/file-path-matcher");


/**
 *
 * @param {string} file
 * @param {string} srcDir
 * @param {JsTaskConfig} config
 */
module.exports = function (file, srcDir, config)
{
    if (filePathMatcher(file, config.ignoreLintFor))
    {
        return;
    }

    let engine = new CLIEngine({
        configFile: __dirname + "/../../../.eslintrc.yml",
        ignore: false
    });

    let formatter = engine.getFormatter();

    Promise.promisify(fs.readFile)(file, {encoding: "utf-8"})
        .then(
            (fileContent) => engine.executeOnFiles([file])
        )
        .then(
            (report) =>
            {
                report.results = report.results.map(
                    (entry) =>
                    {
                        entry.filePath = path.relative(srcDir, entry.filePath);
                        return entry;
                    }
                );

                console.log(formatter(report.results));
            }
        );
};
