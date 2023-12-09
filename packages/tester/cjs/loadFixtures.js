"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return loadFixtures;
    }
});
const _dbgGetCallerFile = /*#__PURE__*/ _interop_require_default(require("@kitmi/utils/dbgGetCallerFile"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _sys = require("@kitmi/sys");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function loadFixtures(testCase) {
    const callerFileName = (0, _dbgGetCallerFile.default)();
    const baseName = _nodepath.default.basename(callerFileName, '.spec.js');
    const testCaseDir = _nodepath.default.resolve('./test/fixtures', baseName);
    if (!_sys.fs.existsSync(testCaseDir)) {
        throw new Error('Fixtures directory not exist: ' + testCaseDir);
    }
    const files = _sys.fs.readdirSync(testCaseDir);
    files.forEach((fixtureFile)=>{
        const fixtureFilePath = _nodepath.default.join(testCaseDir, fixtureFile);
        const testCaseName = _nodepath.default.basename(fixtureFilePath, '.json');
        const testCaseData = _sys.fs.readJsonSync(fixtureFilePath);
        it(testCaseName, ()=>testCase(testCaseData));
    });
}

//# sourceMappingURL=loadFixtures.js.map