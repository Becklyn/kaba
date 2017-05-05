"use strict";

const BuildError = require("../../lib/build-error");
const chalk = require("chalk");
const chokidar = require("chokidar");
const glob = require("glob");
const path = require("path");
const Promise = require("bluebird");
const ScssCompiler = require("./scss-compiler");
const ScssDependencyResolver = require("./scss-dependency-resolver");
const ScssLinter = require("./scss-linter");


/**
 *
 */
module.exports = class ScssDirectoryTask
{
    /**
     *
     * @param {string} srcDir
     * @param {ScssTaskConfig} config
     * @param {BuildLogger} logger
     */
    constructor (srcDir, config, logger)
    {
        /**
         * @private
         * @type {string}
         */
        this.srcDir = srcDir.replace(/\/+$/, "");

        /**
         * @private
         * @type {string}
         */
        this.outputDir = path.resolve(this.srcDir, config.output);

        /**
         * @private
         * @type {ScssTaskConfig}
         */
        this.config = config;

        /**
         * @private
         * @type {BuildLogger}
         */
        this.logger = logger;

        /**
         * @private
         * @type {ScssCompiler}
         */
        this.compiler = new ScssCompiler(this.srcDir, this.outputDir, config, this.logger);

        /**
         * @private
         * @type {ScssDependencyResolver}
         */
        this.dependencyResolver = new ScssDependencyResolver(this.srcDir);

        /**
         * @private
         * @type {ScssLinter}
         */
        this.linter = new ScssLinter(config, this.dependencyResolver);
    }


    /**
     * Compiles the complete directory
     *
     * @returns {Promise}
     */
    compile ()
    {
        return new Promise(
            (resolve, reject) => {
                glob(
                    this.srcDir + "/!(_)*.scss",
                    (error, files) => {
                        if (error)
                        {
                            reject(error);
                        }

                        let tasks = this.compileFileList(files);

                        if (this.config.lint)
                        {
                            files.forEach(
                                (file) => this.linter.lintWithDependencies(file)
                            );
                        }

                        Promise.all(tasks)
                            .then(resolve);
                    }
                );
            }
        );
    }


    /**
     * Lints the complete directory
     *
     * @return {Promise}
     */
    lint ()
    {
        return new Promise(
            (resolve, reject) => {
                glob(
                    this.srcDir + "/!(_)*.scss",
                    (error, files) =>
                    {
                        if (error)
                        {
                            reject(error);
                            return;
                        }

                        const tasks = files.map(
                            (file) => this.linter.lintWithDependencies(file)
                        );

                        Promise.all(tasks)
                            .then(resolve);
                    }
                );
            }
        );
    }


    /**
     * Compiles the list of files
     *
     * @private
     * @param {String[]} files
     *
     * @return {Promise[]}
     */
    compileFileList (files)
    {
        const compiledFiles = {};
        const tasks = [];

        files.filter(
            // filter hidden SCSS files
            (file) => 0 !== path.basename(file).indexOf("_")
        )
            .forEach(
                (file) =>
                {
                    // filter out duplicates
                    if (!compiledFiles[file])
                    {
                        let task = this.compileFile(file);
                        tasks.push(task);
                        compiledFiles[file] = true;
                    }
                }
            );

        return tasks;
    }



    /**
     * Compiles a single file
     *
     * @private
     * @param {string} file
     * @returns {Promise}
     */
    compileFile (file)
    {
        return this.compiler.compileFile(file)
            .then(
                () => this.logger.log(`Compiled ${chalk.yellow(path.basename(file))}`)
            )
            .catch(
                (error) => {
                    if (error instanceof BuildError)
                    {
                        this.logger.logBuildError(error);
                    }
                    else
                    {
                        this.logger.error(error);
                    }
                }
            );
    }


    /**
     * Starts the watcher for the complete directory
     */
    watch ()
    {
        this.logger.log(`Started watching ${chalk.yellow(this.srcDir)}`);

        chokidar.watch(`${this.srcDir}/**/*.scss`, {
            ignoreInitial: true,
        })
            .on("add", (file) => this.onFileChanged(file))
            .on("change", (file) => this.onFileChanged(file));
    }


    /**
     * Callback on when a file has changed or added/deleted
     *
     * @private
     * @param {String} file
     */
    onFileChanged (file)
    {
        // refresh index after files have changed
        this.dependencyResolver.refreshIndex();

        // we can always lint the file, as the changed callback is only called in debug mode
        this.linter.lint(file);

        // find dependents to generate compile list
        const changedFiles = this.dependencyResolver.findDependents(file);

        // add the current file to the compile list
        changedFiles.push(file);

        // compile the list of files
        this.compileFileList(changedFiles);
    }
};
