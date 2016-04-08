"use strict";

let csso = require("csso");

/**
 *
 * @param {String} css
 * @returns {Promise}
 */
module.exports = function (css)
{
    return csso.minify(css).css;
};
