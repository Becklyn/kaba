"use strict";

// single steps
const autoprefixer = require("autoprefixer");
const chalk = require("chalk");
const csso = require("csso");
const fs = require("fs-extra");
const path = require("path");
const postcss = require("postcss");
const sass = require("node-sass");
const writeOutputFile = require("../../lib/file-writer");
const BuildError = require("../../lib/build-error");


/**
 *
 */
module.exports = class ScssCompiler
{
    /**
     *
     * @param {InternalScssTaskConfig} config
     * @param {Logger} logger
     */
    constructor (config, logger)
    {
        /**
         * @private
         * @type {InternalScssTaskConfig}
         */
        this.config = config;

        /**
         * @private
         * @type {Logger}
         */
        this.logger = logger;
    }


    /**
     * Compiles a single file
     * @param {string} file
     * @param {boolean} debug
     * @returns {Promise}
     */
    compileFile (file, debug)
    {
        return this.compileScss(file, debug)
            .then(
                (result) => result.css,
                (error) => { throw new BuildError(error) }
            )
            .then(css => this.postProcess(css))
            .then(
                (postProcessResult) =>
                {
                    if (!debug)
                    {
                        return this.minify(postProcessResult.css);
                    }

                    return postProcessResult.css;
                }
            )
            .then(
                (css) =>
                {
                    writeOutputFile(this.generateOutputFileName(file), css)
                }
            );
    }

    /**
     * Compiles the file in the given file path
     *
     * @private
     * @param {string} file
     * @param {boolean} debug
     * @returns {Promise}
     */
    compileScss (file, debug)
    {
        return new Promise (
            function (resolve, reject)
            {
                sass.render({
                        file: file,
                        outputStyle: "compact",
                        sourceMapEmbed: debug
                    },
                    function (err, result)
                    {
                        if (err)
                        {
                            reject (err);
                        }

                        resolve(result);
                    }
                );
            }
        );
    }


    /**
     * Post processes the CSS
     *
     * @private
     * @param {string} css
     * @returns {string}
     */
    postProcess (css)
    {
        return postcss([
            autoprefixer({
                browsers: this.config.browsers
            })
        ])
            .process(css);
    }


    /**
     * Minifies the given CSS
     *
     * @private
     * @param {string} css
     * @returns {string}
     */
    minify (css)
    {
        return csso.minify(css).css;
    }


    /**
     * Generates the output file name
     *
     * @private
     * @param {string} file
     * @returns {string}
     */
    generateOutputFileName (file)
    {
        let outputDir = path.resolve(path.dirname(file), this.config.output);

        try
        {
            // path does exist, but isn't a directory
            var stat = fs.statSync(outputDir);
            if (!stat.isDirectory())
            {
                fs.mkdirs(outputDir);
            }
        }
        catch (e)
        {
            // directory doesn't exist
            fs.mkdirs(outputDir);
        }

        let outputFilename = path.basename(file, ".scss") + ".css";
        return path.join(outputDir, outputFilename);
    }
};
