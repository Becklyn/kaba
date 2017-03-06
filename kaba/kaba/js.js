/**
 * @typedef {{
 *      input: string,
 *      output: string,
 *      ignoreLintFor: Array.<(string|RegExp)>,
 *      externals: Object.<string, string>,
 *      transforms: Array.<Array>,
 *      react: boolean,
 *      preact: boolean,
 *      outputFileName: function(string):string,
 * }} JsTaskConfig
 */

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
            routing: "window.Routing",
        },
        // flag whether react should be supported
        react: false,
        // flag whether preact should be support
        preact: false,
        // a list of transforms
        transforms: [],
        // Transforms the file name before writing the out file
        outputFileName: (fileName) => fileName,
    });

    // ensure one trailing slash
    config.input = config.input.replace(/\/+$/, "") + "/";
    config.externals = _.pickBy(config.externals, (value) => !!value);

    return function (done, debug)
    {
        let task = new JsTask(config);
        task.run(done, debug);
    }
};
