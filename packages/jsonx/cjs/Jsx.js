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
const _transformers = /*#__PURE__*/ _interop_require_default(require("./transformers"));
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
 * JSON eXpression Syntax
 * @class
 */ class JSX {
    /**
     * Evaluate a JSON expression against the value and update the value
     * @param {object} - JSON operation expression
     * @returns {JSX}
     */ evaluate(jsx) {
        this.value = (0, _transformers.default)(this.value, jsx, {
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
_define_property(JSX, "config", _config.default);
_define_property(JSX, "evaluate", (value, jsx, context)=>{
    return (0, _transformers.default)(value, jsx, {
        config: JSX.config,
        ...context
    });
});
const _default = JSX;

//# sourceMappingURL=Jsx.js.map