"use strict";

const { _ } = require('@genx/july');

const SupportedDrivers = [ 'mysql', 'mongodb', 'rabbitmq' ];
const JsPrimitiveTypes = new Set([ 'number', 'boolean', 'string', 'symbol', 'undefined' ]);

/**
 * Merge two query conditions using given operator.
 * @param {*} condition1 
 * @param {*} condition2 
 * @param {*} operator 
 * @returns {object}
 */
function mergeCondition(condition1, condition2, operator = '$and') {        
    if (_.isEmpty(condition1)) {
        return condition2;
    }

    if (_.isEmpty(condition2)) {
        return condition1;
    }

    return { [operator]: [ condition1, condition2 ] };
}

exports.isNothing = v => _.isNil(v) || _.isNaN(v);
exports.isPrimitive = v => JsPrimitiveTypes.has(typeof v);
exports.isQuoted = s => (s.startsWith("'") || s.startsWith('"')) && s[0] === s[s.length-1];
exports.isQuotedWith = (s, q) => (s.startsWith(q) && s[0] === s[s.length-1]);
exports.makeDataSourceName = (driver, schema) => (driver + '.' + schema);
exports.extractDriverAndConnectorName = id => id.split('.');
exports.mergeCondition = mergeCondition;
exports.SupportedDrivers = Object.freeze(SupportedDrivers);
 