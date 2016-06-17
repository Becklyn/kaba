"use strict";

/**
 * @typedef {{
 *      input: string,
 *      output: string,
 *      browsers: string[],
 * }} JsTaskConfig
 *
 * @typedef {{
 *      srcDir: string,
 *      browsers: string[],
 *      output: string,
 * }} InternalJsTaskConfig
 */


let fs = require("fs");
let JsTask = require("./js/js-task");
const _ = require("lodash");




/**
 * Main task for Sass
 *
 * @param {JsTaskConfig} config
 *
 * @returns {Function}
 */
module.exports = function (config = {})
{
    config = _.assign({
        input: "src/**/Resources/assets/js/",
        output: "../../public/js",
        browsers: ["last 2 versions", "IE 10"]
    }, config);

    // build internal config
    var srcDir = config.input.replace(/\/+$/, "") + "/";

    /** @var {InternalJsTaskConfig} internalConfig */
    let internalConfig = {
        // ensure exactly one slash at the end
        srcDir: srcDir,
        browsers: config.browsers,
        output: config.output
    };

    return function (done, debug)
    {
        let task = new JsTask(internalConfig);
        task.run(debug);
    }
};
