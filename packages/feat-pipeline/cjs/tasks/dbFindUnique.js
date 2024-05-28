"use strict";
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
    default: function() {
        return dbFindUnique;
    },
    findUnique_: function() {
        return findUnique_;
    }
});
const _utils = require("@kitmi/utils");
const _allSync = require("@kitmi/validators/allSync");
async function findUnique_(step, settings) {
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
    where = step.replaceValues(where);
    const Model = service[model];
    const record = await Model.findUnique({
        where
    });
    return record;
}
async function dbFindUnique(step, settings) {
    const record = await findUnique_(step, settings);
    if (record == null) {
        throw new Error('Record not found.');
    }
    step.syslog('info', 'Record found.', {
        result: record
    });
    return record;
}

//# sourceMappingURL=dbFindUnique.js.map