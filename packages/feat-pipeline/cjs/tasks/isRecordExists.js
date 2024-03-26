"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return isRecordExists;
    }
});
const _utils = require("@kitmi/utils");
const _allSync = require("@kitmi/validators/allSync");
async function isRecordExists(step, settings) {
    let { service, model, where } = _allSync.Types.OBJECT.sanitize(settings, {
        schema: {
            service: {
                type: 'text'
            },
            model: {
                type: 'text'
            },
            where: {
                type: 'object'
            }
        }
    });
    service = step.getService(service);
    model = step.getValue(model);
    where = _utils._.mapValues(where, (value)=>{
        if (typeof value !== 'string') {
            throw new Error('Value name must be a string, for literal values please use "define" task.');
        }
        return step.getValue(value);
    });
    const Model = service[model];
    const record = await Model.findUnique({
        where
    });
    const recordExists = record != null;
    step.stepLog('info', recordExists ? 'Record exists.' : 'Record not found.', {
        record
    });
    return recordExists;
}

//# sourceMappingURL=isRecordExists.js.map