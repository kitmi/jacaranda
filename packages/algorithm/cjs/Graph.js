"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _utils = require("@kitmi/utils");
const _TopoSort = /*#__PURE__*/ _interop_require_default(require("./TopoSort"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class Graph {
    hasNode(key) {
        return key in this.nodes;
    }
    getNode(key) {
        return this.nodes[key];
    }
    setNode(key, value) {
        this.nodes[key] = value;
        return this;
    }
    setEdge(sourceNode, targetNode) {
        if (!this.hasNode(sourceNode)) {
            throw new Error(`Source node [${sourceNode}] not exists.`);
        }
        if (!this.hasNode(targetNode)) {
            throw new Error(`Target node [${targetNode}] not exists.`);
        }
        this.topo.add(sourceNode, targetNode);
        return this;
    }
    getTargetNodes(sourceNode) {
        return Array.from(this.topo.mapOfDependents[sourceNode]);
    }
    getSourceNodes(targetNode) {
        return Array.from(this.topo.mapOfDependencies[targetNode]);
    }
    /**
     * Calculate start and end nodes.
     * @returns {Graph}
     */ calcStartEnd() {
        const seq = this.topo.sort();
        this.startNodes = _utils._.takeWhile(seq, (e)=>!this.topo.hasDependency(e));
        this.endNodes = _utils._.takeRightWhile(seq, (e)=>!this.topo.hasDependent(e));
        if (this.startNodes.length === 0) {
            this.startNodes = Object.keys(this.nodes);
        }
        if (this.endNodes.length === 0) {
            this.endNodes = Object.keys(this.nodes);
        }
        return this;
    }
    toJSON() {
        return {
            nodes: this.nodes,
            edges: _utils._.mapValues(this.topo.mapOfDependents, (nodes)=>Array.from(nodes)),
            startNodes: this.startNodes,
            endNodes: this.endNodes
        };
    }
    /**
     * Directed graph.
     * @constructs Graph
     * @param {object} json 
     * @property {object} json.nodes - key-value pairs of nodes
     * @property {object} json.edges - key-value pairs of edges, source => [target1, target2, ...]
     */ constructor(json){
        this.topo = new _TopoSort.default();
        if (json) {
            this.nodes = _utils._.cloneDeep(json.nodes);
            if (!_utils._.isEmpty(json.edges)) {
                _utils._.forOwn(json.edges, (targets, source)=>{
                    this.topo.add(source, targets);
                });
            }
            this.startNodes = json.startNodes;
            this.endNodes = json.endNodes;
        } else {
            this.nodes = {};
        }
    }
}
const _default = Graph;

//# sourceMappingURL=Graph.js.map