import typeSystem from '@kitmi/validators/allSync';
import { _ } from '@kitmi/utils';
import { ValidationError } from '@kitmi/types';

const validatorTable = typeSystem.handlers.validator;

export const _Validators = _.mapValues(
    validatorTable,
    (validator, name) => (entity, field, context, value, payload) => {
        if (!validator.__metaCheckNull && value == null) return value;

        if (context.options.$skipValidators?.has(name)) return value;

        const [validated, reason] = validator(value, payload, field, context);

        if (!validated) {
            if (context.options.$dryRun) {
                context.options.$errors || (context.options.$errors = []);
                context.options.$errors.push({ message: reason, info: { value } });
                return value;
            }

            throw new ValidationError(reason, { value, payload });
        }

        return value;
    }
);

export default validatorTable;
