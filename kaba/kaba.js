const EventEmitter = require("events");
const async = require("async");


/**
 * Main Kaba class
 */
class Kaba extends EventEmitter
{
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
     * @private
     * @param {?string} taskName
     * @param {Function} taskFunction
     */
    task (taskName, taskFunction)
    {
        taskName = this.normalizeTaskName(taskName);

        if (this.tasks[taskName])
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

        if (typeof taskFunction !== "function")
        {
            throw new Error(`Only functions can be registered as tasks, ${typeof taskFunction} given.`);
        }

        const taskId = this.listTasks().length;

        // generate a new task function, that properly emits the required timing events
        this.tasks[taskName] = (done, ...taskArguments) => {
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
            taskFunction(taskDone, ...taskArguments);
        };
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
}


// export a single instance
module.exports = new Kaba();
