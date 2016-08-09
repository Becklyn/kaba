"use strict";

let browserify = require("browserify");
let watchify = require("watchify");
let glob = require("glob");
let path = require("path");
let Promise = require("bluebird");
let fs = require("fs-extra");
let fileWriter = require("../../lib/file-writer");
let Logger = require("../../lib/logger");
let chalk = require("chalk");
let globalsTransform = require("../../browserify/globals-transform");
let bundleCollapser = require("bundle-collapser");
let StreamHelper = require("../../lib/stream-helper");

let minify = require("./minify");
let lint = require("./lint");


/**
 *
 */
module.exports = class JsDirectoryTask
{
    /**
     * @param {string} srcDir
     * @param {JsTaskConfig} config
     */
    constructor (srcDir, config)
    {
        /**
         * @private
         * @type {JsTaskConfig}
         */
        this.config = config;

        /**
         * @private
         * @type {string}
         */
        this.srcDir = srcDir;


        /**
         * The input glob with which the files are matched
         *
         * @private
         * @type {string}
         */
        this.inputFilesGlob = srcDir + "/*.js";

        /**
         * @private
         * @type {string}
         */
        this.outputDir = path.resolve(this.srcDir, config.output);

        /**
         * @private
         * @type {Logger}
         */
        this.logger = new Logger("JS", "blue", srcDir);
    }



    /**
     * Runs the task
     *
     * @param {Boolean} debug Flag, whether the task should run in debug mode
     */
    run (debug)
    {
        this.compileProject(debug);
    }


    /**
     *
     * @param debug
     */
    compileProject (debug)
    {
        glob(this.inputFilesGlob,
            (err, files) => {
                files.forEach(
                    (file) => {
                        console.time("build");

                        // create browserify instance
                        var browserifyInstance = browserify({
                            cache: {},
                            packageCache: {},
                            entries: file,
                            debug: debug,
                            fullPaths: true // debug
                        });

                        // load plugins
                        browserifyInstance.transform("babelify", {
                            presets: ["es2015"]
                        });
                        browserifyInstance.transform(globalsTransform, {
                            global: true,
                            globals: {
                                jquery: "window.jQuery",
                                dropzone: "window.Dropzone",
                                routing: "window.Routing"
                            }
                        });

                        // register event listeners
                        browserifyInstance
                            .on("file", (file) => this.logger.log("Build: " + file));

                        // register debug modes
                        if (debug)
                        {
                            // add watchify as plugin
                            browserifyInstance.plugin(watchify);

                            // register event listener for linter and update
                            browserifyInstance
                                .on("update", () => this.buildFromBrowserify(browserifyInstance, file, debug))
                                .on("file", (file) => lint(file, this.srcDir, this.config));
                        }

                        // if not debug, build from the browserify instance
                        this.buildFromBrowserify(browserifyInstance, file, debug);
                    }
                )

            }
        );
    }

    /**
     *
     * @param browserifyInstance
     * @param file
     * @param debug
     */
    buildFromBrowserify (browserifyInstance, file, debug)
    {
        let buffers = [];

        StreamHelper.readStream(browserifyInstance.bundle())
            .then(
                (code) =>
                {
                    return StreamHelper.readStream(bundleCollapser(code));
                }
            )
            .then(
                (code) => {
                    code = minify(code, debug);

                    if (null !== code)
                    {
                        fileWriter(this.generateOutputFileName(file), code);
                    }
                }
            )
            .catch(
                (error) => this.logger.log("ERROR: " + error.message)
            )
    }


    /**
     * Generates the output file name
     * @param {string} file
     * @returns {string}
     */
    generateOutputFileName (file)
    {
        return path.join(
            this.outputDir,
            path.relative(this.srcDir, file)
        );
    }
};
