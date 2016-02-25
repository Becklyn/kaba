"use strict";

let sass = require("gulp-sass");


module.exports = function ()
{
    return sass().on('error', sass.logError);
};
