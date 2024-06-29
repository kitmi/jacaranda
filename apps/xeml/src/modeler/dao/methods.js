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
            $select: selectColumns, 
            $where: { '${ancestorsAnchor}.ancestorId': currentId },
            $relation: [ '${ancestorsAnchor}' ] 
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
            $select: selectColumns, 
            $where: { '${descendantsAnchor}.descendantId': currentId },
            $relation: [ '${descendantsAnchor}' ] 
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
            ancestorId: 'ancestorId',
            'anyNode.descendantId': 'descendantId',
            '::depth': 'depth',
        }, {
            $select: [ 
                'ancestorId', 
                'anyNode.descendantId', 
                xrAlias(xrExpr(xrExpr(xrCol('depth'), '+', xrCol('anyNode.depth')), '+', 1), 'depth'), 
            ],
            $where: { 'descendantId': parentId, 'anyNode.ancestorId': childId },
            $relation: [ { alias: 'anyNode', entity: '${closureTable}', on: null } ],
            $skipOrm: true,
        });
    }
`;

module.exports = {
    getAllDescendants,
    getAllAncestors,
    addChildNode,
};