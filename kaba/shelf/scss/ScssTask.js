const BuildLogger = require("../../lib/BuildLogger");
const Promise = require("bluebird");
const ScssDirectoryTask = require("./ScssDirectoryTask");
const ScssLinter = require("./ScssLinter");
const glob = require("glob");


module.exports = class ScssTask
{
    /**
     *
     * @param {ScssTaskConfig} config
     * @param {Logger} logger
     * @param {Kaba} kaba
     */
    constructor (config, logger, kaba)
    {
        /**
         * @private
         * @type {ScssTaskConfig}
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
         * @type {ScssLinter}
         */
        this.linter = new ScssLinter(config);

        /**
         * All directory tasks
         *
         * @private
         * @type {ScssDirectoryTask[]}
         */
        this.directories = this.loadDirectories();
    }


    /**
     * Compiles the project
     *
     * @param {function} done
     */
    compile (done)
    {
        // compile project and start watchers
        // the watchers ignore the initial events, as otherwise all dependencies would repeatedly
        // issue a recompile on the main file
        const compilePipeline = this.compileProject();

        if (this.config.watch)
        {
            compilePipeline
                .then(() => this.watchProject())
                .then(done);
        }
        else
        {
            compilePipeline
                .then(done);
        }
    }

    /**
     * Lints all files
     *
     * @param {function} done
     */
    lint (done)
    {
        const tasks = this.directories.map(
            (task) => task.lint()
        );

        Promise.all(tasks)
            .then((results) => {

                if (results.includes(true))
                {
                    this.kaba.setErrorExit();
                }

                done();
            });
    }


    /**
     * Loads all tasks
     *
     * @private
     * @returns {ScssDirectoryTask[]}
     */
    loadDirectories ()
    {
        return glob.sync(this.config.input)
            .map(
                (dir) => new ScssDirectoryTask(dir, this.config, this.logger.createChildLogger(BuildLogger, dir))
            );
    }


    /**
     * Compiles the complete project
     *
     * @private
     */
    compileProject ()
    {
        const tasks = this.directories.map(
            (task) => task.compile()
        );

        return Promise.all(tasks);
    }


    /**
     * Watches the complete project
     *
     * @private
     */
    watchProject ()
    {
        return new Promise(
            (resolve) => {

                this.directories.map(
                    (task) => task.watch()
                );

                process
                    .on("SIGINT", (event) => {
                        resolve();
                        setTimeout(process.exit, 1);
                    });
            }
        );
    }
};
