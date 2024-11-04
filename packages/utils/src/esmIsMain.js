import fileURLToPath from './fileURLToPath';

/**
 * Check if the current module is the main module.
 * @param {*} entryMetaUrl - import.meta.url of the entry module.
 * @returns {boolean}
 */
function esmIsMain(entryMetaUrl) {
    if (entryMetaUrl.startsWith('file:')) {
        // (A)
        const modulePath = fileURLToPath(entryMetaUrl);

        if (process.argv[1] === modulePath) {
            // (B)
            return true;
        }
    }

    return false;
}

export default esmIsMain;
