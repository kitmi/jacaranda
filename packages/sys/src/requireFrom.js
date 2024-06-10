import { createRequire } from 'node:module';
import path from 'node:path';

function requireFrom(packageName, fromPath) {
    const requireFromPath = createRequire(fromPath.endsWith(path.sep) ? fromPath : fromPath + path.sep);

    return requireFromPath(packageName);
}

export default requireFrom;
