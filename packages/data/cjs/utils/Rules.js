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
    extractRawSql: function() {
        return extractRawSql;
    },
    isRawSql: function() {
        return isRawSql;
    }
});
const _utils = require("@kitmi/utils");
const isRawSql = (value)=>(0, _utils.isWrappedWith)(value, 'r#"', '"#');
const extractRawSql = (value)=>(0, _utils.unwrap)(value, 'r#"', '"#');

//# sourceMappingURL=Rules.js.map