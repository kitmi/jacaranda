import { isWrappedWith, unwrap } from '@kitmi/utils';

export const isRawSql = (value) => isWrappedWith(value, 'r#"', '"#');
export const extractRawSql = (value) => unwrap(value, 'r#"', '"#');

export const xrRawValue = (value) => ({ $xr: 'Raw', value });
export const xrRaw = xrRawValue;

export const xrColumn = (name) => ({ $xr: 'Column', name });
export const xrCol = xrColumn;

export const xrFunction = (name, args) => ({ $xr: 'Function', name, args });
export const xrCall = xrFunction;

export const xrExpression = (left, op, right) => ({ $xr: 'BinExpr', left, op, right });
export const xrExpr = xrExpression;

export const xrQuery = (query) => ({ $xr: 'Query', query });
export const xrDataSet = (model, query) => ({ $xr: 'DataSet', model, query });
export const xrSql = (sql) => ({ $xr: 'SQL', sql });

export const doInc = (field, increment) => xrExpr(xrCol(field), '+', increment);
export const doDec = (field, decrement) => xrExpr(xrCol(field), '-', decrement);

//export const callCount = (alias, fieldName) => xrCall('COUNT', )

/**
 * Merge two query conditions using given operator.
 * @param {*} condition1
 * @param {*} condition2
 * @param {*} operator
 * @returns {object}
 */
export function mergeWhere(condition1, condition2, operator = '$and') {
    if (_.isEmpty(condition1)) {
        return condition2;
    }

    if (_.isEmpty(condition2)) {
        return condition1;
    }

    return { [operator]: [condition1, condition2] };
}

/**
 * Check if any one of collection as the element of given array has a value in the specified key.
 * @param {*} arrayOfColl
 * @param {*} key
 * @returns {*}
 */
export const hasValueInAny = (arrayOfColl, key) => getValueFromAny(arrayOfColl, key) != null;

/**
 * Get the value from the first element of the collection that has a value in the specified key.
 * @param {*} arrayOfColl
 * @param {*} key
 * @returns {*}
 */
export const getValueFromAny = (arrayOfColl, key) => _.find(arrayOfColl, (coll) => coll?.[key] != null);

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
