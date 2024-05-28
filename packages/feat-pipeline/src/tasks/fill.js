import { Types } from '@kitmi/validators/allSync';
import { _, set as _set } from '@kitmi/utils';

export default function fill(step, settings) {
    let { data, target } = Types.OBJECT.sanitize(settings, {
        schema: {
            data: { type: 'object' },
            target: { type: 'text', optional: true },
        },
    });

    const result = {};

    if (target) {
        target = step.getValue(target);
    }

    _.each(data, (value, key) => {
        value = step.getValue(value);
        if (target) {
            _set(target, key, value);
        } else {
            step.setData(key, value);
        }

        result[key] = value;
    });    

    step.syslog('info', 'Filled output data.', {
        result
    });

    return result;
}
