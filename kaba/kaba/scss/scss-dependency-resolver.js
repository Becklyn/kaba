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
        let foundFiles = {};
        this.recursivelyFindEntries(this.getIndex(), file, "importedBy", foundFiles);

        return Object.keys(foundFiles);
    }


    /**
     * Returns a list of all (recursively) imported files
     *
     * @param {String} file
     * @returns {String[]}
     */
    findDependencies (file)
    {
        let foundFiles = {};
        this.recursivelyFindEntries(this.getIndex(), file, "imports", foundFiles);
        return Object.keys(foundFiles);
    }

    /**
     * Recursively finds entries in the index
     *
     * @param {*} index
     * @param {string} file the file to find entries for
     * @param {string} property the property to search in the index
     * @param {Object<string, Boolean>} foundFiles the already found files
     */
    recursivelyFindEntries (index, file, property, foundFiles)
    {
        if (!index[file])
        {
            return;
        }

        index[file][property].forEach(
            (relatedFile) =>
            {
                if (!foundFiles[relatedFile])
                {
                    foundFiles[relatedFile] = true;
                    this.recursivelyFindEntries(relatedFile, property, foundFiles);
                }
            }
        );
    }
};
