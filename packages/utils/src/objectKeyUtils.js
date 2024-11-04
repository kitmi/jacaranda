export function prefixKeys(obj, prefix) {
    return Object.keys(obj).reduce((acc, key) => {
        acc[prefix + key] = obj[key];
        return acc;
    }, {});
}

export function suffixKeys(obj, suffix) {
    return Object.keys(obj).reduce((acc, key) => {
        acc[key + suffix] = obj[key];
        return acc;
    }, {});
}
