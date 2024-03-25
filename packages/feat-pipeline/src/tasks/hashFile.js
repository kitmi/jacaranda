import { hashFile_ } from '@kitmi/jacaranda/features/utils/hash';

export default async function hashFile(step, settings) {
    const { algorithm = 'md5', file } = settings;

    const filePath = step.getValue(file);

    const digest = await hashFile_(algorithm, filePath);

    step.stepLog('info', `File "${filePath}" hashed with "${algorithm}" algorithm.`, {
        digest,
    });

    return digest;
}
