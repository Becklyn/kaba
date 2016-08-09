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



    run (debug)
    {
        return new Promise (
            (resolve, reject) => {

                glob(this.config.input,
                    (error, directories) => {
                        if (error)
                        {
                            reject(error);
                        }

                        directories.map(
                            (dir) => {
                                let task = new JsDirectoryTask(dir, this.config);
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
