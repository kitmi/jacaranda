import { _, isWrappedWith, isEmpty, unwrap, isPlainObject } from '@kitmi/utils';

export const isRawSql = (value) => isWrappedWith(value, 'r#"', '"#');
export const extractRawSql = (value) => unwrap(value, 'r#"', '"#');

export const xrAlias = (xrValue, alias) => ({ ...xrValue, alias });

export const xrRawValue = (value, ...params) => ({ $xr: 'Raw', value, params });
export const xrRaw = xrRawValue;

export const xrColumn = (name, alias) => ({ $xr: 'Column', name, alias });
export const xrCol = xrColumn;

export const xrFunction = (name, ...args) => ({ $xr: 'Function', name, args });
export const xrCall = xrFunction;

export const xrExpression = (left, op, right, alias) => ({ $xr: 'BinExpr', left, op, right, alias });
export const xrExpr = xrExpression;

export const xrDataSet = (model, query, alias) => ({
    $xr: 'DataSet',
    model,
    query: { $skipOrm: true, ...query },
    alias,
});

export const xrGet = (field, key, alias) => ({ $xr: 'OpGet', field, key, alias });
export const xrSet = (obj) => ({ $set: obj });
// 1-based index
export const xrSetAt = (at, value) => ({ $setAt: { at, value } });
export const xrSetSlice = (begin, end, array) => ({ $setSlice: { begin, end, value: array } });

export const doInc = (field, increment) => xrExpr(xrCol(field), '+', increment);
export const doDec = (field, decrement) => xrExpr(xrCol(field), '-', decrement);

export const isSelectAll = (select) => !select || (select.size === 1 && select.has('*'));

/**
 * Merge two query conditions using given operator.
 * @param {*} condition1
 * @param {*} condition2
 * @param {*} operator
 * @returns {object}
 */
export function mergeWhere(condition1, condition2, operator = '$and') {
    if (isEmpty(condition1)) {
        return condition2;
    }

    if (isEmpty(condition2)) {
        return condition1;
    }

    if (operator === '$and' && isPlainObject(condition1) && isPlainObject(condition2)) {
        return { ...condition1, ...condition2 };
    }

    return { [operator]: [condition1, condition2] };
}

export function concateParams(...params) {
    const result = [];
    params.forEach((param) => {
        if (param != null) {
            result.push(...param);
        }
    });
    return result;
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
export const getValueFromAny = (arrayOfColl, key) => _.find(arrayOfColl, (coll) => coll?.[key] != null)?.[key];

export const extractTableAndField = (path) => {
    let lastPos = path.lastIndexOf('.');
    let tablePath = path.substring(0, lastPos);
    let field = path.substring(lastPos + 1);

    return [tablePath, field];
};
