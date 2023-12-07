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
 */ class Jxs {
    /**
     * Evaluate a JSON expression against the value and update the value
     * @param {object} - JSON operation expression
     * @returns {Jxs}
     */ update(jxs) {
        this.value = (0, _transformers.default)(this.value, jxs);
        return this;
    }
    /**
     * @param {object} value
     */ constructor(value){
        this.value = value;
    }
}
_define_property(Jxs, "config", _config.default);
_define_property(Jxs, "evaluate", _transformers.default);
const _default = Jxs;

//# sourceMappingURL=Jxs.js.map