"use strict";

const path = require("path");
const fs = require("fs-extra");
const Promise = require("bluebird");



module.exports = function (filePath, content)
{
    let dirPath = path.dirname(filePath);

    return Promise.promisify(fs.mkdirs)(dirPath)
        .then(
            () => Promise.promisify(fs.writeFile)(filePath, content, {encoding: "utf-8"})
        );
};
