"use strict";

const inherits = require('util').inherits;
const EventEmitter = require('events').EventEmitter;
const async = require("async");

// Define Kaba class
function Kaba ()
{
    EventEmitter.call(this);
    this.tasks = {};
    this.taskCounter = 0;

    /**
     * @const
     * @type {string}
     */
    this.DEFAULT_TASK_NAME = "";
}

inherits(Kaba, EventEmitter);

/**
 * Sets an entry in the registry
 *
 * @private
 * @param {string} taskName
 * @param {Function} taskFunction
 */
Kaba.prototype.set = function (taskName, taskFunction)
{
    // normalize null to default task name
    if (null === taskName)
    {
        taskName = this.DEFAULT_TASK_NAME;
    }

    if (this.tasks[taskName])
    {
        if (this.DEFAULT_TASK_NAME === taskName)
        {
            throw new Error("Default task is already defined.");
        }
        else
        {
            throw new Error("Task with name " + taskName + " already defined.");
        }
    }

    if (typeof taskFunction !== "function")
    {
        throw new Error("Only functions can be registered as tasks, " + typeof taskFunction + " given.");
    }

    var taskId = this.taskCounter;
    this.taskCounter += 1;

    // generate a new task function, that properly emits the required timing events
    this.tasks[taskName] = (done, ...taskArguments) => {
        this.emit("start", {
            task: taskName,
            id: taskId
        });

        var taskDone = () => {
            this.emit("end", {
                task: taskName,
                id: taskId
            });
            done();
        };

        // run task
        taskFunction(taskDone, ...taskArguments);
    };
};


/**
 * Returns the registered task by name
 *
 * @private
 * @param {string} taskName
 * @returns {Function|undefined}
 */
Kaba.prototype.get = function (taskName)
{
    // normalize null to default task name
    if (null === taskName)
    {
        taskName = this.DEFAULT_TASK_NAME;
    }

    return this.tasks[taskName];
};


/**
 * Registers or fetches a task by name.
 *
 * If no callback is given, the task with the given name is returned.
 * If a callback is give, the task is registered with the given name.
 *
 * @param {?string} taskName
 * @param {?function} callback
 * @returns {function|undefined}
 */
Kaba.prototype.task = function (taskName, callback = null)
{
    if (!callback)
    {
        return this.get(taskName);
    }

    return this.set(taskName, callback);
};

/**
 * Returns a list of all registered tasks
 *
 * @returns {string[]}
 */
Kaba.prototype.listTasks = function ()
{
    return Object.keys(this.tasks);
};


/**
 * Transforms a list of task functions (function or name of the task)
 * into a list of callable functions
 *
 * @private
 * @param {Array.<string|function>} taskFunctions
 * @returns {Array.<function>}
 */
Kaba.prototype.normalizeTaskFunctions = function (taskFunctions)
{
    return taskFunctions.map(
        (fn) => (typeof fn === "function") ? fn : this.get(fn)
    );
};


/**
 * Prepares the task functions to be proper arguments for async.series and async.parallel calls
 *
 * @private
 * @param {Array.<function>} taskFunctions
 * @param {Array} callArguments
 * @returns {Array<function>}
 */
Kaba.prototype.prepareTaskFunctionsForAsync = function (taskFunctions, callArguments)
{
    return taskFunctions.map(
        /**
         *
         * @param {Function} fn
         */
        (fn) => {
            return function(asyncCallback)
            {
                fn(asyncCallback, ...callArguments);
            }
        }
    );
};


/**
 * Defines a wrapper functions that calls the given tasks ins series
 *
 * @returns {Function}
 */
Kaba.prototype.series = function (...taskFunctions)
{
    var normalizedTaskFunctions = this.normalizeTaskFunctions(taskFunctions);

    return (globalDone, ...callArguments) =>
    {
        var transformedFunctions = this.prepareTaskFunctionsForAsync(normalizedTaskFunctions, callArguments);
        return async.series(transformedFunctions, globalDone);
    };
};


/**
 * Defines a wrapper functions that calls the given tasks in parallel
 *
 * @returns {Function}
 */
Kaba.prototype.parallel = function (...taskFunctions)
{
    var normalizedTaskFunctions = this.normalizeTaskFunctions(taskFunctions);

    return (globalDone, ...callArguments) =>
    {
        var transformedFunctions = this.prepareTaskFunctionsForAsync(normalizedTaskFunctions, callArguments);
        return async.parallel(transformedFunctions, globalDone);
    };
};



// define default tasks
Kaba.prototype.shelf = {
    scss: require("./kaba/scss"),
    js: require("./kaba/js")
};


module.exports = new Kaba();
