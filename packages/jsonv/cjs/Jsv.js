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
const _validate = /*#__PURE__*/ _interop_require_default(require("./validate"));
const _validatorsLoader = /*#__PURE__*/ _interop_require_default(require("./validatorsLoader"));
const _transformersLoader = /*#__PURE__*/ _interop_require_default(require("./transformersLoader"));
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
(0, _validatorsLoader.default)(_config.default);
(0, _transformersLoader.default)(_config.default);
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
_define_property(JSV, "config", _config.default);
_define_property(JSV, "match", (value, jsv, options, context)=>{
    const reason = (0, _validate.default)(value, jsv, {
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

//# sourceMappingURL=Jsv.js.map