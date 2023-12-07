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
    JsonConfigProvider: function() {
        return _JsonConfigProvider.default;
    },
    YamlConfigProvider: function() {
        return _YamlConfigProvider.default;
    },
    default: function() {
        return _ConfigLoader.default;
    }
});
const _JsonConfigProvider = /*#__PURE__*/ _interop_require_default(require("./JsonConfigProvider"));
const _YamlConfigProvider = /*#__PURE__*/ _interop_require_default(require("./YamlConfigProvider"));
const _ConfigLoader = /*#__PURE__*/ _interop_require_default(require("./ConfigLoader"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=index.js.map