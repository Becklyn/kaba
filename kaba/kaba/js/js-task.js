const JsDirectoryTask = require("./js-directory-task");
const glob = require("glob");


/**
 *
 */
module.exports = class JsTask
{
    /**
     *
     * @param {JsTaskConfig} config
     */
    constructor (config)
    {
        /**
         * @private
         * @type {JsTaskConfig}
         */
        this.config = config;
    }


    /**
     * Runs the task
     *
     * @param {function()} done
     */
    run (done)
    {
        glob(this.config.input,
            (error, directories) => {
                if (error)
                {
                    throw error;
                }

                directories.map(
                    (dir) => {
                        let task = new JsDirectoryTask(dir, this.config);
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
};
