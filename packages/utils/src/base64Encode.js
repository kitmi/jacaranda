function base64Encode(str) {
    return Buffer.from(str).toString('base64');
}

export default base64Encode;
