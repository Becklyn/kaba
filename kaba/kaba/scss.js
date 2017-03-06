/**
 * @typedef {{
 *      input: string,
 *      output: string,
 *      browsers: string[],
 *      ignoreLintFor: Array.<(string|RegExp)>,
 *      outputFileName: function(string, string):string,
 *      debug: boolean,
 *      watch: boolean,
 *      lint: boolean,
 * }} ScssTaskConfig
 */

const ScssTask = require("./scss/scss-task");
const _ = require("lodash");



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
        // input directory (can be a glob to multiple directories)
        input: "src/**/Resources/assets/scss/",
        // output directory (relative to input directory)
        output: "../../public/css",
        // browsers to support
        browsers: ["last 2 versions", "IE 10"],
        // list of file path paths (string or regex). If the file path matches one of these entries, the file won't be linted
        ignoreLintFor: ["/node_modules/", "/vendor/"],
        // Transforms the file name before writing the out file
        outputFileName: (outputFileName, inputFileName) => outputFileName,
        // Whether to build for debug
        debug: null,
        // Whether to start the watcher
        watch: null,
        // Whether to lint the files
        lint: null,
    }, config);

    // build internal config
    config.input = config.input.replace(/\/+$/, "") + "/";

    return function (done, debug)
    {
        if (null === config.debug)
        {
            config.debug = debug;
        }

        if (null === config.watch)
        {
            config.watch = debug;
        }

        if (null === config.lint)
        {
            config.lint = debug;
        }

        let task = new ScssTask(config);
        task.run(done);
    };
};
