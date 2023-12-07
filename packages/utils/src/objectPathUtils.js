import ensureEndsWith from './ensureEndsWith';

export const toPathArray = (p, keyPathSeparator = '.') =>
    p == null ? [] : typeof p === 'string' ? p.split(keyPathSeparator) : Array.isArray(p) ? p : [p];

export const makePathArray = (part1, part2, keyPathSeparator = '.') => [
    ...toPathArray(part1, keyPathSeparator),
    ...toPathArray(part2, keyPathSeparator),
];

export const toPath = (p, keyPathSeparator = '.') =>
    p == null ? null : Array.isArray(p) ? p.join(keyPathSeparator) : p.toString();

export const makePath = (part1, part2, keyPathSeparator = '.') => {
    const path1 = toPath(part1, keyPathSeparator);
    const path2 = toPath(part2, keyPathSeparator);

    return path1 ? (path2 ? ensureEndsWith(path1, keyPathSeparator) + path2 : path1) : path2;
};
