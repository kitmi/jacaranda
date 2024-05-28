import { fs } from '@kitmi/sys';
import { Types } from '@kitmi/validators/allSync';
import path from 'node:path';
import mime from 'mime';

export default async function fileInfo(step, settings) {
    let { file } = Types.OBJECT.sanitize(settings, {
        schema: {
            file: { type: 'text' }
        },
    });

    const filePath = step.getValue(file);
    const stat = await fs.stat(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);

    const result = {
        baseName,
        extName: ext,
        fileName: baseName + ext,
        size: stat.size,
        mime: mime.getType(ext),
    };

    step.syslog('info', `File info attained for "${filePath}".`, {
        result,
    });

    return result;
}
