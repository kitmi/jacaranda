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
    Azure: function() {
        return _Azure.default;
    },
    S3v2: function() {
        return _S3v2.default;
    },
    S3v3: function() {
        return _S3v3.default;
    }
});
const _S3v3 = /*#__PURE__*/ _interop_require_default(require("./S3v3"));
const _S3v2 = /*#__PURE__*/ _interop_require_default(require("./S3v2"));
const _Azure = /*#__PURE__*/ _interop_require_default(require("./Azure"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=index.js.map