import typeSystem from '@kitmi/validators/allSync';
import { _ } from '@kitmi/utils';
import { ValidationError } from '@kitmi/types';

const Validators = _.mapValues(
    typeSystem.handlers.validator,
    (validator, name) => (entity, field, context, value, payload) => {
        if (!validator.__metaCheckNull && value == null) return value;

        if (context.options.$skipValidators?.has(name)) return value;

        const [validated, reason] = validator(value, payload, field, context);

        if (!validated) {
            throw new ValidationError(reason, { value, payload });
        }

        return value;
    }
);

export default Validators;
