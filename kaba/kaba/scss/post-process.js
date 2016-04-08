"use strict";

let postcss = require("postcss");

let autoprefixer = require("autoprefixer");
let reporter = require("postcss-reporter");

/**
 *
 * @param {String} css
 * @param {ScssTaskOptions} options
 * @returns {Promise}
 */
module.exports = function (css, options)
{
    return postcss([
        autoprefixer({
            browsers: options.browsers
        })
        // reporter({clearMessages: true})
    ])
        .process(css);
};
