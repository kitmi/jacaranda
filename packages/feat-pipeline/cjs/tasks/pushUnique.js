"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return pushUnique;
    }
});
const _allSync = require("@kitmi/validators/allSync");
const _utils = require("@kitmi/utils");
function pushUnique(step, settings) {
    let { key, value, target: targetVarName, throwOnDuplicate } = _allSync.Types.OBJECT.sanitize(settings, {
        schema: {
            key: {
                type: 'text'
            },
            value: {
                type: 'text'
            },
            target: {
                type: 'text',
                optional: true,
                default: '$data'
            },
            throwOnDuplicate: {
                type: 'boolean',
                optional: true,
                default: true
            }
        }
    });
    const target = step.getValue(targetVarName);
    if (target == null) {
        throw new Error(`Target variable '${targetVarName}' is not an object.`);
    }
    value = step.getValue(value);
    let bucket = target[key];
    if (bucket == null) {
        bucket = new Set();
        target[key] = bucket;
    } else {
        if (!(bucket instanceof Set)) {
            throw new Error(`Value at '${targetVarName}.${key}' is not a Set.`);
        }
        if (bucket.has(value)) {
            if (throwOnDuplicate) {
                throw new Error(`Value '${value}' already exists in '${targetVarName}.${key}'.`);
            }
            step.syslog('warn', `Value '${value}' already exists in '${targetVarName}.${key}'.`);
            return false;
        }
    }
    bucket.add(value);
    step.syslog('info', `Added '${value}' to '${targetVarName}.${key}'.`);
    return true;
}

//# sourceMappingURL=pushUnique.js.map