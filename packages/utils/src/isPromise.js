function isPromise(p) {
    if (typeof p === 'object' && typeof p.then === 'function') {
        return true;
    }

    return false;
}

export default isPromise;
