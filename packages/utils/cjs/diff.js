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
const _isEqual = /*#__PURE__*/ _interop_require_default(require("lodash/isEqual"));
const _reduce = /*#__PURE__*/ _interop_require_default(require("lodash/reduce"));
const _isEmpty = /*#__PURE__*/ _interop_require_default(require("lodash/isEmpty"));
const _differenceWith = /*#__PURE__*/ _interop_require_default(require("lodash/differenceWith"));
const _ifThen = /*#__PURE__*/ _interop_require_default(require("./ifThen"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const arrayOperators = [
    ()=>[],
    (array, k, v)=>array.push(v)
];
const objectOperators = [
    ()=>({}),
    (obj, k, v)=>obj[k] = v
];
function _diff(base, object, creator, setter) {
    return (0, _reduce.default)(object, (re, v, k)=>{
        const vb = base[k];
        const tb = typeof vb;
        const to = typeof v;
        if (tb !== to) {
            // different type at all
            setter(re, k, v);
        } else if (typeof vb === 'object') {
            // both are object
            if (Array.isArray(vb)) {
                // both are array
                const avd = (0, _differenceWith.default)(v, vb, _isEqual.default);
                if (avd.length > 0) {
                    setter(re, k, avd);
                }
            } else if (!(0, _isEqual.default)(vb, v)) {
                // object
                const baseIsEmpty = (0, _isEmpty.default)(vb);
                if ((0, _isEmpty.default)(v)) {
                    if (!baseIsEmpty) {
                        setter(re, k, v);
                    }
                } else {
                    if (baseIsEmpty) {
                        setter(re, k, v);
                    } else {
                        // both not empty
                        const vd = _diff(vb, v, objectOperators[0], objectOperators[1]);
                        if (!(0, _isEmpty.default)(vd)) {
                            setter(re, k, vd);
                        }
                    }
                }
            }
        } else if (vb !== v) {
            setter(re, k, v);
        }
        return re;
    }, creator());
}
/**
 * Deep diff between two object
 * @alias object.difference
 * @param  {Object} base - Object to be compared
 * @param  {Object} object - Object compared
 * @return {Object} Return the key-value pair from object which of the value is different from base with the same key, or undefined if no difference
 */ function difference(base, object) {
    const ops = Array.isArray(base) ? arrayOperators : objectOperators;
    const baseIsEmpty = (0, _isEmpty.default)(base);
    return (0, _isEmpty.default)(object) ? baseIsEmpty ? undefined : object : baseIsEmpty ? object : (0, _ifThen.default)(_diff(base, object, ops[0], ops[1]), _isEmpty.default, undefined);
}
const _default = difference;

//# sourceMappingURL=diff.js.map