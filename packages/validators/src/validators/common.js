import makeValidator from '../makeValidator';

const common = {
    max: makeValidator(
        (value, maxValue) => value <= maxValue,
        'The value must be less than or equal to the max value.'
    ),
    min: makeValidator(
        (value, minValue) => value >= minValue,
        'The value must be greater than or equal to the min value.'
    ),
    length: makeValidator(
        (value, length) => value.length === length,
        'The length of the value must be equal to the specified length.'
    ),
    maxLength: makeValidator(
        (value, maxLength) => value.length <= maxLength,
        'The length of the value must be less than or equal to the max length.'
    ),
    minLength: makeValidator(
        (value, minLength) => value.length >= minLength,
        'The length of the value must be greater than or equal to the min length.'
    ),
    exist: makeValidator(
        (value, required) => !required || value != null,
        'The value must not NULL.',
        true
    )
};

common.isRequired = common.exist;

export default common;
