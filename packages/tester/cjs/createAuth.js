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
const _utils = require("@kitmi/utils");
const _login = /*#__PURE__*/ _interop_require_wildcard(require("./login"));
const _access = /*#__PURE__*/ _interop_require_wildcard(require("./access"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
// Cache for storing user tokens
const tokenCache = {};
/**
 * Returns a middleware function that adds user authentication to a client.
 * @param {string} authKey - The user tag or user authentication object.
 * @param {Object} authConfig - The user authentication settings.
 * @returns {Function} A middleware function that adds user authentication to a client.
 * @throws {Error} If the user authentication settings are missing required fields.
 */ function createAuth(authKey, authConfig) {
    const { loginType = 'password', accessType = 'jwt' } = authConfig;
    const accessMethod = _access[accessType];
    if (!accessMethod) {
        throw new Error(`Unsuppported accessType "${accessType}". Should be one of ${_utils._.keys(_access)}.`);
    }
    return async (client)=>{
        let accessToken = tokenCache[authKey];
        // If the token is not cached, authenticate the user and cache the token
        if (!accessToken) {
            const loginMethod = _login[loginType];
            if (!loginMethod) {
                throw new Error(`Unsuppported loginType "${loginType}". Should be one of ${_utils._.keys(_login)}.`);
            }
            accessToken = tokenCache[authKey] = await loginMethod(client, authConfig.loginOptions);
        }
        await accessMethod(client, accessToken);
    };
}
const _default = createAuth;

//# sourceMappingURL=createAuth.js.map