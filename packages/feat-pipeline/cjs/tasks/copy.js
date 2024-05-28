"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return copy;
    }
});
const _allSync = require("@kitmi/validators/allSync");
const _utils = require("@kitmi/utils");
function copy(step, settings) {
    let { input, filter } = _allSync.Types.OBJECT.sanitize(settings, {
        schema: {
            input: {
                type: 'text'
            },
            filter: {
                type: 'array',
                optional: true
            }
        }
    });
    let result = step.getValue(input);
    if (filter) {
        result = _utils._.omit(result, filter);
    }
    step.setData(result);
    step.syslog('info', `Copied from "${input}"${filter ? ' and filtered' : ''}.`, {
        result
    });
    return result;
}

//# sourceMappingURL=copy.js.map