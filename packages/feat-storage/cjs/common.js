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
    DEFAULT_DOWNLOAD_EXPIRY: function() {
        return DEFAULT_DOWNLOAD_EXPIRY;
    },
    DEFAULT_UPLOAD_EXPIRY: function() {
        return DEFAULT_UPLOAD_EXPIRY;
    }
});
const DEFAULT_UPLOAD_EXPIRY = 900; // 15 mintues
const DEFAULT_DOWNLOAD_EXPIRY = 1800; // 30 mintues

//# sourceMappingURL=common.js.map