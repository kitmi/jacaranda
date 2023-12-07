"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const unexistDelegate = (target, unexistHandler, immutable)=>{
    const handlers = {
        get (target, prop, receiver) {
            if (prop in target) {
                return Reflect.get(...arguments);
            }
            return unexistHandler(target, prop, receiver);
        }
    };
    if (immutable) {
        handlers.set = (target, prop, value, receiver)=>{
            throw new Error(`Cannot set property "${prop}" of immutable object.`);
        };
        handlers.deleteProperty = (target, prop)=>{
            throw new Error(`Cannot delete property "${prop}" of immutable object.`);
        };
        handlers.defineProperty = (target, prop, descriptor)=>{
            throw new Error(`Cannot define property "${prop}" of immutable object.`);
        };
    }
    return new Proxy(target, handlers);
};
const _default = unexistDelegate;

//# sourceMappingURL=unexistDelegate.js.map