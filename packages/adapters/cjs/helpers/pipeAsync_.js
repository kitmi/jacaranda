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
const pipeAsync_ = (stream1, stream2)=>new Promise((resolve, reject)=>{
        stream2.on('close', resolve);
        stream2.on('error', reject);
        stream1.pipe(stream2);
    });
const _default = pipeAsync_;

//# sourceMappingURL=pipeAsync_.js.map