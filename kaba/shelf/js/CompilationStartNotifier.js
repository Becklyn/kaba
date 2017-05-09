const chalk = require("chalk");
const path = require("path");


module.exports = class CompilationStartNotifier
{
    /**
     * @param {BuildLogger} logger
     */
    constructor (logger)
    {
        /**
         * @private
         * @type {BuildLogger}
         */
        this.logger = logger;
    }


    /**
     *
     * @param {webpack.Compiler} compiler
     */
    apply (compiler)
    {
        compiler.plugin(
            "compilation",
            /**
             *
             * @param {Compilation} compilation
             */
            (compilation) => this.logger.log(`Start build ${chalk.blue(path.relative(process.cwd(), compilation.options.entry))}`)
        );
    }
}
