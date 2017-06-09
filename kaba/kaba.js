const EventEmitter = require("events");
const async = require("async");
const chalk = require("chalk");
const fs = require("fs-extra");
const glob = require("glob");
const path = require("path");


/**
 * Main Kaba class
 */
class Kaba extends EventEmitter
{
    /**
     *
     */
    constructor ()
    {
        super();

        /**
         * @private
         * @type {string}
         */
        this.version = require("../package.json").version;

        /**
         * The list of all defined tasks
         *
         * @private
         * @type {{}}
         */
        this.tasks = {};

        /**
         * The name of the default task
         *
         * @private
         * @type {string}
         */
        this.DEFAULT_TASK_NAME = "";

        /**
         * @private
         * @type {number}
         */
        this.exitCode = 0;


        // define default tasks
        this.shelf = {
            scss: require("./shelf/scss")(this),
            js: require("./shelf/js")(this),
        };

        process.on("exit", () => {
            process.exit(this.exitCode);
        });
    }


    /**
     * Returns the registered task by name.
     *
     * Although this method is private, it will be used by kaba-cli
     *
     * @private
     * @param {string} taskName
     * @returns {Function|undefined}
     */
    get (taskName)
    {
        return this.tasks[this.normalizeTaskName(taskName)];
    }


    /**
     * Sets an entry in the registry
     *
     * @param {?string} taskName
     * @param {Function} taskFunction
     */
    task (taskName, taskFunction)
    {
        if (typeof taskName !== "string" && null !== taskName)
        {
            throw new Error(`Please pass a string as task name`)
        }

        if (typeof taskFunction !== "function")
        {
            throw new Error(`Only functions can be registered as tasks, ${typeof taskFunction} given.`);
        }

        taskName = this.normalizeTaskName(taskName);

        if (typeof this.tasks[taskName] !== "undefined")
        {
            if (this.DEFAULT_TASK_NAME === taskName)
            {
                throw new Error(`Default task is already defined.`);
            }
            else
            {
                throw new Error(`Task with name ${taskName} already defined.`);
            }
        }

        const taskId = this.listTasks().length;

        // generate a new task function, that properly emits the required timing events
        /**
         * @param {function} done
         * @param {KabaAppEnvironment} env
         * @param {...*} taskArguments
         */
        this.tasks[taskName] = (done, env,...taskArguments) => {

            this.ensureCompatibilityWithCliVersion(env);

            this.emit("start", {
                task: taskName,
                id: taskId
            });

            const taskDone = () => {
                this.emit("end", {
                    task: taskName,
                    id: taskId
                });
                done();
            };

            // run task
            taskFunction(taskDone, env, ...taskArguments);
        };
    }


    /**
     * Checks whether kaba is compatible with the given CLI version
     *
     * @private
     * @param {KabaAppEnvironment} env
     * @returns {boolean}
     */
    ensureCompatibilityWithCliVersion (env)
    {
        // just the presence of the attribute is enough
        if (null == env.cliVersion)
        {
            throw new Error("Your kaba version is incompatible with the used kaba-cli version. Please use kaba-cli >= 2.0");
        }
    }


    /**
     * Returns a list of all registered tasks
     *
     * @returns {string[]}
     */
    listTasks ()
    {
        return Object.keys(this.tasks);
    }



    /**
     * Transforms a list of task functions (function or name of the task)
     * into a list of their callable functions.
     *
     * @private
     * @param {Array.<string|function>} taskFunctions
     * @returns {Array.<function>}
     */
    getTaskFunctions (taskFunctions)
    {
        return taskFunctions.map(
            (fn) => (typeof fn === "function") ? fn : this.get(fn)
        );
    }


    /**
     * Prepares the task functions to be proper arguments for async.series and async.parallel calls
     *
     * @private
     * @param {Array.<function>} taskFunctions
     * @param {Array.<*>} callArguments
     * @returns {Array.<function>}
     */
    prepareTaskFunctionsForAsync (taskFunctions, callArguments)
    {
        return taskFunctions.map(
            (fn) => (asyncCallback) => fn(asyncCallback, ...callArguments)
        );
    }


    /**
     * Defines a wrapper functions that calls the given tasks in series
     *
     * @returns {function}
     */
    series (...tasks)
    {
        let taskFunctions = this.getTaskFunctions(tasks);

        return (done, ...callArguments) =>
        {
            let asyncFunctions = this.prepareTaskFunctionsForAsync(taskFunctions, callArguments);
            return async.series(asyncFunctions, done);
        };
    }


    /**
     * Defines a wrapper functions that calls the given tasks in parallel
     *
     * @returns {function}
     */
    parallel (...tasks)
    {
        let taskFunctions = this.getTaskFunctions(tasks);

        return (globalDone, ...callArguments) =>
        {
            let asyncFunctions = this.prepareTaskFunctionsForAsync(taskFunctions, callArguments);
            return async.parallel(asyncFunctions, globalDone);
        };
    }


    /**
     * Normalizes the given task name, by optionally transforming it to the default task name
     *
     * @private
     * @param {string} taskName
     * @returns {string}
     */
    normalizeTaskName (taskName)
    {
        return (null !== taskName)
            ? taskName
            : this.DEFAULT_TASK_NAME;
    }


    /**
     * Sets an error exit
     */
    setErrorExit ()
    {
        this.exitCode = 1;
    }


    /**
     * Initializes the project with the given init files
     *
     * Called internally by kaba-cli
     *
     * @private
     * @param {string} file
     * @return {string|bool} true, or the error message
     */
    initProject (file)
    {
        const targetPath = `${process.cwd()}/kabafile.js`;

        if (!/^[a-z\-_0-9]+$/.test(file))
        {
            return `Invalid init file name given. Init files may only contain a-z, 0-9, "-" and "_".`;
        }

        if (fs.existsSync(targetPath))
        {
            return `kabafile was already created, can't run init.`;
        }

        const initFiles = this.getAllInitFiles();

        if (typeof initFiles[file] === "undefined")
        {
            return `Can't find init file “${file}”.`;
        }

        fs.copySync(initFiles[file], targetPath);
        return true;
    }


    /**
     * Returns a map of all init files
     *
     * @returns {Object.<string, string>}
     */
    getAllInitFiles ()
    {
        const files = {};

        glob.sync(`${__dirname}/../init/*.js`).forEach(
            (file) => {
                files[path.basename(file, ".js")] = file;
            }
        );

        return files;
    }


    /**
     * Returns a list of all init identifiers
     *
     * Called internally by kaba-cli
     *
     * @private
     * @returns {string[]}
     */
    getAllInitIdentifiers ()
    {
        return Object.keys(this.getAllInitFiles())
            .sort();
    }
}


// export a single instance
module.exports = new Kaba();
