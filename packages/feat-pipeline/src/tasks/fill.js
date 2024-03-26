import { Types } from '@kitmi/validators/allSync';
import { _ } from '@kitmi/utils';

export default function fill(step, settings) {
    let { data } = Types.OBJECT.sanitize(settings, {
        schema: {
            data: { type: 'object' }
        },
    });

    const result = {};

    _.each(data, (value, key) => {
        value = step.getValue(value);
        step.setData(key, value);
        result[key] = value;
    });    

    step.stepLog('info', 'Filled output data.', {
        result
    });

    return result;
}
