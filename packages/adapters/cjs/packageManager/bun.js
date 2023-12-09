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
const bunPackageManager = {
    async addPackage_ (packageName) {
        await _sys.cmd.runLive_('bun', [
            'add',
            packageName
        ]);
    }
};
const _default = bunPackageManager;

//# sourceMappingURL=bun.js.map