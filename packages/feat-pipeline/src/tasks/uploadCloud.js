import { HttpClient } from '@kitmi/jacaranda';
import { superagent } from '@kitmi/adapters';
import { Types } from '@kitmi/validtors/allSync';
import path from 'node:path';

export default async function uploadCloud(step, settings) {
    let { file, objectKey, contentType, service, payload } = Types.OBJECT.sanitize(settings, {
        schema: {
            file: { type: 'string' },
            objectKey: { type: 'string' },
            contentType: { type: 'string' },
            service: { type: 'string' },
            payload: { type: 'object', optional: true },
        },
    });

    file = step.getValue(file);
    objectKey = step.getValue(objectKey);
    contentType = step.getValue(contentType);
    service = step.getService(service);

    const fileName = path.basename(file);    

    const httpClient = new HttpClient(superagent());

    const url = await service.getUploadUrl_(objectKey, contentType, payload);

    step.stepLog('info', `Uploading to: ${url}`, {
        fileName,
        objectKey,
        contentType
    });

    const result = await httpClient.upload(url, file, null, { httpMethod: 'put', headers: { 'Content-Type': contentType }, fileName });

    step.stepLog('info', 'Successfully uploaded.', {        
        result
    });

    return result;
}
