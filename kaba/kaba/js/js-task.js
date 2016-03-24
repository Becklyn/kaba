"use strict";

let browserify = require("browserify");
let watchify = require("watchify");
let babelify = require("babelify");
let glob = require("glob");
let path = require("path");
let source = require("vinyl-source-stream");
let buffer = require("vinyl-buffer");
let uglify = require("gulp-uglify");


/**
 *
 */
module.exports = class JsTask
{

    /**
     *
     * @param {Gulp} gulp
     * @param {JsTaskOptions} options
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
         * @type {JsTaskOptions}
         */
        this.options = options;
    }



    /**
     * Runs the task
     *
     * @param {Boolean} debug Flag, whether the task should run in debug mode
     * @param {function()} done
     */
    run (debug, done)
    {
        glob(this.options.inputGlob,
            (err, files) => {
                files.forEach(
                    (file) => {
                        console.time("build");
                        var browserifyInstance = browserify({
                            entries: file,
                            debug: debug
                        })
                            .plugin(babelify, {
                                presets: ["es2015"]
                            });

                        if (debug)
                        {
                            browserifyInstance = watchify(browserifyInstance);
                            browserifyInstance
                                .on("update", () => this.buildFromBrowserify(browserifyInstance));
                            // done();
                            // browserifyInstance.bundle();
                        }
                    }
                )

            }
        );
    }


    buildFromBrowserify (browserifyInstance, debug)
    {
        console.log(browserifyInstance);
        var taskPipeline = browserifyInstance
            .bundle()
            .on("error", function (error) { console.error(error.toString()); })
            .on("end", function () { console.timeEnd("build"); })
            .pipe(source(path.basename(file)))
            .pipe(buffer());

        if (!debug)
        {
            taskPipeline = taskPipeline.pipe(uglify({
                preserveComments: debug ? "all" : "license"
            }));
        }

        return taskPipeline
            .pipe(this.gulp.dest(this.options.outputDir));
    }
};
