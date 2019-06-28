import * as kleur from "kleur";
import {yellow} from "kleur";


/**
 * Exports a function to print the version overview
 *
 * @param {string} kabaVersion
 * @param {Object.<string,string>} packages
 */
export function printPackageVersions (kabaVersion: string, packages: {[name: string]: kleur.Color}) : void
{
    const maxLength = Object.keys(packages).reduce((max, name) => Math.max(max, name.length), 0);
    console.log(
        yellow("kaba"),
        " ".repeat(maxLength - 4),
        kabaVersion
    );

    for (const packageName in packages)
    {
        if (!packages.hasOwnProperty(packageName))
        {
            continue;
        }

        const color = packages[packageName];

        console.log(
            color(packageName),
            " ".repeat( maxLength - packageName.length),
            require(`${packageName}/package.json`).version
        );
    }
}
