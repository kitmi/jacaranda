import path from 'node:path';
import { Types } from '@kitmi/validators/allSync';

export default function pathResolve(step, settings) {
    let { path: _path, base } = Types.OBJECT.sanitize(settings, {
        schema: {
            path: { type: 'text' },
            base: { type: 'text' },
        },
    });

    const _base = step.getValue(base);

    const result = path.resolve(_base, step.getValue(_path));

    step.syslog('info', `Resolved path: ${result}`, {
        result,
    });

    return result;
}
