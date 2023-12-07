import sleep_ from './sleep_';

/**
 * Run the checker every given duration for certain rounds until the checker returns non-false value.
 * @alias lang.waitUntil_
 * @async
 * @param {Function} checker - predicator
 * @param {integer} [checkInterval=1000]
 * @param {integer} [maxRounds=10]
 * @returns {Promise.<boolean>}
 */
async function waitUntil_(checker, checkInterval = 1000, maxRounds = 10) {
    let result = await checker();
    if (result) return result;

    let counter = 0;
    do {
        await sleep_(checkInterval);

        result = await checker();

        if (result) {
            break;
        }
    } while (++counter < maxRounds);

    return result;
}

export default waitUntil_;
