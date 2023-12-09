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
const _sys = require("@kitmi/sys");
const yarnPackageManager = {
    async addPackage (packageName) {
        await _sys.cmd.runLive_('yarn', [
            'add',
            packageName
        ]);
    }
};
const _default = yarnPackageManager;

//# sourceMappingURL=yarn.js.map