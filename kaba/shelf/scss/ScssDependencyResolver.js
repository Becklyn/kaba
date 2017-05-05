/**
 * @typedef {{
 *      imports: String[],
 *      importedBy: String[],
 *      modified: Date
 * }} SassGraphIndexValue
 */

const sassGraph = require("sass-graph");
const path = require("path");


module.exports = class ScssDependencyResolver
{
    /**
     *
     * @param {string} dir
     */
    constructor (dir)
    {
        /**
         * @private
         * @type {string}
         */
        this.dir = dir;


        /**
         * @private
         * @type {Object.<string, SassGraphIndexValue>}
         */
        this.index = null;


        // initialize index
        this.refreshIndex();
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
            this.dir,
            {
                extension: ["scss"]
            }
        ).index;
    }


    /**
     * Refreshes the internal index
     */
    refreshIndex ()
    {
        this.index = this.getIndex();
    }


    /**
     * Returns the files that import the given file (recursively)
     *
     * @param {String} file
     * @returns {String[]}
     */
    findDependents (file)
    {
        let fullFilePath = path.join(process.cwd(), file);
        let foundFiles = {};
        this.recursivelyFindEntries(fullFilePath, "importedBy", foundFiles);

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
        file = path.join(process.cwd(), file);
        let foundFiles = {};
        this.recursivelyFindEntries(file, "imports", foundFiles);
        return Object.keys(foundFiles);
    }

    /**
     * Recursively finds entries in the index
     *
     * @param {string} file the file to find entries for
     * @param {string} property the property to search in the index
     * @param {Object<string, Boolean>} foundFiles the already found files
     */
    recursivelyFindEntries (file, property, foundFiles)
    {
        if (!this.index[file])
        {
            return;
        }

        this.index[file][property].forEach(
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
