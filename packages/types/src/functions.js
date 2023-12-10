export const everTrue = () => true;
export const identity = (value) => value;
export const toggle = (value) => !value;

export const typeOf = (value) => {
    if (value == null) return 'any';

    const _type = typeof value;

    if (_type === 'number') {
        return Number.isInteger(value) ? 'integer' : 'number';
    }

    if (_type === 'object') {
        if (Array.isArray(value)) {
            return 'array';
        }

        if (value instanceof Date) {
            return 'datetime';
        }

        if (value instanceof Buffer) {
            return 'binary';
        }
    }

    return _type;
};
