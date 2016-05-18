"use strict";

module.exports = class BuildError
{
    /**
     * @param {Error} reason
     */
    constructor (reason)
    {
        this.reason = reason;
    }
};
