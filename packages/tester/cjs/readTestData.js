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
const _yaml = /*#__PURE__*/ _interop_require_default(require("yaml"));
const _sys = require("@kitmi/sys");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function readTestData(fixtureFilePath, fixtureType) {
    const fileContent = _sys.fs.readFileSync(fixtureFilePath, 'utf8');
    if (fixtureType === 'json') {
        return JSON.parse(fileContent);
    } else if (fixtureType === 'yaml') {
        return _yaml.default.parse(fileContent);
    } else {
        throw new Error('Unsupported fixture type: ' + fixtureType);
    }
}
const _default = readTestData;

//# sourceMappingURL=readTestData.js.map