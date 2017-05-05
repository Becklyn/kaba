const BuildError = require("../../lib/build-error");
const Promise = require("bluebird");
const autoprefixer = require("autoprefixer");
const csso = require("csso");
const path = require("path");
const postcss = require("postcss");
const sass = require("node-sass");
const writeOutputFile = require("../../lib/file-writer");


/**
 *
 */
module.exports = class ScssCompiler
{
    /**
     *
     * @param {string} srcDir
     * @param {string} outputDir
     * @param {ScssTaskConfig} config
     * @param {Logger} logger
     */
    constructor (srcDir, outputDir, config, logger)
    {
        /**
         * @private
         * @type {string}
         */
        this.srcDir = srcDir;

        /**
         * @private
         * @type {string}
         */
        this.outputDir = outputDir;

        /**
         * @private
         * @type {ScssTaskConfig}
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
     * @returns {Promise}
     */
    compileFile (file)
    {
        return this.compileScss(file)
            .then(
                (result) => result.css,
                (error) => {
                    throw new BuildError(error);
                }
            )
            .then((css) => this.postProcess(css))
            .then(
                /** @type {{css: string}} postProcessResult */
                (postProcessResult) =>
                {
                    if (!this.config.debug)
                    {
                        return this.minify(postProcessResult.css);
                    }

                    return postProcessResult.css;
                }
            )
            .then(
                (css) =>
                {
                    writeOutputFile(this.generateOutputFileName(file), css);
                }
            );
    }


    /**
     * Compiles the file in the given file path
     *
     * @private
     * @param {string} file
     * @returns {Promise}
     */
    compileScss (file)
    {
        return new Promise(
            (resolve, reject) =>
            {
                sass.render({
                        file: file,
                        outputStyle: "compact",
                        sourceMapEmbed: this.config.debug,
                    },
                    function (err, result)
                    {
                        if (err)
                        {
                            reject(err);
                            return;
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
        let relativeSrcPath = path.relative(this.srcDir, file);
        let outputFileName = path.basename(file, ".scss") + ".css";
        outputFileName = this.config.outputFileName(outputFileName, path.basename(file));

        // join output dir + relative src dir + file name (with extension switched to css)
        return path.join(
            this.outputDir,
            path.dirname(relativeSrcPath),
            outputFileName
        );
    }
};
