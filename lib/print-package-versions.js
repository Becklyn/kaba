const kleur = require("kleur");


/**
 * Returns the max package name length
 *
 * @private
 * @param {Object.<string,string>} packages
 * @return {number}
 */
function getMaxPackageNameLength (packages)
{
    return Object
        .keys(packages)
        .reduce((max, name) => Math.max(max, name.length), 0);
}


/**
 * Returns the padding for the given
 *
 * @private
 *
 * @param {string} packageName
 * @param {number} maxLength
 * @return {string}
 */
function padding (packageName, maxLength)
{
    const length = packageName.length;

    return (length < maxLength)
        ? " ".repeat(maxLength - length)
        : "";
}


/**
 * Exports a function to print the version overview
 *
 * @param {Object.<string,string>} packages
 */
module.exports = function (packages)
{
    const maxLength = getMaxPackageNameLength(packages);

    for (const packageName in packages)
    {
        if (!packages.hasOwnProperty(packageName))
        {
            continue;
        }

        const color = packages[packageName];

        console.log(
            kleur[color](packageName),
            padding(packageName, maxLength),
            require(`${packageName}/package.json`).version
        );
    }
};
