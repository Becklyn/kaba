"use strict";

/**
 * @typedef {{
 *      imports: String[],
 *      importedBy: String[],
 *      modified: Date
 * }} SassGraphIndexValue
 */

let sassGraph = require("sass-graph");


module.exports = class ScssDependencyResolver
{
    /**
     *
     * @param {string} baseDir
     */
    constructor (baseDir)
    {
        /**
         * @private
         * @type {string}
         */
        this.baseDir = baseDir;
    }

    /**
     * Returns the index for the directory
     *
     * @private
     * @returns {Object<string, SassGraphIndexValue>}
     */
    getIndex ()
    {
        return sassGraph.parseDir(
            this.baseDir,
            {
                extension: ["scss"]
            }
        ).index;
    }


    /**
     * Returns the files that import the given file (recursively)
     *
     * @param {String} file
     * @returns {String[]}
     */
    findDependents (file)
    {
        return this.recursivelyFindEntries(file, "importedBy");
    }


    /**
     * Returns a list of all (recursively) imported files
     *
     * @param {String} file
     * @returns {String[]}
     */
    findDependencies (file)
    {
        return this.recursivelyFindEntries(file, "imports");
    }

    /**
     * Recursively finds entries in the index
     *
     * @param {String} file
     * @param {String} property the property to search in the index
     * @returns {String[]}
     */
    recursivelyFindEntries (file, property)
    {
        let index = this.getIndex();
        let foundFiles = [];

        if (!index[file])
        {
            return [];
        }

        index[file][property].forEach(
            (relatedFile) =>
            {
                foundFiles.push(relatedFile);
                foundFiles = foundFiles.concat(this.recursivelyFindEntries(relatedFile, property));
            }
        );

        return foundFiles;
    }
};
