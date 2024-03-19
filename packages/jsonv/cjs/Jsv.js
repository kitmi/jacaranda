"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    createJSV: function() {
        return createJSV;
    },
    default: function() {
        return _default;
    }
});
const _config = /*#__PURE__*/ _interop_require_wildcard(require("./config"));
const _validate = /*#__PURE__*/ _interop_require_default(require("./validate"));
const _validatorsLoader = /*#__PURE__*/ _interop_require_default(require("./validatorsLoader"));
const _transformersLoader = /*#__PURE__*/ _interop_require_default(require("./transformersLoader"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
function createJSV(_config1) {
    if (_config1 == null) {
        _config1 = new _config.Config();
        (0, _validatorsLoader.default)(_config1);
        (0, _transformersLoader.default)(_config1);
    }
    /**
     * JSON Validation Syntax
     * @class
     */ class JSV {
        static get config() {
            return _config1;
        }
        static match(value, jsv, options, context) {
            const reason = (0, _validate.default)(value, jsv, {
                throwError: false,
                abortEarly: true,
                plainError: true,
                ...options
            }, {
                config: this.config,
                ...context
            });
            if (reason === true) {
                return [
                    true
                ];
            }
            return [
                false,
                reason
            ];
        }
        /**
         * Match the value with expected conditions in JSON expression
         * @param {object} expected - JSON match expression
         * @throws ValidationError
         * @returns {JSV}
         */ match(expected) {
            (0, _validate.default)(this.value, expected, {
                throwError: true,
                abortEarly: true
            }, {
                config: this.constructor.config
            });
            return this;
        }
        /**
         * @param {object} value
         */ constructor(value){
            this.value = value;
        }
    }
    return JSV;
}
(0, _validatorsLoader.default)(_config.default);
(0, _transformersLoader.default)(_config.default);
const defaultJSV = createJSV(_config.default);
const _default = defaultJSV;

//# sourceMappingURL=Jsv.js.map