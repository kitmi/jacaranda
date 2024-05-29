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
    },
    xrCall: function() {
        return xrCall;
    },
    xrColumn: function() {
        return xrColumn;
    },
    xrExpr: function() {
        return xrExpr;
    },
    xrRawValue: function() {
        return xrRawValue;
    }
});
const _utils = require("@kitmi/utils");
const isRawSql = (value)=>(0, _utils.isWrappedWith)(value, 'r#"', '"#');
const extractRawSql = (value)=>(0, _utils.unwrap)(value, 'r#"', '"#');
const xrRawValue = (value)=>({
        $xr: 'Raw',
        value
    });
const xrColumn = (name)=>({
        $xr: 'Column',
        name
    });
const xrCall = (name, args)=>({
        $xr: 'Function',
        name,
        args
    });
const xrExpr = (left, op, right)=>({
        $xr: 'BinExpr',
        left,
        op,
        right
    }); /*
 $xr: Xeml Runtime Type
 ------------
 Column { name }
 Function { name, args }
 Raw { value }
 Query { query }
 BinExpr { left, op, right }
 DataSet { model, query }

 SessionVariable
 QueryVariable
 SymbolToken
 */  /*
queryCount = (alias, fieldName) => ({
    type: 'function',
    name: 'COUNT',
    args: [fieldName || '*'],
    alias: alias || 'count',
});

$call = (name, alias, args, extra) => ({
    ...extra,
    type: 'function',
    name,
    alias,
    args,
});
$as = (name, alias) => ({ type: 'column', name, alias });

// in mysql, null value comparison will never return true, even null != 1
nullOrIs = (fieldName, value) => [{ [fieldName]: { $exists: false } }, { [fieldName]: { $eq: value } }];
*/ 

//# sourceMappingURL=Rules.js.map