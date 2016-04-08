"use strict";

let sass = require("node-sass");
let Promise = require("bluebird");

/**
 *
 * @param {String} filePath
 * @param {Boolean} debug
 */
module.exports = function (filePath, debug)
{
    return new Promise (
        function (resolve, reject)
        {
            sass.render({
                    file: filePath,
                    outputStyle: "compact",
                    sourceMapEmbed: debug
                },
                function (err, result)
                {
                    if (err)
                    {
                        reject (err);
                    }

                    resolve(result);
                }
            );
        }
    );
};
