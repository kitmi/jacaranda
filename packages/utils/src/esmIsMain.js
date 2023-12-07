import fileURLToPath from './fileURLToPath';

function esmIsMain() {
    if (import.meta.url.startsWith('file:')) {
        // (A)
        const modulePath = fileURLToPath(import.meta.url);
        if (process.argv[1] === modulePath) {
            // (B)
            return true;
        }
    }

    return false;
}

export default esmIsMain;
