export const typesToJsv = (context, meta) => ({
    ROOT: context.root,
    PARENT: context.parent,
    path: context.path,
    PAYLOAD: meta,
});

export const jsvToTypes = (context) => ({
    root: context.ROOT,
    parent: context.PARENT,
    path: context.path,
});
