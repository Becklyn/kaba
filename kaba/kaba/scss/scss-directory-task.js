"use strict";

const BuildError = require("../../lib/build-error");
const chalk = require("chalk");
const chokidar = require("chokidar");
const glob = require("glob");
const Logger = require("../../lib/logger");
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
     */
    constructor (srcDir, config)
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
         * @type {Logger}
         */
        this.logger = new Logger("CSS", "blue", this.srcDir);

        /**
         * @private
         * @type {?FSWatcher}
         */
        this.watcher = null;

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
     * @param {boolean} debug
     * @param {boolean} lint
     */
    compile (debug, lint = false)
    {
        return new Promise(
            (resolve, reject) => {
                glob(
                    this.srcDir + "/!(_)*.scss",
                    (error, files) => {
                        let tasks = this.compileFileList(files, debug);

                        if (lint)
                        {
                            files.forEach(
                                (file) => this.linter.lintWithDependencies(file)
                            );
                        }

                        Promise.all(tasks)
                            .then(resolve);
                    }
                )
            }
        );
    }



    /**
     * Compiles the list of files
     *
     * @private
     * @param {String[]} files
     * @param {Boolean} debug
     *
     * @return {Promise[]}
     */
    compileFileList (files, debug)
    {
        let compiledFiles = {};
        let tasks = [];

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
                        let task = this.compileFile(file, debug);
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
     * @param {boolean} debug
     * @returns {Promise}
     */
    compileFile (file, debug)
    {
        return this.compiler.compileFile(file, this.outputDir, debug)
            .then(
                () => this.logger.log("Compiled " + chalk.yellow(path.basename(file)))
            )
            .catch(
                (error) => {
                    if (error instanceof BuildError)
                    {
                        this.logger.logBuildError(error);
                    }
                    else
                    {
                        this.logger.logError(error);
                    }
                }
            );
    }


    /**
     * Lints the complete project
     */
    lint ()
    {
        return new Promise(
            (resolve, reject) => {
                glob(
                    this.srcDir + "/!(_)*.scss",
                    (error, files) => {
                        files.forEach(file => this.linter.lint(file))
                    }
                )
            }
        );
    }



    /**
     * Starts the watcher for the complete directory
     */
    watch ()
    {
        this.logger.log("Started watching " + chalk.yellow(this.srcDir));

        this.watcher = chokidar.watch(this.srcDir + "/**/*.scss", {
            ignoreInitial: true
        })
            .on("add", path => this.onFileChanged(path))
            .on("change", path => this.onFileChanged(path));
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
        let changedFiles = this.dependencyResolver.findDependents(file);

        // add the current file to the compile list
        changedFiles.push(file);

        // compile the list of files
        this.compileFileList(changedFiles, true);
    }
};
