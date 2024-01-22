/**
 * Insert a separator as element into an array.
 * @alias array.insertBetween
 * @param {Array} arr
 * @param {*} separator
 * @returns {Array} The newly inserted array
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
const insertSep = (lastIndex, separator)=>(e, i)=>i < lastIndex ? [
            e,
            separator
        ] : [
            e
        ];
const insertSepFunctor = (lastIndex, separator)=>(e, i)=>i < lastIndex ? [
            e,
            separator(i)
        ] : [
            e
        ];
const insertBetween = (arr, separator)=>(typeof separator === 'function' ? arr.map(insertSepFunctor(arr.length - 1, separator)) : arr.map(insertSep(arr.length - 1, separator))).reduce((a, b)=>[
            ...a,
            b
        ], []);
const _default = insertBetween;

//# sourceMappingURL=insertBetween.js.map