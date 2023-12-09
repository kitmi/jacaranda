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
const pnpmPackageManager = {
    async addPackage_ (packageName) {
        await _sys.cmd.runLive_('pnpm', [
            'add',
            packageName
        ]);
    }
};
const _default = pnpmPackageManager;

//# sourceMappingURL=pnpm.js.map