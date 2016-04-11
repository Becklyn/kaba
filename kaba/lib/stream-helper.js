"use strict";

let Promise = require("bluebird");

module.exports = {
    readStream (stream)
    {
        return new Promise (
            function (resolve, reject)
            {
                let buffers = [];

                stream
                    .on("data", (chunk) => buffers.push(chunk))
                    .on("error", (error) => reject(error))
                    .on("end",
                        () => resolve(Buffer.concat(buffers).toString())
                    );
            }
        );
    }
};
