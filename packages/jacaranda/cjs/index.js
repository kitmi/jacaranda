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
    Feature: function() {
        return _Feature.default;
    },
    ServiceContainer: function() {
        return _ServiceContainer.default;
    },
    default: function() {
        return _WebServer.default;
    }
});
const _ServiceContainer = /*#__PURE__*/ _interop_require_default(require("./ServiceContainer"));
const _Feature = /*#__PURE__*/ _interop_require_default(require("./Feature"));
_export_star(require("./helpers"), exports);
_export_star(require("./starters"), exports);
const _WebServer = /*#__PURE__*/ _interop_require_default(require("./WebServer"));
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=index.js.map