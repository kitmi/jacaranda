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
    K_ENV: function() {
        return K_ENV;
    },
    NS_APP: function() {
        return NS_APP;
    },
    NS_FEAT: function() {
        return NS_FEAT;
    },
    NS_LIB: function() {
        return NS_LIB;
    },
    NS_MIDDLEWARE: function() {
        return NS_MIDDLEWARE;
    },
    NS_MODULE: function() {
        return NS_MODULE;
    },
    NS_ROUTER: function() {
        return NS_ROUTER;
    },
    default: function() {
        return _default;
    }
});
const _RuntimeRegistry = /*#__PURE__*/ _interop_require_default(require("./helpers/RuntimeRegistry"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const NS_APP = 'apps';
const NS_LIB = 'libs';
const NS_FEAT = 'features';
const NS_MIDDLEWARE = 'middlewares';
const NS_ROUTER = 'routers';
const NS_MODULE = 'modules';
const K_ENV = 'env';
const runtime = new _RuntimeRegistry.default();
runtime.loadModule = (name, m)=>runtime.register(NS_MODULE, name, m);
const _default = runtime;

//# sourceMappingURL=runtime.js.map