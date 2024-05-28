"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return dbExistUnique;
    }
});
const _utils = require("@kitmi/utils");
const _dbFindUnique = require("./dbFindUnique");
async function dbExistUnique(step, settings) {
    const record = await (0, _dbFindUnique.findUnique_)(step, settings);
    const recordExists = record != null;
    step.syslog('info', recordExists ? 'Record exists.' : 'Record not found.', {
        record,
        result: recordExists
    });
    return recordExists;
}

//# sourceMappingURL=dbExistUnique.js.map