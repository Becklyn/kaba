"use strict";

// libraries
let chokidar = require("chokidar");
let glob = require("glob");
let path = require("path");
let fs = require("fs");
let Promise = require("bluebird");
let writeOutputFile = require("../../lib/file-writer");

let ScssDependencyResolver = require("./scss-dependency-resolver");
let ScssLinter = require("./scss-linter");
let Logger = require("../../lib/logger");

// single steps
let compile = require("./compile");
let postProcess = require("./post-process");
let minify = require("./minify");


module.exports = class ScssTask
{
    /**
     *
     * @param {ScssTaskOptions} options
     */
    constructor (options)
    {
        /**
         * @private
         * @type {ScssTaskOptions}
         */
        this.options = options;

        /**
         * @private
         * @type {ScssDependencyResolver}
         */
        this.dependencyResolver = new ScssDependencyResolver(options.inputDir);

        /**
         * @private
         * @type {ScssLinter}
         */
        this.linter = new ScssLinter(options, this.dependencyResolver);

        /**
         * @private
         * @type {Logger}
         */
        this.logger = new Logger("CSS", "blue", this.options.inputDir);
    }



    /**
     * Runs the task
     *
     * @param {Boolean} debug Flag, whether the task should run in debug mode
     */
    run (debug)
    {
        if (debug)
        {
            this.lintProject();
            this.compileProject(true);

            chokidar.watch(this.options.inputGlob, {
                ignoreInitial: true
            })
                .on("add", path => this.onFileChanged(path))
                .on("change", path => this.onFileChanged(path));
        }
        else
        {
            this.compileProject(false);
        }
    }



    /**
     * Lints the complete project
     *
     * @private
     */
    lintProject ()
    {
        glob(this.options.topLevelInputGlob,
            (error, files) =>
            {
                files.forEach(
                    (file) => this.linter.lintWithDependencies(file)
                );
            }
        );
    }



    /**
     * Callback on when a file has changed or added/deleted
     *
     * @private
     * @param {String} file
     */
    onFileChanged (file)
    {
        // we can always lint the file, as the changed callback is only called in debug mode
        this.linter.lint(file);

        // find dependents to generate compile list
        let changedFiles = this.dependencyResolver.findDependents(file);

        // add the current file to the compile list
        changedFiles.push(file);

        // compile the list of files
        this.compileFiles(changedFiles, true);
    }



    /**
     * Compiles the complete project
     *
     * @param {Boolean} debug
     */
    compileProject (debug)
    {
        glob(this.options.topLevelInputGlob,
            (error, files) =>
            {
                let tasks = this.compileFiles(files, debug);
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
    compileFiles (files, debug)
    {
        let compiledFiles = {};
        let tasks = [];

        files.filter(
            // filter hidden SCSS files
            (file) =>  0 !== path.basename(file).indexOf("_")
        )
        .forEach(
            (file) =>
            {
                // filter out duplicates
                if (!compiledFiles[file])
                {
                    let task = this.compileSingleFile(file, debug);
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
     * @param {String} file
     * @param {Boolean} debug
     *
     * @return {Promise}
     */
    compileSingleFile (file, debug)
    {
        return compile(file, debug)
            .then(
                (result) =>
                {
                    return result.css;
                },
                (error) =>
                {
                    this.logger.logBuildError(error);
                }
            )
            .then(
                (css) =>
                {
                    return postProcess(css, this.options);
                }
            )
            .then(
                (postProcessResult) =>
                {
                    if (!debug)
                    {
                        return minify(postProcessResult.css);
                    }

                    return postProcessResult.css;
                }
            )
            .then(
                (css) =>
                {
                    writeOutputFile(this.generateOutputFileName(file), css)
                }
            )
            .then(
                () =>
                {
                    this.logger.logAction("Compiled", path.relative(this.options.inputDir, file));
                }
            )
            .catch(
                (err) => this.logger.logError(err)
            );
    }


    /**
     * Generates the output file name
     * @param {string} file
     * @returns {string}
     */
    generateOutputFileName (file)
    {
        let relativePath = path.relative(this.options.inputDir, file);
        let relativeDirName = path.dirname(relativePath);
        relativeDirName = "." === relativeDirName ? "" : relativeDirName;

        return this.options.outputDir + "/" + relativeDirName + path.basename(relativePath, ".scss") + ".css";
    }
};
