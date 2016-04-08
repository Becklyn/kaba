"use strict";

let path = require("path");
let fs = require("fs-extra");
let Promise = require("bluebird");



module.exports = function (filePath, content)
{
    let dirPath = path.dirname(filePath);

    return Promise.promisify(fs.mkdirs)(dirPath)
        .then(
            () => Promise.promisify(fs.writeFile)(filePath, content, {encoding: "utf-8"})
        );
};
