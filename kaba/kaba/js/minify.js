"use strict";

let uglify = require("uglify-js");
let uglifyLicenseMatcher = require("uglify-save-license");


module.exports = function (code, debug)
{
    try
    {
        let result = uglify.minify(code, {
                output: {
                    comments: debug ? true : uglifyLicenseMatcher
                },
                fromString: true,
                mangle: true,
                compressor: {
                    global_defs: {
                        DEBUG: false
                    }
                }
            }
        );

        return result.code;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
};
