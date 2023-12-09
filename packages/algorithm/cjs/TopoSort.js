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
 * @class
 */ class TopoSort {
    /**
     * Add edges(or one edge, if values is non-array).
     * @param {string} dependency - Incoming node (dependency)
     * @param {string|array} dependents - Outgoing node or nodes
     */ add(dependency, newDependents) {
        // cast to array
        newDependents = Array.isArray(newDependents) ? newDependents : newDependents == null ? [] : [
            newDependents
        ];
        // get the existing dependents
        const dependents = this.mapOfDependents[dependency];
        newDependents.forEach((dependent)=>{
            // get the existing dependencies
            const dependencies = this.mapOfDependencies[dependent];
            if (!dependencies) {
                // new set of dependencies
                this.mapOfDependencies[dependent] = new Set([
                    dependency
                ]);
            } else {
                dependencies.add(dependency);
            }
            if (dependents) {
                dependents.add(dependent);
            }
        });
        if (!dependents) {
            // new set of dependents
            this.mapOfDependents[dependency] = new Set(newDependents);
        }
    }
    depends(node, dependencies) {
        // cast to array
        dependencies = Array.isArray(dependencies) ? dependencies : dependencies == null ? [] : [
            dependencies
        ];
        // get the existing dependencies
        const _dependencies = this.mapOfDependencies[node];
        if (!_dependencies) {
            // new set of dependencies
            this.mapOfDependencies[node] = new Set(dependencies);
        } else {
            dependencies.forEach((dependency)=>{
                _dependencies.add(dependency);
            });
        }
        // get the existing dependents
        dependencies.forEach((dependency)=>{
            const dependents = this.mapOfDependents[dependency];
            if (dependents) {
                dependents.add(node);
            } else {
                // new set of dependents
                this.mapOfDependents[dependency] = new Set([
                    node
                ]);
            }
        });
    }
    hasDependency(node) {
        return this.mapOfDependencies[node] && this.mapOfDependencies[node].size > 0 || false;
    }
    hasDependent(node) {
        return this.mapOfDependents[node] && this.mapOfDependents[node].size > 0 || false;
    }
    /**
     * Sort the graph. Circular graph throw an error with the circular nodes info.
     * Implementation of http://en.wikipedia.org/wiki/Topological_sorting#Algorithms
     * Reference: http://courses.cs.washington.edu/courses/cse326/03wi/lectures/RaoLect20.pdf
     * @return {Array} Sorted list
     */ sort() {
        // The list contains the final sorted nodes.
        const l = [];
        // Find all the initial 0 incoming edge nodes. If not found, this is is a circular graph, cannot be sorted.
        const nodesWithDependents = Object.keys(this.mapOfDependents);
        const nodesWithDependencies = Object.keys(this.mapOfDependencies);
        const initialNodes = new Set(nodesWithDependents);
        nodesWithDependencies.forEach((nodeHasDependency)=>initialNodes.delete(nodeHasDependency));
        // List of nodes with no unsorted dependencies
        const s = [
            ...initialNodes
        ];
        const allNodes = new Set(nodesWithDependents.concat(nodesWithDependencies));
        // number of unsorted nodes. If it is not zero at the end, this graph is a circular graph and cannot be sorted.
        let unsorted = allNodes.size;
        if (s.length === 0 && (nodesWithDependencies.length === 0 || nodesWithDependents.length === 0)) {
            // only 1 node in the graph, no need to sort.
            return Array.from(allNodes);
        }
        const numWithDependencies = _utils._.mapValues(this.mapOfDependencies, (node)=>node.size);
        while(s.length !== 0){
            const n = s.shift();
            l.push(n);
            // decrease unsorted count, node n has been sorted.
            --unsorted;
            // n node might have no dependency, so have to check it.
            const dependentsOfN = this.mapOfDependents[n];
            if (dependentsOfN) {
                // decease n's adjacent nodes' incoming edges count. If any of them has 0 incoming edges, push them into s get them ready for detaching from the graph.
                for (const dependentOfN of dependentsOfN){
                    if (--numWithDependencies[dependentOfN] === 0) {
                        // no unsorted dependencies
                        s.push(dependentOfN);
                    }
                }
            }
        }
        // If there are unsorted nodes left, this graph is a circular graph and cannot be sorted.
        // At least 1 circular dependency exist in the nodes with non-zero incoming edges.
        if (unsorted !== 0) {
            const circular = [];
            for(const node in numWithDependencies){
                if (numWithDependencies[node] !== 0) {
                    circular.push(node);
                }
            }
            throw new Error('At least 1 circular dependency in nodes: \n\n' + circular.join('\n') + '\n\nGraph cannot be sorted!');
        }
        return l;
    }
    constructor(){
        /**
     * Map of nodes to a set of nodes as dependents, <string, Set.<string>>
     * @member {object}
     */ _define_property(this, "mapOfDependents", {});
        /** -
     * Map of nodes to a set of nodes as dependencies, <string, Set.<string>>
     * @member {object}
     */ _define_property(this, "mapOfDependencies", {});
    }
}
const _default = TopoSort;

//# sourceMappingURL=TopoSort.js.map