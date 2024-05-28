import { Types } from '@kitmi/validators/allSync';
import { hashFile_ } from '@kitmi/feat-cipher';

export default async function hashFile(step, settings) {
    let { algorithm, file } = Types.OBJECT.sanitize(settings, {
        schema: {
            algorithm: { type: 'text' },
            file: { type: 'text' },
        },
    });

    algorithm = step.getValue(algorithm);
    const filePath = step.getValue(file);

    const digest = await hashFile_(algorithm, filePath);

    step.syslog('info', `File "${filePath}" hashed with "${algorithm}" algorithm.`, {
        digest,
    });

    return digest;
}
