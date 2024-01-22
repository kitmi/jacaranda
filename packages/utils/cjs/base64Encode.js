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
function base64Encode(str) {
    return Buffer.from(str).toString('base64');
}
const _default = base64Encode;

//# sourceMappingURL=base64Encode.js.map