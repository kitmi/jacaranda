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
    AsyncEmitter: function() {
        return _AsyncEmitter.default;
    },
    Controller: function() {
        return _Controller.default;
    },
    DbModel: function() {
        return _DbModel.default;
    },
    HttpClient: function() {
        return _HttpClient.default;
    },
    PrismaModel: function() {
        return _DbModel.PrismaModel;
    },
    RuntimeRegistry: function() {
        return _RuntimeRegistry.default;
    },
    httpMethod: function() {
        return _httpMethod.default;
    },
    middleware: function() {
        return _middleware.default;
    },
    serve: function() {
        return _serve.default;
    },
    supportedMethods: function() {
        return _supportedMethods.default;
    }
});
const _AsyncEmitter = /*#__PURE__*/ _interop_require_default(require("./AsyncEmitter"));
const _RuntimeRegistry = /*#__PURE__*/ _interop_require_default(require("./RuntimeRegistry"));
const _HttpClient = /*#__PURE__*/ _interop_require_default(require("./HttpClient"));
const _Controller = /*#__PURE__*/ _interop_require_default(require("./Controller"));
const _DbModel = /*#__PURE__*/ _interop_require_wildcard(require("./DbModel"));
const _httpMethod = /*#__PURE__*/ _interop_require_default(_export_star(require("./httpMethod"), exports));
const _middleware = /*#__PURE__*/ _interop_require_default(require("./middleware"));
_export_star(require("./logger"), exports);
const _supportedMethods = /*#__PURE__*/ _interop_require_default(require("./supportedMethods"));
const _serve = /*#__PURE__*/ _interop_require_default(require("./serve"));
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
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}

//# sourceMappingURL=index.js.map