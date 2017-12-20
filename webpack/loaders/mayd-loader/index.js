const {exec} = require("child_process");

module.exports = function ()
{
    const done = this.async();

    exec(
        `/usr/bin/env php ${process.cwd()}/bin/console mayd:kaba:js-entries`,
        (err, stdout) =>
        {
            if (err)
            {
                return done(err);
            }

            const maydBundles = JSON.parse(stdout);
            const imports = [];
            const constructors = [];

            for (const name in maydBundles)
            {
                if (!maydBundles.hasOwnProperty(name))
                {
                    return;
                }

                imports.push(`import {${name}} from "${maydBundles[name]}";`);
                constructors.push(name);

            }

            done(
                null,
                `${imports.join(", ")}\n\nexport const bundles = [ ${constructors.join(", ")} ];`
            );
        }
    );
};

