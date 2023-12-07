/**
 * @module naming
 * @borrows string.camelCase as camelCase
 * @borrows string.kebabCase as kebabCase
 * @borrows string.pascalCase as pascalCase
 * @borrows string.snakeCase as snakeCase
 */ "use strict";
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
    camelCase: function() {
        return _camelCase.default;
    },
    kebabCase: function() {
        return _kebabCase.default;
    },
    pascalCase: function() {
        return _pascalCase.default;
    },
    snakeCase: function() {
        return _snakeCase.default;
    }
});
const _camelCase = /*#__PURE__*/ _interop_require_default(require("./camelCase"));
const _kebabCase = /*#__PURE__*/ _interop_require_default(require("./kebabCase"));
const _pascalCase = /*#__PURE__*/ _interop_require_default(require("./pascalCase"));
const _snakeCase = /*#__PURE__*/ _interop_require_default(require("./snakeCase"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=naming.js.map