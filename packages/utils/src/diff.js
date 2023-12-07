import _isEqual from 'lodash/isEqual';
import _reduce from 'lodash/reduce';
import _isEmpty from 'lodash/isEmpty';
import _differenceWith from 'lodash/differenceWith';

import ifThen from './ifThen';

const arrayOperators = [() => [], (array, k, v) => array.push(v)];
const objectOperators = [() => ({}), (obj, k, v) => (obj[k] = v)];

function _diff(base, object, creator, setter) {
    return _reduce(
        object,
        (re, v, k) => {
            const vb = base[k];
            const tb = typeof vb;
            const to = typeof v;

            if (tb !== to) {
                // different type at all
                setter(re, k, v);
            } else if (typeof vb === 'object') {
                // both are object
                if (Array.isArray(vb)) {
                    // both are array
                    const avd = _differenceWith(v, vb, _isEqual);
                    if (avd.length > 0) {
                        setter(re, k, avd);
                    }
                } else if (!_isEqual(vb, v)) {
                    // object
                    const baseIsEmpty = _isEmpty(vb);

                    if (_isEmpty(v)) {
                        if (!baseIsEmpty) {
                            setter(re, k, v);
                        }
                    } else {
                        if (baseIsEmpty) {
                            setter(re, k, v);
                        } else {
                            // both not empty
                            const vd = _diff(vb, v, objectOperators[0], objectOperators[1]);
                            if (!_isEmpty(vd)) {
                                setter(re, k, vd);
                            }
                        }
                    }
                }
            } else if (vb !== v) {
                setter(re, k, v);
            }

            return re;
        },
        creator()
    );
}

/**
 * Deep diff between two object
 * @alias object.difference
 * @param  {Object} base - Object to be compared
 * @param  {Object} object - Object compared
 * @return {Object} Return the key-value pair from object which of the value is different from base with the same key, or undefined if no difference
 */
function difference(base, object) {
    const ops = Array.isArray(base) ? arrayOperators : objectOperators;
    const baseIsEmpty = _isEmpty(base);
    return _isEmpty(object)
        ? baseIsEmpty
            ? undefined
            : object
        : baseIsEmpty
        ? object
        : ifThen(_diff(base, object, ops[0], ops[1]), _isEmpty, undefined);
}

export default difference;
