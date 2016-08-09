"use strict";

const fs = require("fs");

module.exports = {

    /**
     * Returns the line
     *
     * @param {string} file
     * @param {number} line
     * @returns {?string}
     */
    getLine (file, line)
    {
        try {
            let content = fs.readFileSync(file, {encoding: "utf-8"}).split("\n");

            if (content[line - 1])
            {
                return content[line - 1];
            }

            return null;
        }
        catch (e)
        {
            return null;
        }
    }
};
