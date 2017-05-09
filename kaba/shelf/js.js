/**
 * @typedef {{
 *      input: string,
 *      output: string,
 *      ignoreLintFor: Array.<(string|RegExp)>,
 *      browsers: string[],
 *      externals: Object.<string, string>,
 *      transforms: Array.<Array>,
 *      react: boolean,
 *      preact: boolean,
 *      outputFileName: function(string):string,
 *      debug: boolean,
 *      watch: boolean,
 *      lint: boolean,
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
            // browsers to support
            browsers: ["last 2 versions", "IE 10", "IE 11"],
            // external global variables for JS compilation
            externals: {
                jquery: "window.jQuery",
                routing: "window.Routing",
            },
            // flag whether react should be supported
            react: false,
            // flag whether preact should be supported
            preact: false,
            // a list of transforms
            transforms: [],
            // Transforms the file name before writing the out file
            outputFileName: (fileName) => fileName,
        });

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
};
