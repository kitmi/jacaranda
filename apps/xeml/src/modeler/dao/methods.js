const { naming } = require('@kitmi/utils');

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

const popJob = (connector, entityName) => {
    const snakeName = naming.snakeCase(entityName);
    return `
    /**
     * Get the next pending task.
     * @param {string} [jobName] - The job name.
     * @returns {Promise<Object>} { data }.
     */
    async popJob_(jobName) {
        return this.db.connector.execute_('SELECT * FROM get_task_from_${snakeName}(${connector.specParamToken})', [jobName]);
    }
`;
};

const postJob = () => {
    return `
    /**
     * Post a new task.
     * @param {string} jobName - The job name.
     * @param {object} data - The job data.
     * @returns {Promise<Object>} { data }.
     */
    async postJob_(jobName, data) {
        return this.create_({ name: jobName, data }, { $getCreated: true });
    }
`;
};

const jobDone = () => {
    return `
    /**
     * Mark a task as completed.
     * @param {integer} jobId
     * @returns {Promise<Object>} { data }.
     */
    async wellDone_(jobId) {
        return this.updateOne_({ status: 'completed' }, { $where: { id: jobId }, $getUpdated: true });
    }
`;
};

const jobFail = () => {
    return `
    /**
     * Mark a task as failed with error.
     * @param {integer} jobId
     * @returns {Promise<Object>} { data }.
     */
    async fail_(jobId, error) {
        return this.updateOne_({ status: 'failed', error }, { $where: { id: jobId }, $getUpdated: true });
    }
`;
};

const postDeferredJob = () => {
    return `
    /**
     * Post a new deferred task.
     * @param {string} jobName - The job name.
     * @param {object} data - The job data.
     * @param {number} [deferredMs] - The deferred time in milliseconds.
     * @returns {Promise<Object>} { data }.
     */
    async postJob_(jobName, data, deferredMs) {
        const due = this.db.app.i18n.datePlus(new Date(), { milliseconds: deferredMs || 3000 });

        return this.create_({ name: jobName, dueAt: due, data, batchId: '*' }, { $getCreated: true });
    }
`;
};

const removeExpiredJobs = () => {
    return `
    /**
     * Remove expired tasks.
     * @param {number} [expirySeconds] - The expiry time in seconds.
     * @returns {Promise<Object>} { data }.
     */
    async removeExpiredJobs_(expirySeconds) {
        const expired = this.db.app.i18n.dateMinus(new Date(), { seconds: expirySeconds || 1800 });

        return this.deleteMany_({
            $where: {
                batchId: { $neq: '*' },
                dispatchedAt: { $lte: expired },
                lockerId: { $exists: false },
            },
            $getDeleted: true,
        });
    }
`;
};

const getDueJobs = () => {
    return `
    /**
     * Get due tasks.
     * @returns {Promise<Object>} { data }.
     */
    async getDueJobs_() {
        const now = new Date();
        const batchId = (now.getTime() - 1640995200000).toString();

        return this.updateMany_(
            {
                batchId,
                dispatchedAt: now,
            },
            {
                $where: {
                    batchId: '*',
                    dueAt: { $lte: now },
                },
                $getUpdated: true,
            }
        );
    }
`;
}

const getBatchStatus = () => {
    return `
    /**
     * Get the status of all batches.
     * @returns {Promise<Object>} { numPending, numProcessing, batches }.
     */
    async getBatchStatus_() {
        const { data: batchStats } = await this.findMany_({
            $select: ['batchId', xrCall('Count', xrCol('batchId'))],
            $where: {
                lockerId: { $exists: false },
            },
            $groupBy: ['batchId'],
            $skipOrm: true,
            $asArray: true,
        });

        let pending = 0;
        let processing = 0;
        const batches = {};

        batchStats.forEach((batch) => {
            if (batch[0] === '*') {
                pending = batch[1];
            } else {
                batches[batch[0]] = batch[1];
                processing += batch[1];
            }
        });

        return {
            numPending: pending,
            numProcessing: processing,
            batches,
        };
    }
`;
};

module.exports = {
    getAllDescendants,
    getAllAncestors,
    addChildNode,
    getTopNodes,
    moveNode,
    popJob,
    postJob,
    jobDone,
    jobFail,
    postDeferredJob,
    removeExpiredJobs,
    getDueJobs,
    getBatchStatus,
};
