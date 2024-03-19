"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const appPath = _nodepath.default.resolve(__dirname);
const _default = {
    name: 'test',
    version: '1.0.0',
    depends: [
        'base'
    ],
    author: 'Author Name',
    category: 'Category',
    description: `Description text`,
    appPath
};

//# sourceMappingURL=index.js.map