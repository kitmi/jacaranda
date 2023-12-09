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
const npmPackageManager = {
    async addPackage_ (packageName) {
        await _sys.cmd.runLive_('npm', [
            'install',
            packageName
        ]);
    }
};
const _default = npmPackageManager;

//# sourceMappingURL=npm.js.map