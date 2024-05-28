"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return format;
    }
});
const _allSync = require("@kitmi/validators/allSync");
const _utils = require("@kitmi/utils");
function format(step, settings) {
    let { template } = _allSync.Types.OBJECT.sanitize(settings, {
        schema: {
            template: {
                type: 'text'
            }
        }
    });
    const variables = step.cloneValues();
    const result = (0, _utils.esTemplate)(template, variables);
    step.syslog('info', 'Formatted by template.', {
        result
    });
    return result;
}

//# sourceMappingURL=format.js.map