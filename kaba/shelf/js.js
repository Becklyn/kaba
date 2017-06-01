/**
 * @typedef {{
 *      input: string,
 *      output: string,
 *      ignoreLintFor: Array.<(string|RegExp)>,
 *      externals: Object.<string, string>,
 *      outputFileName: function(string):string,
 *      transformDirectories: array.<RegExp|string>,
 *      debug: boolean,
 *      watch: boolean,
 *      lint: boolean,
 *      sourceMaps: boolean,
 * }} JsTaskConfig
 */

const JsTask = require("./js/JsTask");
const Logger = require("../lib/Logger");
const _ = require("lodash");
const defaultEnvironment = require("./app-environment");

const logger = new Logger("JS", "yellow");


/**
 * Task builder for JS
 *
 * @param {Kaba} kaba
 * @returns {Function}
 */
module.exports = (kaba) => {

    /**
     * Main task for JS
     *
     * @param {JsTaskConfig} config
     * @returns {Function}
     */
    return (config = {}) =>
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
            transformDirectories: [],
            // Transforms the file name before writing the out file
            outputFileName: (fileName) => fileName,
        });

        // always transform mojave
        config.transformDirectories.push(/\/node_modules\/mojave\//);

        // ensure one trailing slash
        config.input = config.input.replace(/\/+$/, "") + "/";
        config.externals = _.pickBy(config.externals, (value) => !!value);

        return function (done, env)
        {
            // keep the user defined parameters
            config = _.assign({}, defaultEnvironment, env, config);
            const task = new JsTask(config, logger, kaba);

            switch (config.mode)
            {
                case "compile":
                    task.compile(done);
                    break;

                case "validate":
                    task.validate(done);
                    break;

                default:
                    logger.error(`Unsupported mode: ${config.mode}`);
                    done();
                    break;
            }
        };
    };
};
