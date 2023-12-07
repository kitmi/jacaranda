import _reduce from 'lodash/reduce';

const filterNull = (obj) =>
    _reduce(
        obj,
        (result, v, k) => {
            if (v != null) {
                result[k] = v;
            }

            return result;
        },
        {}
    );

export default filterNull;
