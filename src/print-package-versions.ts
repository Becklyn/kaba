import * as kleur from "kleur";
import {yellow} from "kleur";


/**
 * Returns the padding for the given
 *
 * @private
 *
 * @param {string} packageName
 * @param {number} maxLength
 * @return {string}
 */
function padding (packageName: string, maxLength: number) : string
{
    const length = packageName.length;

    return (length < maxLength)
        ? " ".repeat(maxLength - length)
        : "";
}


/**
 * Exports a function to print the version overview
 *
 * @param {string} kabaVersion
 * @param {Object.<string,string>} packages
 */
module.exports = function (kabaVersion: string, packages: {[name: string]: kleur.Color}) : void
{
    const maxLength = Object.keys(packages).reduce((max, name) => Math.max(max, name.length), 0);
    console.log(yellow("kaba"), padding("kaba", maxLength), kabaVersion);

    for (const packageName in packages)
    {
        if (!packages.hasOwnProperty(packageName))
        {
            continue;
        }

        const color = packages[packageName];

        console.log(
            color(packageName),
            padding(packageName, maxLength),
            require(`${packageName}/package.json`).version
        );
    }
};
