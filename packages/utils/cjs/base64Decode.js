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
function base64Decode(str) {
    return Buffer.from(str, 'base64').toString();
}
const _default = base64Decode;

//# sourceMappingURL=base64Decode.js.map