function isRunAsEsm() {
    try {
        // eslint-disable-next-line no-undef
        if (module === undefined && exports === undefined) {
            return true;
        }
    } catch (e) {
        if (e.name === 'ReferenceError') {
            return true;
        }
    }

    return false;
}

export default isRunAsEsm;
