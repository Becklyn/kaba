"use strict";

/**
 * @typedef {{
 *      input: string,
 *      topLevelInputGlob: string,
 *      output: string,
 *      browsers: string[],
 *      inputTopLevel: string,
 *      inputAllFiles: string,
 * }} ScssTaskConfig
 *
 * @typedef {{
 *      srcDir: string,
 *      srcTopLevelFiles: string,
 *      srcAllFiles: string,
 *      userConfig: ScssTaskConfig,
 * }} InternalScssTaskConfig
 */

const fs = require("fs-extra");
const ScssTask = require("./scss/scss-task");
const _ = require("lodash");
const path = require("path");




/**
 * Main task for Sass
 *
 * @param {ScssTaskConfig} config
 *
 * @returns {Function}
 */
module.exports = function (config)
{
    // parse user config
    config = _.assign({
        input: "src/**/Resources/assets/scss/",
        output: "../../public/css",
        browsers: ["last 2 versions", "IE 10"]
    }, config);

    // build internal config
    var srcDir = config.input.replace(/\/+$/, "") + "/";

    /** @var internalConfig {InternalScssTaskConfig}  */
    let internalConfig = {
        // ensure exactly one slash at the end
        srcDir: srcDir,
        srcTopLevelFiles: srcDir + "!(_)*.scss",
        srcAllFiles: srcDir + "**/*.scss",
        userConfig: config
    };

    return function (done, debug)
    {
        let task = new ScssTask(internalConfig);
        task.run(debug);
    }
};
