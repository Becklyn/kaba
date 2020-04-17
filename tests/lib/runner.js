const path = require("path");
const execa = require("execa");

/**
 * @param {string} directory
 * @param {string[]} args
 */
exports.runKaba = async function (directory, args = [])
{
    return execa(
        path.join(__dirname, "../../bin/run.js"),
        args,
        {
            cwd: path.join(__dirname, "../fixtures", directory),
            reject: false,
        }
    );
};
