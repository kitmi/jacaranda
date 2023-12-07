/**
 * Move a value in an array-like object as a new copy.
 * @function array.move
 * @param {*} array 
 * @param {*} from 
 * @param {*} to 
 * @returns {Array}
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    copyArrayLike: function() {
        return copyArrayLike;
    },
    insert: function() {
        return insert;
    },
    move: function() {
        return move;
    },
    swap: function() {
        return swap;
    },
    uniqPush: function() {
        return uniqPush;
    }
});
const move = (array, from, to)=>{
    const copy = copyArrayLike(array);
    if (from === to) {
        return copy;
    }
    const value = copy[from];
    copy.splice(from, 1);
    copy.splice(to, 0, value);
    return copy;
};
const swap = (arrayLike, indexA, indexB)=>{
    const copy = copyArrayLike(arrayLike);
    if (indexA === indexB) {
        return copy;
    }
    const a = copy[indexA];
    copy[indexA] = copy[indexB];
    copy[indexB] = a;
    return copy;
};
const insert = (arrayLike, index, value)=>{
    const copy = copyArrayLike(arrayLike);
    copy.splice(index, 0, value);
    return copy;
};
const copyArrayLike = (arrayLike)=>{
    if (!arrayLike) {
        return [];
    } else {
        return [
            ...arrayLike
        ];
    }
};
const uniqPush = (arrayLike, value)=>{
    if (!arrayLike.includes(value)) {
        return [
            ...arrayLike,
            value
        ];
    }
    return arrayLike;
};

//# sourceMappingURL=arrayImmutable.js.map