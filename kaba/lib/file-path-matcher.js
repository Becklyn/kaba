"use strict";

/**
 * Returns true, if at least one of the given pattern matches the file path.
 * False otherwise.
 *
 * @param {string} filePath
 * @param {Array.<(string|RegExp)>} patterns
 * @returns {boolean}
 */
module.exports = function (filePath, patterns)
{
    if (!patterns.length)
    {
        return false;
    }

    for (let i = 0, l = patterns.length; i < l; i++)
    {
        let pattern = patterns[i];

        if (pattern instanceof RegExp)
        {
            if (pattern.test(filePath))
            {
                return true;
            }
        }
        else
        {
            if (-1 !== filePath.indexOf(pattern))
            {
                return true;
            }
        }
    }

    return false;
};
