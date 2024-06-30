const { _, quote } = require('@kitmi/utils');
const { extractDotSeparateName } = require('../../lang/XemlUtils');
const JsLang = require('../util/ast');

const getAllDescendants = (ancestorsAnchor) => `
    /**
     * Get all descendant nodes of the given parent node.
     * @param {*} currentId - The current node id.
     * @param {array} [selectColumns] - The columns to select.
     * @returns {Promise<Object>} { data }.
     */
    async getAllDescendants_(currentId, selectColumns) {
        return this.findMany_({ 
            $select: selectColumns ?? ['*', '${ancestorsAnchor}.depth'], 
            $where: { '${ancestorsAnchor}.ancestorId': currentId },
            $relation: [ '${ancestorsAnchor}' ], 
            $skipOrm: true,
        });
    }
`;

const getAllAncestors = (descendantsAnchor) => `
    /**
     * Get all ancestor nodes of the given parent node.
     * @param {*} currentId - The current node id.
     * @param {array} [selectColumns] - The columns to select.
     * @returns {Promise<Object>} { data }.
     */
    async getAllAncestors_(currentId, selectColumns) {
        return this.findMany_({ 
            $select: selectColumns ?? ['*', '${descendantsAnchor}.depth'], 
            $where: { '${descendantsAnchor}.descendantId': currentId },
            $relation: [ '${descendantsAnchor}' ], 
            $skipOrm: true,
        });
    }
`;

const addChildNode = (descendantsAnchor, closureTable) => `
    /**
     * Add a child node to the given parent node.
     * @param {*} parentId - The parent node id.
     * @param {*} childId - The child node id.
     * @returns {Promise<Object>} { data, affectedRows }.
     */
    async addChildNode_(parentId, childId) {
        const ClosureTable = this.getRelatedEntity('${descendantsAnchor}');

        return ClosureTable.createFrom_({
            $select: [ 
                'ancestorId', 
                'anyNode.descendantId', 
                xrAlias(xrExpr(xrExpr(xrCol('depth'), '+', xrCol('anyNode.depth')), '+', 1), 'depth'), 
            ],
            $where: { 'descendantId': parentId, 'anyNode.ancestorId': childId },
            $relation: [ { alias: 'anyNode', entity: '${closureTable}', joinType: 'CROSS JOIN', on: null } ],
        }, { 
            ancestorId: 'ancestorId',
            'anyNode.descendantId': 'descendantId',
            '::depth': 'depth',
        });
    }
`;

const getTopNodes = (tableName, keyField, closureTable) => `
    /**
     * Get all top nodes.
     * @param {object} [findOptions] - Extra find options.
     * @returns {Promise<Object>} { data }.
     */
    async getTopNodes_(findOptions) {
        const { $where, ...others } = findOptions || {};

        return this.findMany_({ 
            $where: { 
                ...$where, 
                $expr_$: { 
                    $notExists: xrDataSet(
                        '${closureTable}', 
                        { 
                            $select: ['descendantId'], 
                            $where: { descendantId: xrCol('_.${tableName}.${keyField}'), depth: { $gt: 0 } }, 
                            $limit: 1 
                        }
                    ) 
                } 
            },
            ...others,
            $hasSubQuery: true,
        });
    }
`;

const moveNode = (closureTable, descendantsAnchor) => `
    /**
     * Move a node to a new parent.
     * @param {*} parentId - The parent node id.
     * @param {*} childId - The child node id.
     * @returns {Promise<Object>} { data, affectedRows }.
     */
    async moveNode_(parentId, childId) {
        const ClosureTable = this.getRelatedEntity('${descendantsAnchor}');

        // Step 1: Disconnect from current ancestors
        await ClosureTable.deleteMany_({
            ancestorId: {
                $in: xrDataSet('${closureTable}', {
                    $select: ['ancestorId'],
                    $where: { descendantId: childId, depth: { $gt: 0 } },
                }),
            },           
            descendantId: {
                $in: xrDataSet('${closureTable}', {
                    $select: ['descendantId'],
                    $where: { ancestorId: childId },
                }),
            },
        });

        // Step 2: Connect to new parent
        return await this.addChildNode_(parentId, childId);
    }
`;

module.exports = {
    getAllDescendants,
    getAllAncestors,
    addChildNode,
    getTopNodes,
    moveNode,
};