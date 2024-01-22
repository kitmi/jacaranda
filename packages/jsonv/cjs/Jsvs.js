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
const _config = /*#__PURE__*/ _interop_require_default(require("./config"));
const _validators = /*#__PURE__*/ _interop_require_default(require("./validators"));
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * JSON Validation Syntax
 * @class
 */ class JSV {
    /**
     * Match the value with expected conditions in JSON expression
     * @param {object} expected - JSON match expression
     * @throws ValidationError
     * @returns {JSV}
     */ match(expected) {
        (0, _validators.default)(this.value, expected, {
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
_define_property(JSV, "config", _config.default);
_define_property(JSV, "match", (value, jsv, options, context)=>{
    const reason = (0, _validators.default)(value, jsv, {
        throwError: false,
        abortEarly: true,
        plainError: true,
        ...options
    }, {
        config: JSV.config,
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
});
const _default = JSV;

//# sourceMappingURL=Jsvs.js.map