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
 *      verbose: boolean,
 * }} ScssTaskConfig
 */

const Logger = require("../lib/Logger");
const ScssTask = require("./scss/ScssTask");
const _ = require("lodash");
const defaultEnvironment = require("./app-environment");

const logger = new Logger("SCSS", "blue");


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
    }, config);

    // build internal config
    config.input = config.input.replace(/\/+$/, "") + "/";



    return function (done, env)
    {
        // keep the user defined parameters
        config = _.assign({}, defaultEnvironment, env, config);
        let task = new ScssTask(config, logger);

        switch (config.mode)
        {
            case "compile":
                task.compile(done);
                break;

            case "lint":
                task.lint(done);
                break;

            default:
                logger.error(`Unsupported mode: ${config.mode}`);
                done();
                break;
        }
    };
};
