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
    let { data, target } = _allSync.Types.OBJECT.sanitize(settings, {
        schema: {
            data: {
                type: 'object'
            },
            target: {
                type: 'text',
                optional: true
            }
        }
    });
    const result = {};
    if (target) {
        target = step.getValue(target);
    }
    _utils._.each(data, (value, key)=>{
        value = step.getValue(value);
        if (target) {
            (0, _utils.set)(target, key, value);
        } else {
            step.setData(key, value);
        }
        result[key] = value;
    });
    step.syslog('info', 'Filled output data.', {
        result
    });
    return result;
}

//# sourceMappingURL=fill.js.map