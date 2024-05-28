import {isWrappedWith, unwrap} from '@kitmi/utils';

export const isRawSql = (value) => isWrappedWith(value, 'r#"', '"#');
export const extractRawSql = (value) => unwrap(value, 'r#"', '"#');

export const xrRawValue = (value) => ({ $xr: 'Raw', value });
export const xrColumn = (name) => ({ $xr: 'Column', name });
export const xrCall = (name, args) => ({ $xr: 'Function', name, args });
export const xrExpr = (left, op, right) => ({ $xr: 'BinExpr', left, op, right });

/*
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
 */

/*
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
