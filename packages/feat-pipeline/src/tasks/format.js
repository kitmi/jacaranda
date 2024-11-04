import { Types } from '@kitmi/validators/allSync';
import { esTemplate } from '@kitmi/utils';

export default function format(step, settings) {
    let { template } = Types.OBJECT.sanitize(settings, {
        schema: {
            template: { type: 'text' },
        },
    });

    const variables = step.cloneValues();

    const result = esTemplate(template, variables);

    step.syslog('info', 'Formatted by template.', {
        result,
    });

    return result;
}
