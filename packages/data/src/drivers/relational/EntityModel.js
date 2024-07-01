import { _, eachAsync_, batchAsync_, isPlainObject, isEmpty, set as _set, get as _get } from '@kitmi/utils';
import EntityModel from '../../EntityModel';
import {
    ApplicationError,
    ReferencedNotExistError,
    ValidationError,
    InvalidArgument,
    DatabaseError,
} from '@kitmi/types';

import { getValueFromAny } from '../../helpers';

/**
 * Relational entity model class.
 */
class RelationalEntityModel extends EntityModel {
    /**
     * [specific] Check if this entity has auto increment feature.
     */
    get hasAutoIncrement() {
        const autoId = this.meta.features.autoId;
        return autoId && this.meta.fields[autoId.field].autoIncrementId;
    }

    _ensureNoAssociations(data) {
        for (const k in data) {
            if (k[0] === ':' || k[0] === '@') {
                throw new ValidationError(`Association data "${k}" is not allowed in entity "${this.meta.name}".`);
            }
        }
    }

    _uniqueRelations(relations) {
        const [normalAssocs, customAssocs] = _.partition(relations, (assoc) => typeof assoc === 'string');

        return customAssocs.concat(_.uniq(normalAssocs).sort());
    }

    /**
     * Preprocess relationships for non-ORM operations.
     * @param {*} findOptions
     */
    _prepareAssociationsNoOrm(findOptions) {
        const associations = this._uniqueRelations(findOptions.$relation);
        const assocTable = {};
        const cache = {};

        associations.forEach((assoc) => {
            if (typeof assoc === 'object') {
                const { anchor, alias, ...override } = assoc;
                if (anchor) {
                    this._loadAssocIntoTable(assocTable, cache, anchor, override);
                    return;
                }

                if (!alias) {
                    throw new InvalidArgument('Missing "alias" for custom association.', {
                        entity: this.meta.name,
                        assoc,
                    });
                }

                if (this.meta.associations && (alias in this.meta.associations)) {
                    throw new InvalidArgument(`Alias "${alias}" conflicts with a predefined association.`, {
                        entity: this.meta.name,
                        alias,
                    });
                }

                if (!assoc.entity) {
                    throw new InvalidArgument('Missing "entity" for custom association.', {
                        entity: this.meta.name,
                        alias,
                    });
                }

                cache[alias] = assocTable[alias] = {
                    ...assoc   
                };
            } else {
                this._loadAssocIntoTable(assocTable, cache, assoc);
            }            
        });

        return assocTable;
    }

    /**
     * Load association into table 
     * @param {*} assocTable - Hierarchy with subAssocs
     * @param {*} cache - Dotted path as key
     * @param {*} assoc - Dotted path
     */
    _loadAssocIntoTable(assocTable, cache, assoc, override) {
        if (cache[assoc]) return cache[assoc];

        const lastPos = assoc.lastIndexOf('.');
        let result;

        if (lastPos === -1) {
            // direct association
            const assocInfo = { ...this.meta.associations[assoc], ...override };
            if (isEmpty(assocInfo)) {
                throw new InvalidArgument(`Entity "${this.meta.name}" does not have the association "${assoc}".`);
            }

            result = assocTable[assoc] = assocInfo;
            cache[assoc] = result;
        } else {
            const base = assoc.substring(0, lastPos);
            const last = assoc.substring(lastPos + 1);

            let baseNode = cache[base];
            if (!baseNode) {
                baseNode = this._loadAssocIntoTable(assocTable, cache, base);
            }

            const entity = this.db.entity(baseNode.entity);
            const assocInfo = { ...entity.meta.associations[last], ...override };
            if (isEmpty(assocInfo)) {
                throw new InvalidArgument(`Entity "${entity.meta.name}" does not have the association "${assoc}".`);
            }

            result = assocInfo;

            if (!baseNode.subAssocs) {
                baseNode.subAssocs = {};
            }

            baseNode.subAssocs[last] = result;
            cache[assoc] = result;
        }

        return result;
    }

    /**
     * Pre-process assoicated db operation
     * @param {*} data
     * @param {*} isNew - New record flag, true for creating, false for updating
     * @returns {Array} [raw, assocs, refs];
     */
    _extractAssociations(data, isNew) {
        const raw = {};
        const assocs = {};
        const refs = {};
        const meta = this.meta.associations;

        _.each(data, (v, k) => {
            if (k[0] === ':') {
                // cascade update
                const anchor = k.substring(1);
                const assocMeta = meta?.[anchor];
                if (!assocMeta) {
                    throw new ValidationError(`Unknown association "${anchor}" of entity "${this.meta.name}".`);
                }

                if (isNew && assocMeta.type && anchor in data) {
                    throw new ValidationError(
                        `Association data ":${anchor}" of entity "${this.meta.name}" conflicts with input value of field "${anchor}".`
                    );
                }

                assocs[anchor] = v;
                return;
            }

            if (k[0] === '@') {
                // update by reference
                const anchor = k.substring(1);
                const assocMeta = meta?.[anchor];
                if (!assocMeta) {
                    throw new ValidationError(`Unknown association "${anchor}" of entity "${this.meta.name}".`);
                }

                if (!assocMeta.type) {
                    throw new ValidationError(
                        `Association "${anchor}" cannot be used for updating by reference. Only "refersTo" or "belongsTo" is suppported.`,
                        {
                            entity: this.meta.name,
                            anchor,
                        }
                    );
                }

                if (isNew && anchor in data) {
                    throw new ValidationError(
                        `Association reference "@${anchor}" of entity "${this.meta.name}" conflicts with input value of field "${anchor}".`
                    );
                }

                const assocAnchor = ':' + anchor;
                if (assocAnchor in data) {
                    throw new ValidationError(
                        `Association reference "@${anchor}" of entity "${this.meta.name}" conflicts with association data "${assocAnchor}".`
                    );
                }

                if (v == null) {
                    raw[anchor] = null;
                } else {
                    refs[anchor] = v;
                }

                return;
            }

            raw[k] = v;
        });

        return [raw, assocs, refs];
    }

    async _populateReferences_(context, references) {
        const meta = this.meta.associations;

        await eachAsync_(references, async (refQuery, anchor) => {
            const assocMeta = meta[anchor];
            const ReferencedEntity = this.db.entity(assocMeta.entity);

            const created = await ReferencedEntity.findOne_({ ...refQuery, $select: [assocMeta.field] });

            console.log({ ...refQuery, $select: [assocMeta.field] });

            if (created == null) {
                throw new ReferencedNotExistError(
                    `Referenced entity "${ReferencedEntity.meta.name}" with ${JSON.stringify(refQuery)} not exist.`
                );
            }

            context.raw[anchor] = created[assocMeta.field];
        });
    }

    async _createAssocs_(context, assocs, beforeEntityCreate) {
        const meta = this.meta.associations;
        const opOptions = context.options;
        let keyValue;

        if (!beforeEntityCreate) {
            keyValue = context.result.data[this.meta.keyField];

            if (keyValue == null) {
                if (context.result.affectedRows === 0) {
                    // only happens when insert ignored

                    const query = this.getUniqueKeyValuePairsFrom(context.result.data);
                    const data = await this.findOne_({ $select: [this.meta.keyField], $where: query });
                    if (data == null) {
                        throw new ApplicationError(
                            'The parent entity cannot be found using the unique key(s) from data.',
                            {
                                entity: this.meta.name,
                                query,
                            }
                        );
                    }

                    Object.assign(context.result.data, data);
                    keyValue = data[this.meta.keyField];
                }

                if (keyValue == null) {
                    throw new ApplicationError('Missing required primary key field value.', {
                        entity: this.meta.name,
                        data: context.result.data,
                    });
                }
            }
        }

        const pendingAssocs = {};
        const finished = {};

        // todo: double check to ensure including all required options
        const passOnOptions = _.pick(opOptions, ['$skipModifiers', '$migration', '$ctx', '$upsert', '$dryRun']);

        await eachAsync_(assocs, async (data, anchor) => {
            const assocMeta = meta?.[anchor];
            if (assocMeta == null) {
                throw new InvalidArgument(`Association "${anchor}" of entity "${this.meta.name}" not found.`, {
                    entity: this.meta.name,
                    anchor,
                });
            }

            if (beforeEntityCreate && !assocMeta.type) {
                // reverse reference should be created after the entity is created
                pendingAssocs[anchor] = data;
                return;
            }

            const assocModel = this.db.entity(assocMeta.entity);

            if (assocMeta.list) {
                // hasMany
                if (!Array.isArray(data)) {
                    throw new InvalidArgument(`Association "${anchor}" is a list, array is expected.`, {
                        entity: this.meta.name,
                        anchor,
                        remote: assocMeta.entity,
                    });
                }

                return batchAsync_(data, (item) =>
                    assocModel.create_({ ...item, [assocMeta.field]: keyValue }, { ...passOnOptions })
                );
            }

            if (!isPlainObject(data)) {
                throw new InvalidArgument(`Association "${anchor}" expects an object as input.`, {
                    entity: this.meta.name,
                    anchor,
                    remote: assocMeta.entity,
                });
            }

            if (!beforeEntityCreate) {
                // hasOne
                data = { ...data, [assocMeta.field]: keyValue };
            }

            let created = await assocModel.create_(data, { ...passOnOptions });

            if (!beforeEntityCreate) {
                return;
            }

            if (created.affectedRows === 0 || (assocModel.hasAutoIncrement && created.insertId === 0)) {
                // insert ignored or upserted

                const assocQuery = assocModel.getUniqueKeyValuePairsFrom(data);

                const _data = await assocModel.findOne_({ $select: [assocModel.meta.keyField], $where: assocQuery });
                if (_data == null) {
                    throw new ApplicationError('The child entity cannot be found using the unique key(s) from data.', {
                        entity: assocModel.meta.name,
                        query: assocQuery,
                    });
                }
            }

            finished[anchor] = created.data[assocMeta.field];
        });

        if (beforeEntityCreate) {
            Object.assign(context.raw, finished);
        }

        return pendingAssocs;
    }

    async _updateAssocs_(context, assocs, beforeEntityUpdate) {
        const meta = this.meta.associations;
        const opOptions = context.options;
        let currentKeyValue;

        if (!beforeEntityUpdate) {
            currentKeyValue = getValueFromAny([opOptions.$where, context.result.data], this.meta.keyField);
            if (currentKeyValue == null) {
                // should have in updating
                throw new ApplicationError('Missing required primary key field value.', {
                    entity: this.meta.name,
                    query: opOptions.$where,
                    data: context.result.data,
                });
            }
        }

        const pendingAssocs = {};

        // todo: double check to ensure including all required options
        const passOnOptions = _.pick(context.options, ['$skipModifiers', '$migration', '$ctx', '$upsert']);

        await eachAsync_(assocs, async (data, anchor) => {
            const assocMeta = meta?.[anchor];
            if (assocMeta == null) {
                throw new InvalidArgument(`Association "${anchor}" of entity "${this.meta.name}" not found.`, {
                    entity: this.meta.name,
                    anchor,
                });
            }

            if (beforeEntityUpdate && !assocMeta.type) {
                // reverse reference should be updated after the entity is updated
                pendingAssocs[anchor] = data;
                return;
            }

            const assocModel = this.db.entity(assocMeta.entity);

            if (assocMeta.list) {
                // has many
                if (!Array.isArray(data)) {
                    if (typeof data === 'object') {
                        const { $delete, $update, $create, ...others } = data;
                        if (!isEmpty(others)) {
                            throw new InvalidArgument(
                                `Association "${anchor}" is a list and array or object with { $delete, $update, $create } is expected.`,
                                {
                                    entity: this.meta.name,
                                    anchor,
                                    remote: assocMeta.entity,
                                }
                            );
                        }

                        if ($delete) {
                            if (!Array.isArray($delete)) {
                                throw new InvalidArgument(
                                    `"$delete" operation of "hasMany" association "${anchor}" requires an array.`,
                                    {
                                        entity: this.meta.name,
                                        anchor,
                                        remote: assocMeta.entity,
                                    }
                                );
                            }

                            const keysToDelete = $delete.map((item, index) => {
                                const keyValue = item[assocModel.meta.keyField];
                                if (keyValue == null) {
                                    throw new InvalidArgument(
                                        `The key field "${assocModel.meta.keyField}" is required for deletion.`,
                                        {
                                            mainEntity: this.meta.name,
                                            childEntity: assocModel.meta.name,
                                            index,
                                            item,
                                        }
                                    );
                                }
                                return keyValue;
                            });

                            await assocModel.deleteMany_(
                                { [assocModel.meta.keyField]: { $in: keysToDelete } },
                                { ...passOnOptions }
                            );
                        }

                        if ($update) {
                            if (!Array.isArray($update)) {
                                throw new InvalidArgument(
                                    `"$update" operation of "hasMany" association "${anchor}" requires an array.`,
                                    {
                                        entity: this.meta.name,
                                        anchor,
                                        remote: assocMeta.entity,
                                    }
                                );
                            }

                            await batchAsync_($update, async (item, index) => {
                                const keyValue = item[assocModel.meta.keyField];
                                if (keyValue == null) {
                                    throw new InvalidArgument(
                                        `The key field "${assocModel.meta.keyField}" is required for updating.`,
                                        {
                                            mainEntity: this.meta.name,
                                            childEntity: assocModel.meta.name,
                                            index,
                                            item,
                                        }
                                    );
                                }

                                await assocModel.updateOne_(
                                    { ...item, [assocModel.meta.keyField]: undefined },
                                    { ...passOnOptions, $where: { [assocModel.meta.keyField]: keyValue } }
                                );
                            });
                        }

                        if ($create) {
                            if (!Array.isArray($create)) {
                                throw new InvalidArgument(
                                    `"$create" operation of "hasMany" association "${anchor}" requires an array.`,
                                    {
                                        entity: this.meta.name,
                                        anchor,
                                        remote: assocMeta.entity,
                                    }
                                );
                            }

                            await batchAsync_($create, (item) =>
                                assocModel.create_(
                                    { ...item, [assocMeta.field]: currentKeyValue },
                                    { ...passOnOptions, $getCreated: null }
                                )
                            );
                        }

                        return;
                    }

                    throw new InvalidArgument(`Association "${anchor}" is a list and array is expected.`, {
                        entity: this.meta.name,
                        anchor,
                        remote: assocMeta.entity,
                    });
                }

                return batchAsync_(data, (item) =>
                    assocModel.create_(
                        { ...item, [assocMeta.field]: currentKeyValue },
                        { ...passOnOptions, $upsert: true, $getCreated: null }
                    )
                );
            }

            if (!isPlainObject(data)) {
                throw new InvalidArgument(`Association "${anchor}" expects an object as input.`, {
                    entity: this.meta.name,
                    anchor,
                    remote: assocMeta.entity,
                });
            }

            if (beforeEntityUpdate) {
                if (isEmpty(data)) return;

                // refersTo or belongsTo
                let destEntityId = getValueFromAny([context.existing, context.options.$where, context.raw], anchor);

                if (destEntityId == null) {
                    if (isEmpty(context.existing)) {
                        context.existing = await this.findOne_({ $select: [anchor], $where: context.options.$where });
                        if (!context.existing) {
                            throw new ValidationError(`The entity "${this.meta.name}" to be update is not found.`, {
                                query: context.options.$where,
                            });
                        }
                        destEntityId = context.existing[anchor];
                    }

                    if (destEntityId == null) {
                        // to create the associated, existing is null
                        let created = await assocModel.create_(data, {
                            ...passOnOptions,
                            $upsert: true,
                            $getCreated: [assocMeta.field],
                        });

                        if (created.affectedRows === 0) {
                            throw new DatabaseError('Failed to create or update the referenced entity.', {
                                entity: assocModel.meta.name,
                                data,
                            });
                        }

                        context.raw[anchor] = created.data[assocMeta.field];
                        return;
                    }
                }

                return assocModel.updateOne_(data, { ...passOnOptions, [assocMeta.field]: destEntityId });
            }

            // hasOne
            return assocModel.create_(
                { ...data, [assocMeta.field]: currentKeyValue },
                { ...passOnOptions, $upsert: true, $getCreated: null }
            );
        });

        return pendingAssocs;
    }
}

export default RelationalEntityModel;
