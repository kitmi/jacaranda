const esmCheck = (obj) => {
    if (obj.__esModule && typeof obj.default !== 'undefined') {
        return obj.default;
    }

    return obj;
};

export default esmCheck;
