const BuildLogger = require("../../lib/BuildLogger");
const JsDirectoryTask = require("./JsDirectoryTask");
const glob = require("glob");


/**
 *
 */
module.exports = class JsTask
{
    /**
     *
     * @param {JsTaskConfig} config
     * @param {Logger} logger
     */
    constructor (config, logger)
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
         * @type {JsDirectoryTask[]}
         */
        this.directories = this.loadDirectories();
    }


    /**
     * Loads all tasks
     *
     * @private
     * @returns {JsDirectoryTask[]}
     */
    loadDirectories ()
    {
        return glob.sync(this.config.input)
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
     * Lints the complete project
     * @param {function} done
     */
    lint (done)
    {
        this.logger.error("No linting implemented yet.");
        done();
    }
};
