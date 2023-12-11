/**
 * Box is a utility function that wrap an inner object and returns a reader proxy and a writer function.
 * @returns {Array} - Reader proxy and writer function
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
function Box() {
    const innerObject = {};
    return [
        new Proxy(innerObject, {
            get: function(target, prop, receiver) {
                if (target._ == null) {
                    return undefined;
                }
                // Check if the property is a function
                const origMethod = target._[prop];
                if (typeof origMethod === 'function') {
                    // Return a function that calls the same method on innerObject
                    return function(...args) {
                        return origMethod.apply(target._, args);
                    };
                }
                // For non-function properties, just return the property from innerObject
                return Reflect.get(target._, prop, receiver);
            }
        }),
        (futureValue)=>innerObject._ = futureValue
    ];
}
const _default = Box;

//# sourceMappingURL=box.js.map