import makeValidator from '../makeValidator';

const common = {
    max: makeValidator(
        (value, maxValue) => value <= maxValue,
        'The value ({{value}}) must be less than or equal to the max value ({{options}}).'
    ),
    min: makeValidator(
        (value, minValue) => value >= minValue,
        'The value ({{value}}) must be greater than or equal to the min value ({{options}}).'
    ),
    length: makeValidator(
        (value, length) => value.length === length,
        'The length of the value ({{value.length}}) must be equal to the specified length ({{options}}).'
    ),
    maxLength: makeValidator(
        (value, maxLength) => value.length <= maxLength,
        'The length of the value ({{value.length}}) must be less than or equal to the max length ({{options}}).'
    ),
    minLength: makeValidator(
        (value, minLength) => value.length >= minLength,
        'The length of the value ({{value.length}}) must be greater than or equal to the min length ({{options}}).'
    ),
    exist: makeValidator((value, required) => !required || value != null, 'The value must not NULL.', true),
};

common.required = common.exist;

export default common;
