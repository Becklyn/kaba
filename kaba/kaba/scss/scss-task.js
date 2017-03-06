"use strict";

// libraries
const chokidar = require("chokidar");
const glob = require("glob");
const path = require("path");
const fs = require("fs-extra");
const Promise = require("bluebird");
const writeOutputFile = require("../../lib/file-writer");
const chalk = require("chalk");

const ScssDependencyResolver = require("./scss-dependency-resolver");
const ScssLinter = require("./scss-linter");
const Logger = require("../../lib/logger");
const ScssDirectoryTask = require("./scss-directory-task");




module.exports = class ScssTask
{
    /**
     *
     * @param {ScssTaskConfig} config
     */
    constructor (config)
    {
        /**
         * @private
         * @type {ScssTaskConfig}
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
     */
    run (done)
    {
        // compile project and start watchers
        // the watchers ignore the initial events, as otherwise all dependencies would repeatedly
        // issue a recompile on the main file
        const compilePipeline = this.compileProject();

        if (this.config.watch)
        {
            this.watchProject()
                .then(done);
        }
        else
        {
            compilePipeline
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
                glob(this.config.input,
                    (error, directories) =>
                    {
                        if (error)
                        {
                            reject(error);
                        }

                        let tasks = [];

                        directories.forEach(
                            (dir) => {
                                let task = new ScssDirectoryTask(dir, this.config);
                                tasks.push(task.compile());
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
                glob(this.config.input,
                    (error, directories) =>
                    {
                        if (error)
                        {
                            reject(error);
                        }

                        directories.forEach(
                            (dir) => {
                                let task = new ScssDirectoryTask(dir, this.config);
                                task.watch();
                            }
                        );

                        process
                            .on("SIGINT", () => {
                                resolve();
                                setTimeout(process.exit, 1);
                            });
                    }
                )
            }
        );
    }
};
