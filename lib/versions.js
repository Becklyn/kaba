const chalk = require("chalk");

/**
 * Prints the versions overview
 */
class Versions
{
    /**
     *
     * @param {Object.<string,string>} packages
     */
    constructor (packages)
    {
        /**
         * Mapping of package -> color to print the version number
         * @type {Object<string, string>}
         */
        this.packages = packages;
    }


    /**
     * Prints the version overview
     */
    print ()
    {
        const maxLength = this.getMaxPackageNameLength();

        for (const packageName in this.packages)
        {
            if (!this.packages.hasOwnProperty(packageName))
            {
                continue;
            }

            const color = this.packages[packageName];

            console.log(
                chalk[color](packageName),
                this.padding(packageName, maxLength),
                require(`${packageName}/package.json`).version
            );
        }
    }


    /**
     * Returns the max package name length
     *
     * @private
     * @return {number}
     */
    getMaxPackageNameLength ()
    {
        return Object
            .keys(this.packages)
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
    padding (packageName, maxLength)
    {
        const length = packageName.length;

        return (length < maxLength)
            ? " ".repeat(maxLength - length)
            : "";
    }
}


module.exports = Versions;
