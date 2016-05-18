"use strict";

/**
 * @typedef {{
 *      input: String,
 *      topLevelInputGlob: String,
 *      output: String,
 *      browsers: String[],
 * }} ScssTaskOptions
 */

let fs = require("fs-extra");
let ScssTask = require("./scss/scss-task");
let _ = require("lodash");




/**
 * Main task for Sass
 *
 * @param {ScssTaskOptions} options
 *
 * @returns {Function}
 */
module.exports = function (options)
{
    options = _.assign({
        input: "src/**/Resources/assets/scss/!(_)*.scss",
        output: "../../public/css",
        browsers: ["last 2 versions", "IE 10"]
    }, options);

    return function (done, debug)
    {
        let task = new ScssTask(options);
        task.run(debug);
    }
};
