function isTypedArray(obj) {
    return typeof obj === 'object' && Object.getPrototypeOf(obj.constructor).name === 'TypedArray';
}

export default isTypedArray;
