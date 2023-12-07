/**
 * Bin to hex, like 0x7F
 * @function string.bin2Hex
 * @param {Buffer} bin
 * @returns {String}
 */
function bin2Hex(bin) {
    return '0x' + bin.toString('hex');
}

export default bin2Hex;
