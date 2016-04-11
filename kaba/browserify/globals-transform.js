"use strict";

var through = require('through2');
var transformify = require('transformify');
var replaceRequires = require("replace-requires");


module.exports = function (file, options)
{
    if (!options.globals)
    {
        return through();
    }

    let transform = transformify((code) => replaceRequires(code, options.globals));
    return transform(file);
};
