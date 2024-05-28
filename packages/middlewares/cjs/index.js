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
    accessLog: function() {
        return _accessLog.default;
    },
    body: function() {
        return _body.default;
    },
    compress: function() {
        return _compress.default;
    },
    cors: function() {
        return _cors.default;
    },
    etag: function() {
        return _etag.default;
    },
    ip: function() {
        return _ip.default;
    },
    serveStatic: function() {
        return _serveStatic.default;
    }
});
const _accessLog = /*#__PURE__*/ _interop_require_default(require("./accessLog"));
const _body = /*#__PURE__*/ _interop_require_default(require("./body"));
const _compress = /*#__PURE__*/ _interop_require_default(require("./compress"));
const _cors = /*#__PURE__*/ _interop_require_default(require("./cors"));
const _etag = /*#__PURE__*/ _interop_require_default(require("./etag"));
const _ip = /*#__PURE__*/ _interop_require_default(require("./ip"));
const _serveStatic = /*#__PURE__*/ _interop_require_default(require("./serveStatic"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=index.js.map