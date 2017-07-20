const BuildLogger = require("../../lib/BuildLogger");
const JsDirectoryTask = require("./JsDirectoryTask");
const glob = require("glob");
const path = require("path");


/**
 *
 */
module.exports = class JsTask
{
    /**
     *
     * @param {JsTaskConfig} config
     * @param {Logger} logger
     * @param {Kaba} kaba
     */
    constructor (config, logger, kaba)
    {
        /**
         * @private
         * @type {JsTaskConfig}
         */
        this.config = config;

        /**
         * @private
         * @type {Logger}
         */
        this.logger = logger;

        /**
         * @private
         * @type {Kaba}
         */
        this.kaba = kaba;

        /**
         * @private
         * @type {JsDirectoryTask[]}
         */
        this.directories = this.loadDirectories();

        // builds the exclude directories
        this.config.excludeDirectories = this.buildExcludeList();
    }


    /**
     * Builds the regexp which directories are excluded from the build
     *
     * @return {Array.<RegExp>}
     */
    buildExcludeList ()
    {
        return this.config.transformNodeModules.map(
            (dir) => {
                return new RegExp(`/node_modules/((?!${dir}).)*?/`);
            }
        );
    }

    /**
     * Loads all tasks
     *
     * @private
     * @returns {JsDirectoryTask[]}
     */
    loadDirectories ()
    {
        // load source dirs
        const sourceDirs = glob.sync(this.config.input, {
            absolute: true,
        });

        return sourceDirs
            .map(
                (dir) => new JsDirectoryTask(dir, this.config, this.logger.createChildLogger(BuildLogger, dir))
            );
    }


    /**
     * Runs the task
     *
     * @param {function()} done
     */
    compile (done)
    {
        const tasks = this.directories.map(
            (task) => task.compile()
        );

        Promise.all(tasks)
            .then(done);
    }


    /**
     * Validates the complete project
     * @param {function} done
     */
    validate (done)
    {
        const tasks = this.directories.map(
            (task) => task.lint()
        );

        Promise.all(tasks)
            .then((results) => {
                const hadErrors = results[0];

                if (hadErrors)
                {
                    this.kaba.setErrorExit();
                }

                done();
            });
    }
};
