"use strict";

/**
 * @typedef {{
 *      inputDir: String,
 *      inputGlob: String,
 *      outputDir: String,
 *      browsers: String[],
 * }} ScssTaskOptions
 */

let gulp = require("gulp");
let fs = require("fs");
let ScssTask = require("./scss/scss-task");




/**
 * Main task for Sass
 *
 * @param {String} inputDir
 * @param {String} outputDir
 * @param {ScssTaskOptions} options
 *
 * @returns {Function}
 */
module.exports = function (inputDir, outputDir, options)
{
    // normalize paths
    options.inputDir  = fs.realpathSync(inputDir);
    options.inputGlob = options.inputDir + "/**/*.scss";
    options.outputDir = fs.realpathSync(outputDir);


    // parse options
    options = options || {browsers: ["last 2 versions", "IE 10"]};

    return function (debug)
    {
        return function (done)
        {
            let task = new ScssTask(gulp, options);
            task.run(debug, done);
        }
    }
};
