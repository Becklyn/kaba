"use strict";

let postcss = require("gulp-postcss");

let autoprefixer = require("autoprefixer");
let cssnano = require("cssnano");
let stylelint = require("stylelint");
let reporter = require("postcss-reporter");
let scssSyntax = require("postcss-scss");


module.exports = function (options)
{
    return postcss([
        autoprefixer({
            browsers: options.browsers
        }),
        cssnano({
            calc: true,
            colormin: true,
            discardComments: true,
            discardDuplicates: true,
            discardEmpty: true,
            discardUnused: true,
            mergeLonghand: true,
            minifyFontValues: true,
            minifyGradients: true,
            minifySelectors: true,
            normalizeCharset: true,
            normalizeUrl: true,
            orderedValues: true,
            reduceTransforms: true,
            sourcemap: true,
            uniqueSelectors: true
        })//,
        // reporter({clearMessages: true})
    ], {
        syntax: scssSyntax
    });
};
