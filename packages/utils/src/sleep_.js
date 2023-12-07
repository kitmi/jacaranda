/**
 * Sleep for milliseconds
 * @alias lang.sleep_
 * @async
 * @param {integer} ms - milliseconds
 * @returns {Promise}
 */
const sleep_ = (ms) =>
    new Promise((resolve /*, reject*/) => {
        setTimeout(resolve, ms);
    });

export default sleep_;
