"use strict";

const through = require('through2');
const transformify = require('transformify');
const replaceRequires = require("replace-requires");


module.exports = function (file, options)
{
    if (!options.globals)
    {
        return through();
    }

    let transform = transformify((code) => replaceRequires(code, options.globals));
    return transform(file);
};
