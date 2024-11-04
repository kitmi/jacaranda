import typeSystem from '@kitmi/validators/allSync';
import { _ } from '@kitmi/utils';
import { ValidationError } from '@kitmi/types';

const validatorTable = typeSystem.handlers.validator;

export const _Validators = _.mapValues(
    validatorTable,
    (validator, name) => (entity, field, context, value, payload) => {
        if (!validator.__metaCheckNull && value == null) return value;

        if (skipValidator(field, context, name)) return value;

        const [validated, reason] = validator(value, payload, field, context);

        if (!validated) {
            if (context.options.$dryRun) {
                context.options.$errors || (context.options.$errors = []);
                context.options.$errors.push({
                    message: reason,
                    info: { entity: entity.meta.name, field: field.name, value },
                });
                return value;
            }

            throw new ValidationError(reason, { entity: entity.meta.name, field: field.name, value, payload });
        }

        return value;
    }
);

export const skipValidator = (field, context, validatorName) => {
    const validators = context?.options.$skipValidators;
    if (validators && (validators.has(validatorName) || validators.has(field.name + '.' + validatorName))) return true;
    return false;
};

export default validatorTable;
