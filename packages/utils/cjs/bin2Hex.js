/**
 * Bin to hex, like 0x7F
 * @function string.bin2Hex
 * @param {Buffer} bin
 * @returns {String}
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
function bin2Hex(bin) {
    return '0x' + bin.toString('hex');
}
const _default = bin2Hex;

//# sourceMappingURL=bin2Hex.js.map