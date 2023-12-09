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
const _utils = require("@kitmi/utils");
const _quoteSet = [
    '"',
    "'"
];
const _default = {
    trimLines: (value, options, meta, context)=>(0, _utils.trimLines)(value, options?.lineDelimiter),
    stripLines: (value, options, meta, context)=>(0, _utils.deleteLines)(value, Array.isArray(options) ? options : options?.patterns, options?.lineDelimiter),
    grepLines: (value, options, meta, context)=>(0, _utils.grepLines)(value, Array.isArray(options) ? options : options?.patterns, options?.lineDelimiter),
    quote: (value, options, meta, context)=>(0, _utils.quote)(value, options?.quoteChar),
    unquote: (value, options, meta, context)=>(0, _utils.unquote)(value, options?.unescape, options?.quoteSet ?? _quoteSet),
    fromCsv: (value, options, meta, context)=>(0, _utils.csvLineParse)(value, options),
    padLeft: (value, options, meta, context)=>(0, _utils.padLeft)(value, typeof options === 'string' ? options : _utils._.repeat(' ', options)),
    padRight: (value, options, meta, context)=>(0, _utils.padRight)(value, typeof options === 'string' ? options : _utils._.repeat(' ', options)),
    fromBase64: (value, options, meta, context)=>(0, _utils.base64Decode)(value),
    pascalCase: (value)=>(0, _utils.pascalCase)(value),
    camelCase: (value)=>(0, _utils.camelCase)(value),
    kebabCase: (value)=>(0, _utils.kebabCase)(value),
    snakeCase: (value)=>(0, _utils.snakeCase)(value)
};

//# sourceMappingURL=common.js.map