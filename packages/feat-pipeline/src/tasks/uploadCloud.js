import { Types } from '@kitmi/validators/allSync';
import path from 'node:path';

export default async function uploadCloud(step, settings) {
    let { file, objectKey, contentType, service, payload } = Types.OBJECT.sanitize(settings, {
        schema: {
            file: { type: 'text' },
            objectKey: { type: 'text' },
            contentType: { type: 'text' },
            service: { type: 'text' },
            payload: { type: 'object', optional: true },
        },
    });

    file = step.getValue(file);
    objectKey = step.getValue(objectKey);
    contentType = step.getValue(contentType);
    service = step.getService(service);

    const fileName = path.basename(file);

    step.stepLog('info', `Uploading to cloud...`, {
        fileName,
        objectKey,
        contentType,
    });

    const result = await service.upload_(objectKey, file, contentType, payload);

    step.stepLog('info', 'Successfully uploaded.', {
        result,
    });

    return result;
}
