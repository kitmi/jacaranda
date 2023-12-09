import {
    _,
    trimLines,
    deleteLines,
    grepLines,
    quote,
    unquote,
    csvLineParse,
    padLeft,
    padRight,
    base64Decode,
    pascalCase,
    camelCase,
    kebabCase,
    snakeCase,
} from '@kitmi/utils';

const _quoteSet = ['"', "'"];

export default {
    trimLines: (value, options, meta, context) => trimLines(value, options?.lineDelimiter),

    stripLines: (value, options, meta, context) =>
        deleteLines(value, Array.isArray(options) ? options : options?.patterns, options?.lineDelimiter),
    grepLines: (value, options, meta, context) =>
        grepLines(value, Array.isArray(options) ? options : options?.patterns, options?.lineDelimiter),

    quote: (value, options, meta, context) => quote(value, options?.quoteChar),
    unquote: (value, options, meta, context) => unquote(value, options?.unescape, options?.quoteSet ?? _quoteSet),

    fromCsv: (value, options, meta, context) => csvLineParse(value, options), // delimiter, emptyAsNull

    padLeft: (value, options, meta, context) =>
        padLeft(value, typeof options === 'string' ? options : _.repeat(' ', options)),
    padRight: (value, options, meta, context) =>
        padRight(value, typeof options === 'string' ? options : _.repeat(' ', options)),

    fromBase64: (value, options, meta, context) => base64Decode(value),

    pascalCase: (value) => pascalCase(value),
    camelCase: (value) => camelCase(value),
    kebabCase: (value) => kebabCase(value),
    snakeCase: (value) => snakeCase(value),
};
