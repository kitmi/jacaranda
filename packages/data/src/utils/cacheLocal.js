exports.cacheLocal = (bag, key, fetcher) => {
    const cachedObject = bag[key];
    if (!cachedObject) {
        return (bag[key] = fetcher());
    }

    return cachedObject;
};

exports.cacheLocal_ = async (bag, key, fetcher_) => {
    const cachedObject = bag[key];
    if (!cachedObject) {
        return (bag[key] = await fetcher_());
    }

    return cachedObject;
};
