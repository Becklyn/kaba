"use strict";

/**
 * @typedef {{
 *      input: string,
 *      output: string,
 *      ignoreLintFor: Array.<(string|RegExp)>,
 *      externals: Object.<string, string>
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
    config = _.defaultsDeep(config, {
        // input directory (can be a glob to multiple directories)
        input: "src/**/Resources/assets/js/",
        // output directory (relative to input directory)
        output: "../../public/js",
        // list of file path paths (string or regex). If the file path matches one of these entries, the file won't be linted
        ignoreLintFor: ["/node_modules/", "/vendor/"],
        // external global variables for JS compilation
        externals: {
            jquery: "window.jQuery",
            routing: "window.Routing"
        }
    });

    // ensure one trailing slash
    config.input = config.input.replace(/\/+$/, "") + "/";
    config.externals = _.pickBy(config.externals, (value) => !!value);

    return function (done, debug)
    {
        let task = new JsTask(config);
        task.run(debug);
    }
};
