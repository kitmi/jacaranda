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
    createJSX: function() {
        return createJSX;
    },
    default: function() {
        return _default;
    }
});
const _config = /*#__PURE__*/ _interop_require_default(require("./config"));
const _transformers = /*#__PURE__*/ _interop_require_default(require("./transformers"));
const _jsonv = require("@kitmi/jsonv");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createJSX(_config) {
    let _jsv;
    if (_config == null) {
        _jsv = (0, _jsonv.createJSV)();
        _config = _jsv.config;
        (0, _transformers.default)(_config);
    } else {
        _jsv = (0, _jsonv.createJSV)(_config);
    }
    /**
     * JSON eXpression Syntax
     * @class
     */ class JSX {
        static get JSV() {
            return _jsv;
        }
        static get config() {
            return _config;
        }
        static evaluate(value, jsx, context) {
            return (0, _jsonv.transform)(value, jsx, {
                config: this.config,
                ...context
            });
        }
        /**
         * Evaluate a JSON expression against the value and update the value
         * @param {object} - JSON operation expression
         * @returns {JSX}
         */ evaluate(jsx) {
            this.value = (0, _jsonv.transform)(this.value, jsx, {
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
    return JSX;
}
(0, _transformers.default)(_config.default);
const defaultJSX = createJSX(_config.default);
const _default = defaultJSX;

//# sourceMappingURL=Jsx.js.map