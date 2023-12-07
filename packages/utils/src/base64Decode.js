function base64Decode(str) {
    return Buffer.from(str, 'base64').toString();
}

export default base64Decode;
