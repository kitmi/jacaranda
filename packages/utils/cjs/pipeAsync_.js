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
const _isPromise = /*#__PURE__*/ _interop_require_default(require("./isPromise"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const pipeAsync_ = async (readStream, writeStream)=>{
    (0, _isPromise.default)(readStream) && (readStream = await readStream);
    if (readStream instanceof ReadableStream && !(writeStream instanceof WritableStream)) {
        writeStream = writeStream.constructor.toWeb(writeStream);
        return readStream.pipeTo(writeStream);
    }
    return new Promise((resolve, reject)=>{
        writeStream.on('close', resolve);
        writeStream.on('error', reject);
        readStream.pipe(writeStream);
    });
};
const _default = pipeAsync_;

//# sourceMappingURL=pipeAsync_.js.map