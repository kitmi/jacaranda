import isFinite from 'lodash/isFinite';

function toFloat(value) {
    return isFinite(value) ? value : parseFloat(value);
}

export default toFloat;
