const path = require("path");
const {spawnSync} = require("child_process");

/**
 *
 * @param directory
 * @param args
 * @returns {SpawnSyncReturns<Buffer> | SpawnSyncReturns<string>}
 */
exports.runKaba = function (directory, args = [])
{
    return spawnSync(
        path.join(__dirname, "../../bin/run.js"),
        args,
        {
            cwd: path.join(__dirname, "../fixtures", directory),
        }
    );
};