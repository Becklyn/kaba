"use strict";

// libraries
let chokidar = require("chokidar");
let gulp = require("gulp");
let glob = require("glob");
let path = require("path");
let sourcemaps = require('gulp-sourcemaps');
let Promise = require("bluebird");

let ScssDependencyResolver = require("./scss-dependency-resolver");
let ScssLinter = require("./scss-linter");

// single steps
let compile = require("./compile");
let postProcess = require("./post-process");


module.exports = class ScssTask
{
    /**
     *
     * @param {Gulp} gulp
     * @param {ScssTaskOptions} options
     */
    constructor (gulp, options)
    {
        /**
         * @private
         * @type {Gulp}
         */
        this.gulp = gulp;


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
    }



    /**
     * Runs the task
     *
     * @param {Boolean} debug Flag, whether the task should run in debug mode
     * @param {function()} done
     */
    run (debug, done)
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

            // call done callback as we will never end
            done();
        }
        else
        {
            this.compileProject(false, done);
        }
    }



    /**
     * Lints the complete project
     *
     * @private
     */
    lintProject ()
    {
        glob(this.options.inputGlob,
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
     * @param {Function=} done
     */
    compileProject (debug, done)
    {
        glob(this.options.inputGlob,
            (error, files) =>
            {
                let tasks = this.compileFiles(files, debug);

                if (done)
                {
                    Promise.all(tasks).then(() => done());
                }
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
        return new Promise(
            (resolve, reject) => {

                let task = this.gulp.src(file)
                    .on('end', resolve)
                    .on('error', reject);

                if (debug)
                {
                    task = task
                        .pipe(sourcemaps.init());
                }

                task = task
                    .pipe(compile())
                    .pipe(postProcess(this.options));

                if (debug)
                {
                    task = task
                        .pipe(sourcemaps.write());
                }

                return task
                    .pipe(gulp.dest(this.options.outputDir));
            }
        );
    }
};
