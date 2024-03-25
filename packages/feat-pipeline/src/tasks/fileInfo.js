import { fs } from '@kitmi/sys';
import path from 'node:path';
import mime from 'mime';

export default async function fileInfo(step, settings) {
    if (!settings.file) {
        throw new Error('Missing file setting.');
    }

    const filePath = step.getValue(settings.file);
    const stat = await fs.stat(filePath);
    const ext = path.extname(filePath);

    const result = {
        baseName: path.basename(filePath, ext),
        extName: ext,
        fileName: baseName + ext,
        size: stat.size,
        mime: mime.getType(ext),
    };

    step.stepLog('info', `File info for "${filePath}".`, {
        result,
    });

    return result;
}
