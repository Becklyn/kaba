"use strict";

// libraries
let chokidar = require("chokidar");
let glob = require("glob");
let path = require("path");
let fs = require("fs-extra");
let Promise = require("bluebird");
let writeOutputFile = require("../../lib/file-writer");
const chalk = require("chalk");

const ScssDependencyResolver = require("./scss-dependency-resolver");
let ScssLinter = require("./scss-linter");
let Logger = require("../../lib/logger");
const ScssDirectoryTask = require("./scss-directory-task");




module.exports = class ScssTask
{
    /**
     *
     * @param {InternalScssTaskConfig} config
     */
    constructor (config)
    {
        /**
         * @private
         * @type {InternalScssTaskConfig}
         */
        this.config = config;

        /**
         * @private
         * @type {ScssDependencyResolver}
         */
        // this.dependencyResolver = new ScssDependencyResolver(path.dirname(config.input));

        /**
         * @private
         * @type {ScssLinter}
         */
        this.linter = new ScssLinter(config);
    }



    /**
     * Runs the task
     *
     * @param {function} done
     * @param {Boolean} debug Flag, whether the task should run in debug mode
     */
    run (done, debug)
    {
        if (debug)
        {
            this.watchProject();
        }
        else
        {
            this.compileProject()
                .then(done);
        }
    }



    /**
     * Compiles the complete project
     *
     * @private
     */
    compileProject ()
    {
        return new Promise(
            (resolve, reject) => {
                glob(this.config.srcDir,
                    (error, directories) => {
                        var tasks = [];

                        directories.forEach(
                            (dir) => {
                                var task = new ScssDirectoryTask(dir, this.config);
                                tasks.push(task.compile(false));
                            }
                        );

                        Promise.all(tasks)
                            .then(resolve);
                    }
                )
            }
        );
    }

    /**
     * Watches the complete project
     *
     * @private
     */
    watchProject ()
    {
        return new Promise(
            (resolve, reject) => {
                glob(this.config.srcDir,
                    (error, directories) => {
                        directories.forEach(
                            (dir) => {
                                var task = new ScssDirectoryTask(dir, this.config);
                                task.watch();
                            }
                        )
                    }
                )
            }
        );
    }
};
