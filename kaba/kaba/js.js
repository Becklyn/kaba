"use strict";

/**
 * @typedef {{
 *      input: string,
 *      output: string,
 *      ignoreLintFor: Array.<(string|RegExp)>,
 * }} JsTaskConfig
 */

const fs = require("fs");
const JsTask = require("./js/js-task");
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
        // input directory (can be a glob to multiple directories)
        input: "src/**/Resources/assets/js/",
        // output directory (relative to input directory)
        output: "../../public/js",
        // list of file path paths (string or regex). If the file path matches one of these entries, the file won't be linted
        ignoreLintFor: ["/node_modules/", "/vendor/"]
    }, config);

    // ensure one trailing slash
    config.input = config.input.replace(/\/+$/, "") + "/";

    return function (done, debug)
    {
        let task = new JsTask(config);
        task.run(debug);
    }
};
