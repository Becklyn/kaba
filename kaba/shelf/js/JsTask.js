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
    }


    /**
     * Runs the task
     *
     * @param {function()} done
     */
    compile (done)
    {
        glob(this.config.input,
            (error, directories) =>
            {
                if (error)
                {
                    this.logger.error(error);
                    done();
                    return;
                }

                directories.map(
                    (dir) => {
                        const task = new JsDirectoryTask(dir, this.config, this.logger.createChildLogger(BuildLogger, dir));
                        task.run();
                    }
                );

                if (this.config.watch)
                {
                    process
                        .on("SIGINT", () => {
                            done();
                            setTimeout(process.exit, 1);
                        });
                }
                else
                {
                    done();
                }
            }
        );
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
