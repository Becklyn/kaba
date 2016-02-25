"use strict";

/**
 * @typedef {{
 *      inputDir: String,
 *      inputGlob: String,
 *      outputDir: String,
 *      browsers: String[],
 * }} JsTaskOptions
 */

let gulp = require("gulp");
let fs = require("fs");
let JsTask = require("./js/js-task");




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
    options.inputGlob = options.inputDir + "/*.js";
    options.outputDir = fs.realpathSync(outputDir);

    return function (debug)
    {
        return function (done)
        {
            let task = new JsTask(gulp, options);
            task.run(debug, done);
        }
    }
};
