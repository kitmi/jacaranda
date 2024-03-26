"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return fill;
    }
});
const _allSync = require("@kitmi/validators/allSync");
const _utils = require("@kitmi/utils");
function fill(step, settings) {
    let { data } = _allSync.Types.OBJECT.sanitize(settings, {
        schema: {
            data: {
                type: 'object'
            }
        }
    });
    const result = {};
    _utils._.each(data, (value, key)=>{
        value = step.getValue(value);
        step.setData(key, value);
        result[key] = value;
    });
    step.stepLog('info', 'Filled output data.', {
        result
    });
    return result;
}

//# sourceMappingURL=fill.js.map