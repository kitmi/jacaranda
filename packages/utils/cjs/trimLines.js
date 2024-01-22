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
function trimLines(textData, lineDelimiter) {
    lineDelimiter == null && (lineDelimiter = '\n');
    // Split the file into lines
    let lines = textData.split(lineDelimiter);
    return lines.map((line)=>line.trim()).join(lineDelimiter);
}
const _default = trimLines;

//# sourceMappingURL=trimLines.js.map