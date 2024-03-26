import { Types } from '@kitmi/validators/allSync';
import { hashFile_ } from '@kitmi/jacaranda/features/utils/hash';

export default async function hashFile(step, settings) {
    let { algorithm, file } = Types.OBJECT.sanitize(settings, {
        schema: {
            algorithm: { type: 'text', optional: true, default: 'md5' },
            file: { type: 'text' },
        },
    });

    const filePath = step.getValue(file);

    const digest = await hashFile_(algorithm, filePath);

    step.stepLog('info', `File "${filePath}" hashed with "${algorithm}" algorithm.`, {
        digest,
    });

    return digest;
}
