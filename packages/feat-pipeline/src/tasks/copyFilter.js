import { Types } from '@kitmi/validators/allSync';
import { _ } from '@kitmi/utils';

export default function copyFilter(step, settings) {
    let { input, filter } = Types.OBJECT.sanitize(settings, {
        schema: {
            input: { type: 'text' },
            filter: { type: 'array', optional: true },
        },
    });

    let result = step.getValue(input);

    if (filter) {
        result = _.omit(result, filter);        
    }

    step.setData(result);

    step.stepLog('info', `Copied from "${input}" and filtered.`, {
        result,
    });

    return result;
}
