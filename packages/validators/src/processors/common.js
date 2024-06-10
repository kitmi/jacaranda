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
    base64Encode,
    base64Decode,
    pascalCase,
    camelCase,
    kebabCase,
    snakeCase,
    replaceAll,
} from '@kitmi/utils';

import { typeOf } from '@kitmi/types';

const _quoteSet = ['"', "'"];

export default {
    trimLines: (value, options) => trimLines(value, options?.lineDelimiter),

    stripLines: (value, options) =>
        deleteLines(value, Array.isArray(options) ? options : options?.patterns, options?.lineDelimiter),
    grepLines: (value, options) =>
        grepLines(value, Array.isArray(options) ? options : options?.patterns, options?.lineDelimiter),

    quote: (value, options) => quote(value, options?.quoteChar),
    unquote: (value, options) => unquote(value, options?.unescape, options?.quoteSet ?? _quoteSet),

    fromCsv: (value, options) => csvLineParse(value, options), // delimiter, emptyAsNull

    padLeft: (value, options) =>
        padLeft(value, typeof options === 'string' ? options : _.repeat(' ', options)),
    padRight: (value, options) =>
        padRight(value, typeof options === 'string' ? options : _.repeat(' ', options)),

    toBase64: (value) => base64Encode(value),
    fromBase64: (value) => base64Decode(value),

    pascalCase: (value) => pascalCase(value),
    camelCase: (value) => camelCase(value),
    kebabCase: (value) => kebabCase(value),
    snakeCase: (value) => snakeCase(value),

    toLower: (value) => value.toLowerCase(),
    toUpper: (value) => value.toUpperCase(),

    replaceAll: (value, options) => replaceAll(value, options.from, options.to),

    typeOf: (value) => typeOf(value),

    type: (value, options, meta, context) => context.system.sanitize(value, options, context.i18n, context.path),
};
