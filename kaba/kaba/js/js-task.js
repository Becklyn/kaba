"use strict";

let browserify = require("browserify");
let tsify = require("tsify");
let typescript = require("typescript");
let glob = require("glob");
let path = require("path");
let source = require('vinyl-source-stream');
let buffer = require('vinyl-buffer');


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
                        browserify({
                            entries: file
                        })
                            .plugin(tsify, {
                                target: typescript.ScriptTarget.ES5,
                                module: typescript.ModuleKind.CommonJS,
                                removeComments: true
                            })
                            .bundle()
                            .on('error', function (error) { console.error(error.toString()); })
                            .on('end', function () { console.timeEnd("build"); })
                            .pipe(source(path.basename(file)))
                            .pipe(buffer())
                            .pipe(this.gulp.dest(this.options.outputDir));

                    }
                )

            }
        );
    }
};
