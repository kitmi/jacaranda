"use strict";
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
    KeyTree: function() {
        return KeyTree;
    },
    default: function() {
        return _default;
    }
});
const _utils = require("@kitmi/utils");
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
/**
 * A closure function to be called to check the data of each node whether meets certain condition
 * @callback predicateFunction
 * @param {Node} node
 * @returns {boolean}
 */ /**
 * Tree factory.
 * @param {Node} Node
 * @returns {Tree}
 */ const Tree = (Node)=>{
    class _class extends Node {
        /**
         * Find a node by BFS.
         * @param {predicateFunction} predicate
         */ find(predicate) {
            let queue = Node.cloneChildrenList(this);
            while(queue.length > 0){
                const node = queue.shift();
                if (predicate(node)) return node;
                queue = queue.concat(Node.cloneChildrenList(node));
            }
            return undefined;
        }
    }
    _define_property(_class, "Node", Node);
    return _class;
};
/**
 * Tree node with data property.
 * @class
 */ class DataNode {
    static cloneChildrenList(node) {
        return node.children.concat();
    }
    /**
     * Number of nodes.
     * @member {number}
     */ get size() {
        return this.children.length;
    }
    /**
     * Append the given node to the end of the children list.
     * @param {DataNode} node
     */ append(node) {
        node.parent = this;
        this.children.push(node);
    }
    /**
     * Insert the given node at specified index in the children list.
     * @param {number} i
     * @param {DataNode} node
     */ insert(i, node) {
        node.parent = this;
        this.children.splice(Math.max(0, i), 0, node);
    }
    /**
     * Remove the given node from the branch.
     * @param {DataNode} node
     * @returns {DataNode}
     */ remove(node) {
        if (node.parent !== this) {
            throw new Error('Removing a node which is not a child of the current node.');
        }
        this.children = _utils._.reject(this.children, (n)=>n === node);
        delete node.parent;
        return node;
    }
    /**
     * Remove the node at the given index from the branch.
     * @param {number} i
     * @returns {DataNode}
     */ removeAtIndex(i) {
        const [removed] = this.children.splice(i, 1);
        if (removed) {
            delete removed.parent;
        }
        return removed;
    }
    /**
     * Create a data node with given data.
     * @param {*} data
     */ constructor(data){
        /**
     * Array of children nodes.
     * @member {array}
     */ _define_property(this, "children", []);
        /**
         * Data property.
         * @member {*}
         */ this.data = data;
    }
}
/**
 * Tree node with key property and data property.
 * @class
 */ class KeyDataNode {
    static cloneChildrenList(node) {
        return Object.values(node.children);
    }
    /**
     * Number of nodes.
     * @member {number}
     */ get size() {
        return Object.keys(this.children).length;
    }
    /**
     * Fina a node by path being an array of keys.
     * @param {array.<string>} keys
     */ findByKeyPath(keys) {
        keys = keys.concat();
        if (keys.length === 0 || keys[0] !== this.key) {
            return undefined;
        }
        let value = {
            children: {
                [this.key]: this
            }
        };
        _utils._.find(keys, (key)=>{
            value = value.children[key];
            return typeof value === 'undefined';
        });
        return value;
    }
    /**
     * Append data by path being an array of keys.
     * @param {array.<string>} keys
     * @param {*} data
     * @returns {KeyDataNode} The newly created node containing the data.
     */ appendDataByKeyPath(keys, data) {
        keys = keys.concat();
        if (keys.length === 0 || keys[0] !== this.key) {
            throw new Error(`The given key path "${keys.join(' / ')}" is not starting from the correct initial key "${this.key}".`);
        }
        const lastKey = keys.pop();
        let lastNode = {
            children: {
                [this.key]: this
            }
        };
        let node;
        _utils._.each(keys, (key)=>{
            if (key in lastNode.children) {
                lastNode = lastNode.children[key];
            } else {
                node = new KeyDataNode(key);
                lastNode.append(node);
                lastNode = node;
            }
        });
        node = new KeyDataNode(lastKey, data);
        lastNode.append(node);
        return node;
    }
    /**
     * Append the given node to the end of the children list.
     * @param {KeyDataNode} node
     */ append(node) {
        node.parent = this;
        if (node.key in this.children) {
            throw new Error(`Duplicate node key: ${node.key}`);
        }
        this.children[node.key] = node;
    }
    /**
     * Remove the given node from the branch.
     * @param {KeyDataNode} node
     */ remove(node) {
        if (node.parent !== this || !(node.key in this.children)) {
            throw new Error('Removing a node which is not a child of the current node.');
        }
        delete this.children[node.key];
        delete node.parent;
        return node;
    }
    /**
     * Get key path of current node (a key chain from root to itself).
     * @returns {array}
     */ getKeyPath() {
        const paths = [
            this.key
        ];
        let curr = this;
        while(curr.parent){
            curr = curr.parent;
            paths.push(curr.key);
        }
        return paths.reverse();
    }
    /**
     * Create a key-data node with key and given data.
     * @param {string} key
     * @param {*} data
     */ constructor(key, data){
        /**
     * Map of keys to children nodes.
     * @member {object}
     */ _define_property(this, "children", {});
        /**
         * Node key.
         * @member {string}
         */ this.key = key;
        /**
         * Data property.
         * @member {*}
         */ this.data = data;
    }
}
const KeyTree = Tree(KeyDataNode);
const _default = Tree(DataNode);

//# sourceMappingURL=Tree.js.map