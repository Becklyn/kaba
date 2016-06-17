"use strict";

const JsDirectoryTask = require("./js-directory-task");
const glob = require("glob");
const Promise = require("bluebird");


/**
 *
 */
module.exports = class JsTask
{
    /**
     *
     * @param {InternalJsTaskConfig} config
     */
    constructor (config)
    {
        /**
         * @private
         * @type {InternalJsTaskConfig}
         */
        this.config = config;
    }



    run (debug)
    {
        return new Promise (
            (resolve, reject) => {

                glob(this.config.srcDir,
                    (error, directories) => {
                        if (error)
                        {
                            reject(error);
                        }

                        directories.map(
                            (dir) => {
                                var task = new JsDirectoryTask(dir, this.config);
                                task.run(debug);
                            }
                        );

                        resolve();
                    }
                );
            }
        );
    }
};
