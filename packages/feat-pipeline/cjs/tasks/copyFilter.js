"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return copyFilter;
    }
});
const _allSync = require("@kitmi/validators/allSync");
const _utils = require("@kitmi/utils");
function copyFilter(step, settings) {
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
    step.stepLog('info', `Copied from "${input}" and filtered.`, {
        result
    });
    return result;
}

//# sourceMappingURL=copyFilter.js.map