import { template } from '@kitmi/utils';

/**
 * Wrap the validate function into a validator.
 * @param {Function} validateFunc - Validate function to return true or false
 * @param {string} message - Error message
 * @param {bool} checkNull - Whether to continue vaildation if given value is null
 * @returns {array} <bool, string>
 */
const makeValidator = (validateFunc, message, checkNull) => {
    const functor = (value, options, meta, context) => {
        const validated = validateFunc(value, options, context);
        if (!validated) {
            return [
                false,
                context.i18n?.t ? context.i18n.t(message, { value, options }) : template(message, { value, options }),
            ];
        }

        return [true];
    };

    if (checkNull) {
        functor.__metaCheckNull = true;
    }

    return functor;
};

export default makeValidator;
