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
    fetchagent: function() {
        return _fetchagent.default;
    },
    superagent: function() {
        return _superagent.default;
    },
    supertest: function() {
        return _supertest.default;
    }
});
const _superagent = /*#__PURE__*/ _interop_require_default(require("./superagent"));
const _supertest = /*#__PURE__*/ _interop_require_default(require("./supertest"));
const _fetchagent = /*#__PURE__*/ _interop_require_default(require("./fetchagent"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=index.js.map