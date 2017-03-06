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



    run (done, debug)
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
                        task.run(debug);
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
