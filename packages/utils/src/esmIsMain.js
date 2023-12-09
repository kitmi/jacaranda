import fileURLToPath from './fileURLToPath';

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
