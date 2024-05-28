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
    DbModel: function() {
        return _DbModel.default;
    },
    PrismaModel: function() {
        return _DbModel.PrismaModel;
    },
    dataSource: function() {
        return _dataSource.default;
    },
    dbImporter: function() {
        return _dbImporter.default;
    },
    postgres: function() {
        return _postgres.default;
    },
    prisma: function() {
        return _prisma.default;
    }
});
const _prisma = /*#__PURE__*/ _interop_require_default(require("./prisma"));
const _postgres = /*#__PURE__*/ _interop_require_default(require("./postgres"));
const _dbImporter = /*#__PURE__*/ _interop_require_default(require("./dbImporter"));
const _dataSource = /*#__PURE__*/ _interop_require_default(require("./dataSource"));
const _DbModel = /*#__PURE__*/ _interop_require_wildcard(require("./helpers/DbModel"));
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