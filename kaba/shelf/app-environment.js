/**
 * @typedef {{
 *  debug: boolean,
 *  watch: boolean,
 *  lint: boolean,
 *  verbose: boolean,
 *  mode: string,
 *  cliVersion: ?string,
 * }} KabaAppEnvironment
 */
module.exports = {
    // Whether to build for debug
    debug: false,
    // Whether to lint the files
    lint: false,
    // Whether to start the watcher
    watch: false,
    // Whether to run in verbose mode
    verbose: false,
    // What to do when running a shelf task
    mode: "compile",
    cliVersion: null,
};
