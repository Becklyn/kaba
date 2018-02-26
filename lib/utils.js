/**
 * Formats the duration
 *
 * @private
 * @param {number[]} duration
 */
function formatHrTimeDuration (duration)
{
    const [seconds, nanoseconds] = duration;
    const milliseconds = Math.round(nanoseconds / 1000000);

    return (seconds * 1000 + milliseconds) + " ms";
}


module.exports = {
    formatHrTimeDuration
};
