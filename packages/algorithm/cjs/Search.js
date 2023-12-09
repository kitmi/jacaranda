/**
 * Perform a breadth-first search on a graph or tree.
 * @param {Object} root - The root node to start the search from.
 * @param {Function} visit - A function to call for each visited node, return true to end up the search.
 * @param {Function} getChildren - A function to get the children of a node.
 * @returns {Object} The node found
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    bfs: function() {
        return bfs;
    },
    dfs: function() {
        return dfs;
    }
});
function bfs(root, visit, getChildren) {
    const queue = Array.isArray(root) ? [
        ...root
    ] : [
        root
    ];
    const visited = new Set();
    visited.add(root);
    let found;
    while(queue.length > 0){
        const node = queue.shift();
        if (visit(node)) {
            found = node;
            break;
        }
        const children = getChildren(node);
        children?.forEach((child)=>{
            if (!visited.has(child)) {
                visited.add(child);
                queue.push(child);
            }
        });
    }
    return found;
}
function dfs(root, visit, getChildren) {
    const stack = Array.isArray(root) ? [
        ...root
    ].reverse() : [
        root
    ];
    const visited = new Set();
    let found;
    while(stack.length > 0){
        const node = stack.pop();
        if (!visited.has(node)) {
            if (visit(node)) {
                found = node;
                break;
            }
            visited.add(node);
            const children = getChildren(node);
            if (!children || children.length === 0) {
                continue;
            }
            const [leftNode, ...right] = children;
            right.reverse().forEach((child)=>{
                stack.push(child);
            });
            stack.push(leftNode);
        }
    }
    return found;
}

//# sourceMappingURL=Search.js.map