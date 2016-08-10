const uglify = require("uglify-js");


module.exports = function (code)
{
    try
    {
        /* eslint camelcase: "off" */
        const result = uglify.minify(code, {
            output: {
                comments: false,
            },
            fromString: true,
            mangle: true,
            compressor: {
                global_defs: {
                    DEBUG: false,
                },
            },
        });

        return result.code;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
};
