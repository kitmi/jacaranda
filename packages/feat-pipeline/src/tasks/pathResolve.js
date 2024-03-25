import path from 'node:path';

export default function pathResolve(step, settings) {
    const { path: _path, base } = settings;
    const _base = step.getValue(base);
    return path.resolve(_base, step.getValue(_path));
};
