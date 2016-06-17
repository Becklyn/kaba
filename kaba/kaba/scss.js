"use strict";

/**
 * @typedef {{
 *      input: string,
 *      output: string,
 *      browsers: string[],
 *      ignoreLintFor: Array.<(string|RegExp)>,
 * }} ScssTaskConfig
 *
 * @typedef {{
 *      srcDir: string,
 *      browsers: string[],
 *      output: string,
 *      ignoreLintFor: Array.<(string|RegExp)>,
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
module.exports = function (config = {})
{
    // parse user config
    config = _.assign({
        input: "src/**/Resources/assets/scss/",
        output: "../../public/css",
        browsers: ["last 2 versions", "IE 10"],
        // list of file path paths (string or regex). If the file path matches one of these entries, the file won't be linted
        ignoreLintFor: ["/node_modules/"]
    }, config);

    // build internal config
    var srcDir = config.input.replace(/\/+$/, "") + "/";

    /** @var {InternalScssTaskConfig} internalConfig */
    let internalConfig = {
        // ensure exactly one slash at the end
        srcDir: srcDir,
        browsers: config.browsers,
        output: config.output,
        ignoreLintFor: config.ignoreLintFor
    };

    return function (done, debug)
    {
        let task = new ScssTask(internalConfig);
        task.run(done, debug);
    }
};
