const unexistDelegate = (target, unexistHandler, immutable) => {
    const handlers = {
        get(target, prop, receiver) {
            if (prop in target) {
                // eslint-disable-next-line no-undef
                return Reflect.get(...arguments);
            }
            return unexistHandler(target, prop, receiver);
        },
    };

    if (immutable) {
        handlers.set = (_target, prop, _value, _receiver) => {
            throw new Error(`Cannot set property "${prop}" of immutable object.`);
        };
        handlers.deleteProperty = (_target, prop) => {
            throw new Error(`Cannot delete property "${prop}" of immutable object.`);
        };
        handlers.defineProperty = (_target, prop, _descriptor) => {
            throw new Error(`Cannot define property "${prop}" of immutable object.`);
        };
    }

    return new Proxy(target, handlers);
};

export default unexistDelegate;
