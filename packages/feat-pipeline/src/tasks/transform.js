import Ts, { Types } from '@kitmi/validators/allSync';

export default function transform(step, settings) {
    let { input, ...schema } = Types.OBJECT.sanitize(settings, {
        schema: {
            input: { type: 'text' },
            type: { type: 'text' },
        },
        keepUnsanitized: true,
    });

    input = step.getValue(input);

    const result = Ts.sanitize(input, schema);

    step.syslog('info', 'Object transformed.', {
        result,
    });

    return result;
}
