const {exec} = require("child_process");

module.exports = function()
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

            for (const name in maydBundles)
            {
                if (!maydBundles.hasOwnProperty(name))
                {
                    return;
                }

                imports.push(`require("${maydBundles[name]}")`);

            }

            done(
                null,
                `export default [ ${imports.join(", ")} ];`
            );
        }
    )
};

