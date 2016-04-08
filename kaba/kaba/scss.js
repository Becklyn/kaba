"use strict";

/**
 * @typedef {{
 *      inputDir: String,
 *      inputGlob: String,
 *      topLevelInputGlob: String,
 *      outputDir: String,
 *      browsers: String[],
 * }} ScssTaskOptions
 */

let fs = require("fs-extra");
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
    fs.mkdirsSync(outputDir);

    // normalize paths
    options.inputDir  = fs.realpathSync(inputDir);
    options.inputGlob = options.inputDir + "/**/*.scss";
    options.topLevelInputGlob = options.inputDir + "/**/!(_)*.scss";
    options.outputDir = fs.realpathSync(outputDir);


    // parse options
    options = options || {browsers: ["last 2 versions", "IE 10"]};

    return function (debug)
    {
        return function ()
        {
            let task = new ScssTask(options);
            task.run(debug);
        }
    }
};
