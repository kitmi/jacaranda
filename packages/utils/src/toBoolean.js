function toBoolean(any) {
    const type = typeof any;

    if (type === 'boolean') {
        return any;
    }

    if (type === 'number') {
        return any === 1;
    }

    return type === 'string' && (any === '1' || /^true$/i.test(any));
}

export default toBoolean;
