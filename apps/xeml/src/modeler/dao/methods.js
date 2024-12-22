const { naming } = require('@kitmi/utils');

const getAllDescendants = (entity, feature) => {
    const ancestorsAnchor = feature.reverse;
    const defaultOrderBy1 = feature.orderField ?? entity.key;

    return `
    /**
     * Get all descendant nodes of the given parent node.
     * @param {*} currentId - The current node id.
     * @param {array} [selectColumns] - The columns to select.
     * @param {number} [maxLevel] - The maximum level of descendants to retrieve.
     * @returns {Promise<Object>} { data }.
     */
    async getAllDescendants_(currentId, selectColumns, maxLevel) {
        const $where = { '${ancestorsAnchor}.ancestorId': currentId };

        if (maxLevel != null) {
            $where['${ancestorsAnchor}.depth'] = { $lte: maxLevel };
        }

        return this.findMany_({ 
            $select: selectColumns ?? ['*', '${ancestorsAnchor}.depth'], 
            $where,
            $relation: [ '${ancestorsAnchor}' ], 
            $orderBy: { '${ancestorsAnchor}.depth': 1, '${defaultOrderBy1}': 1 },
            $skipOrm: true,
            $skipOrmWarn: true,
        });
    }
`;
};

const getAllAncestors = (entity, feature) => {
    const descendantsAnchor = feature.relation;
    const defaultOrderBy1 = feature.orderField ?? entity.key;

    return `
    /**
     * Get all ancestor nodes of the given parent node.
     * @param {*} currentId - The current node id.
     * @param {array} [selectColumns] - The columns to select.
     * @param {number} [maxLevel] - The maximum level of ancestors to retrieve.
     * @returns {Promise<Object>} { data }.
     */
    async getAllAncestors_(currentId, selectColumns, maxLevel) {
        const $where = { '${descendantsAnchor}.descendantId': currentId };

        if (maxLevel != null) {
            $where['${descendantsAnchor}.depth'] = { $gte: xrExpr(xrCol('${descendantsAnchor}.depth'), '-', maxLevel) };
        }

        return this.findMany_({ 
            $select: selectColumns ?? ['*', '${descendantsAnchor}.depth'], 
            $where,
            $relation: [ '${descendantsAnchor}' ], 
            $orderBy: { '${descendantsAnchor}.depth': -1, '${defaultOrderBy1}': 1 },
            $skipOrm: true,
            $skipOrmWarn: true,
        });
    }
`;
};

const addChildNode = (descendantsAnchor, closureTable) => `
    /**
     * Add a child node to the given parent node.
     * @param {*} parentId - The parent node id.
     * @param {*} childId - The child node id.
     * @returns {Promise<Object>} { data, affectedRows }.
     */
    async addChildNode_(parentId, childId) {
        const closureTableInfo = this.meta.associations['${descendantsAnchor}'];

        return this.db.transaction_(async (db) => {
            const ClosureTable = db.entity(closureTableInfo.entity);

            const potentialCycle = await ClosureTable.findOne_({ 
                $select: ['id'], 
                $where: { descendantId: parentId, ancestorId: childId } 
            });

            if (potentialCycle != null) {
                throw new ValidationError('Potential cycle detected from child to parent.', {
                    entity: this.meta.name,
                    parentId,
                    childId
                });
            }
            
            return ClosureTable.createFrom_({
                $select: [ 
                    'ancestorId', 
                    'anyNode.descendantId', 
                    xrAlias(xrExpr(xrExpr(xrCol('depth'), '+', xrCol('anyNode.depth')), '+', 1), 'depth'), 
                ],
                $where: { 'descendantId': parentId, 'anyNode.ancestorId': childId },
                $relation: [ { alias: 'anyNode', entity: '${closureTable}', joinType: 'CROSS JOIN', on: null } ],
                $upsert: { depth: xrCall('LEAST', xrCol('depth'), xrCol('EXCLUDED.depth')) } 
            }, { 
                ancestorId: 'ancestorId',
                'anyNode.descendantId': 'descendantId',
                '::depth': 'depth',
            });
        });
    }
`;

const removeSubTree = (descendantsAnchor, closureTable) => `
    /**
     * Remove a child node from any tree.
     * @param {*} nodeId - The child node id.
     * @returns {Promise<Object>} { data, affectedRows }.
     */
    async removeSubTree_(nodeId) {
        const ClosureTable = this.getRelatedEntity('${descendantsAnchor}');
        
        return ClosureTable.deleteMany_({
            ancestorId: {
                $in: xrDataSet('${closureTable}', {
                    $select: ['ancestorId'],
                    $where: { descendantId: nodeId, depth: { $gt: 0 } },
                }),
            },           
            descendantId: {
                $in: xrDataSet('${closureTable}', {
                    $select: ['descendantId'],
                    $where: { ancestorId: nodeId },
                }),
            },
        });
    }
`;

const cloneSubTree = (entity, feature) => {
    const descendantsAnchor = feature.relation;
    const closureTable = feature.closureTable;

    const entityName = naming.pascalCase(entity.name);
    const excludeFields = Object.keys(entity.fields).filter((name) => {
        const f = entity.fields[name];
        return f.auto || f.autoByDb || f.hasActivator || f.updateByDb;
    });

    excludeFields.push('depth');
    const excludeFieldsStr = excludeFields.map((f) => `'${f}'`).join(', ');

    return `
    /**
     * Clone a child node and its descendants.
     * @param {*} nodeId - The child node id.
     * @returns {Promise<Object>} { data, affectedRows }.
     */
    async cloneSubTree_(nodeId, depth) {
        const { data: subTreeNodes } = await this.getAllDescendants_(nodeId, ['*'], depth);
        const subTreeNodesIds = subTreeNodes.map((i) => i.id);

        const ClosureTable = this.getRelatedEntity('${descendantsAnchor}');
        const { data: links } = await ClosureTable.findMany_({
            $where: {
                ancestorId: {
                    $in: subTreeNodesIds,
                },
                descendantId: {
                    $in: subTreeNodesIds,
                },
                depth: {
                    $gt: 0,
                },
            },
        });

        const idMap = {};
        const insertedData = [];

        await this.db.transaction_(async (db) => {
            const ${entityName} = db.entity('${entity.name}');

            await batchAsync_(subTreeNodes, async (item) => {                
                const { data, insertId } = await ${entityName}.create_(
                    _.omit(item, [${excludeFieldsStr}]),
                    {
                        $getCreated: true,
                    }
                );
                insertedData.push(data);
                idMap[item.id] = insertId;                
            });

            if (links.length > 0) {
                await db.connector.createMany_('${closureTable}', ['ancestorId', 'descendantId', 'depth'], 
                    links.map(link => [idMap[link.ancestorId], idMap[link.descendantId], link.depth]), db.transaction);
            }
        });        
        
        return {
            data: insertedData,
            clonedId: idMap[nodeId],
        };
    }

    /**
     * Clone a child node and its descendants to a new parent.
     * @param {*} parentId - The parent node id.
     * @param {*} currentId - The current node id.
     * @param {number} depth - The maximum depth of descendants to clone.
     * @returns {Promise<Object>} { data, affectedRows }.
     */
    async cloneSubTreeToNode_(parentId, currentId, depth) {
        const { data, clonedId } = await this.cloneSubTree_(currentId, depth);
        await this.addChildNode_(parentId, clonedId);
        return { data, clonedId };
    }
`;
};

const getTopNodes = (entity, closureTable) => {
    const tableName = entity.name;
    const keyField = entity.key;

    return `
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
};

const moveNode = (entity) => {
    const entityName = naming.pascalCase(entity.name);
    return `
    /**
     * Move a node to a new parent.
     * @param {*} parentId - The parent node id.
     * @param {*} childId - The child node id.
     * @returns {Promise<Object>} { data, affectedRows }.
     */
    async moveNode_(parentId, childId) {
        return this.db.transaction_(async (db) => {
            const ${entityName} = db.entity('${entity.name}');
            await ${entityName}.removeSubTree_(childId);
            return ${entityName}.addChildNode_(parentId, childId);
        });
    }
`;
};

const getChildren = (ancestorsAnchor) => `
    /**
     * Get all child nodes of the given parent node.
     * @param {*} currentId - The current node id.
     * @param {array} [selectColumns] - The columns to select.
     * @returns {Promise<Object>} { data }.
     */
    async getChildren_(currentId, selectColumns) {
        return this.findMany_({
            $select: selectColumns ?? ['*', '${ancestorsAnchor}.depth'],
            $where: { '${ancestorsAnchor}.ancestorId': currentId, '${ancestorsAnchor}.depth': 1  },
            $relation: ['${ancestorsAnchor}'],
            $skipOrm: true,
            $skipOrmWarn: true,
        });
    }

    /**
     * Get all id of child nodes of the given parent node.
     * @param {*} currentId - The current node id.
     * @returns {Promise<array>} 
     */ 
    async getChildrenId_(currentId) {
        const { data: children } = await this.getChildren_(currentId, ['id']);
        return children.map(item => item.id);
    }
`;

const getParents = (descendantsAnchor) => `
    /**
     * Get the parent node of the given child node.
     * @param {*} currentId - The current node id.
     * @param {array} [selectColumns] - The columns to select.
     * @returns {Promise<Object>} { data }.
     */ 
    async getParents_(currentId, selectColumns) {
        return this.findMany_({
            $select: selectColumns ?? ['*', '${descendantsAnchor}.depth'],
            $where: { '${descendantsAnchor}.descendantId': currentId, '${descendantsAnchor}.depth': 1 },
            $relation: ['${descendantsAnchor}'],
            $skipOrm: true,
            $skipOrmWarn: true,
        });
    }

    /**
     * Get all id of parent nodes of the given child node.
     * @param {*} currentId - The current node id.
     * @returns {Promise<array>} 
     */ 
    async getParentsId_(currentId) {
        const { data: parents } = await this.getParents_(currentId, ['id']);
        return parents.map(item => item.id);
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
     * @param {object} extraFields - Extra job fields.
     * @returns {Promise<Object>} { data }.
     */
    async postJob_(jobName, data, extraFields) {
        return this.create_({ name: jobName, data, ...extraFields }, { $getCreated: true });
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
        return this.updateOne_({ status: 'failed', errors: { $setAt: { at: xrCol('currentRetry'), value: error } } }, { $where: { id: jobId }, $getUpdated: true });
    }
`;
};

const retry = () => {
    return `
    /**
     * Mark a task to retry from failed status.
     * @param {integer} jobId
     * @returns {Promise<Object>} { data }.
     */
    async retry_(jobId) {
        const result = await this.updateOne_({ status: 'pending', currentRetry: xrExpr(xrCol('currentRetry'), '+', 1) }, { $where: { id: jobId, status: 'failed', currentRetry: { $lt: xrCol('maxRetry') } }, $getUpdated: true });
        if (result.affectedRows === 0) {
            const job = result.data;
            if (job.currentRetry >= job.maxRetry) {
                throw new ValidationError('Max retry reached.', { entity: this.meta.name, job });
            }
        }
        return result;
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
};

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
    removeSubTree,
    cloneSubTree,
    getTopNodes,
    moveNode,
    getChildren,
    getParents,
    popJob,
    postJob,
    jobDone,
    jobFail,
    retry,
    postDeferredJob,
    removeExpiredJobs,
    getDueJobs,
    getBatchStatus,
};
