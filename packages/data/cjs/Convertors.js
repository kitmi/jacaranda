"use strict";
const validator = require('validator');
const { _ } = require('@genx/july');
exports.toBoolean = (value)=>typeof value === 'boolean' ? value : validator.toBoolean(value.toString(), true);
exports.toText = (value, noTrim)=>{
    if (value) {
        value = typeof value !== 'string' ? value.toString() : value;
        return noTrim ? value : value.trim();
    }
    return value;
};
exports.toInt = (value, radix)=>_.isInteger(value) ? value : typeof value === 'string' ? parseInt(value, radix) : NaN;
exports.toFloat = (value)=>_.isFinite(value) ? value : validator.toFloat(value);
exports.jsonToBase64 = (obj)=>Buffer.from(JSON.stringify(obj)).toString('base64');
exports.base64ToJson = (base64)=>JSON.parse(Buffer.from(base64, 'base64').toString('ascii'));
exports.toKVPairs = (arrayOfObjects, property, transformer)=>{
    const keyGetter = typeof property === 'function' ? property : (obj)=>obj[property];
    return arrayOfObjects.reduce((table, obj)=>{
        table[keyGetter(obj)] = transformer ? transformer(obj) : obj;
        return table;
    }, {});
};
exports.toSet = (arrayOfObjects, property)=>{
    if (!arrayOfObjects) return new Set();
    const valueGetter = typeof property === 'function' ? property : (obj)=>obj[property];
    const result = new Set();
    arrayOfObjects.forEach((obj)=>result.add(valueGetter(obj)));
    return result;
};
/**
 * Remap the keys of object elements in an array, like projection.
 * @param {*} object
 * @param {*} mapping - key to newKey or key to array[ newKey, valueMap ] for next level mapping
 * @param {boolean} keepUnmapped - If true, will keep those not in mapping as its original key, otherwise filter out
 */ const mapKeysDeep = (object, mapping, keepUnmapped)=>{
    if (typeof mapping === 'string') return {
        [mapping]: object
    };
    const newObj = {};
    _.forOwn(object, (v, k)=>{
        if (k in mapping) {
            const nk = mapping[k];
            if (Array.isArray(nk)) {
                newObj[nk[0]] = {
                    ...newObj[nk[0]],
                    ...mapKeysDeep(v, nk[1], keepUnmapped)
                };
            } else {
                newObj[nk] = v;
            }
        } else {
            if (keepUnmapped) {
                newObj[k] = v;
            }
        }
    });
    return newObj;
};
const mapArraysDeep = (arrayOfObjects, mapping, keepUnmapped)=>_.map(arrayOfObjects, (obj)=>mapKeysDeep(obj, mapping, keepUnmapped));
exports.mapKeysDeep = mapKeysDeep;
exports.mapArraysDeep = mapArraysDeep;

//# sourceMappingURL=Convertors.js.map