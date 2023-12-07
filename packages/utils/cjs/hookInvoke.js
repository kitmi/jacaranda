/**
 * Add hooks before an object's method is being called and after.
 * @alias lang.hookInvoke
 * @param {*} obj
 * @param {*} onCalling - Before hook
 * @param {*} onCalled - After hook
 * @returns {Object} The hooked object
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
const hookInvoke = (obj, onCalling, onCalled)=>new Proxy(obj, {
        get (target, propKey /*, receiver*/ ) {
            const origMethod = target[propKey];
            if (typeof origMethod === 'function') {
                return function(...args) {
                    onCalling && Promise.resolve(onCalling(obj, {
                        name: propKey,
                        args
                    }));
                    let returned = origMethod.apply(target, args);
                    onCalled && Promise.resolve(returned).then((returned)=>Promise.resolve(onCalled(obj, {
                            name: propKey,
                            returned
                        }))).catch();
                    return returned;
                };
            }
            return origMethod;
        }
    });
const _default = hookInvoke;

//# sourceMappingURL=hookInvoke.js.map