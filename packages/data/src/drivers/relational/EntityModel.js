import { _, eachAsync_, isPlainObject, isEmpty, set as _set, get as _get } from '@kitmi/utils';
import EntityModel from '../../EntityModel';
import { ApplicationError, ReferencedNotExistError, ValidationError, InvalidArgument } from '@kitmi/types';

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

        _.forOwn(data, (v, k) => {
            if (k[0] === ':') {
                // cascade update
                const anchor = k.substr(1);
                const assocMeta = meta[anchor];
                if (!assocMeta) {
                    throw new ValidationError(`Unknown association "${anchor}" of entity "${this.meta.name}".`);
                }

                if (isNew && (assocMeta.type === 'refersTo' || assocMeta.type === 'belongsTo') && anchor in data) {
                    throw new ValidationError(
                        `Association data ":${anchor}" of entity "${this.meta.name}" conflicts with input value of field "${anchor}".`
                    );
                }

                assocs[anchor] = v;
            } else if (k[0] === '@') {
                // update by reference
                const anchor = k.substr(1);
                const assocMeta = meta[anchor];
                if (!assocMeta) {
                    throw new ValidationError(`Unknown association "${anchor}" of entity "${this.meta.name}".`);
                }

                if (assocMeta.type !== 'refersTo' && assocMeta.type !== 'belongsTo') {
                    throw new ValidationError(
                        `Association type "${assocMeta.type}" cannot be used for update by reference.`,
                        {
                            entity: this.meta.name,
                            data,
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
            } else {
                raw[k] = v;
            }
        });

        return [raw, assocs, refs];
    }

    async _populateReferences_(context, references) {
        const meta = this.meta.associations;

        await eachAsync_(references, async (refQuery, anchor) => {
            const assocMeta = meta[anchor];
            const ReferencedEntity = this.db.entity(assocMeta.entity);

            const { result: created } = await ReferencedEntity.findOne_({ ...refQuery, $select: [assocMeta.field] });

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
        let keyValue;

        if (!beforeEntityCreate) {
            keyValue = context.result.data[this.meta.keyField];

            if (keyValue == null) {
                if (context.result.affectedRows === 0) {
                    // insert ignored

                    const query = this.getUniqueKeyValuePairsFrom(context.result.data);
                    context.return = await this.findOne_({ $where: query });
                    if (!context.return) {
                        throw new ApplicationError(
                            'The parent entity is duplicated on unique keys different from the pair of keys used to query',
                            {
                                $where: query,
                                data: context.return,
                                relation: assocs,
                            }
                        );
                    }
                }

                keyValue = context.result.data[this.meta.keyField];

                if (keyValue == null) {
                    throw new ApplicationError('Missing required primary key field value. Entity: ' + this.meta.name, {
                        data: context.return,
                        associations: assocs,
                    });
                }
            }
        }

        const pendingAssocs = {};
        const finished = {};

        // todo: double check to ensure including all required options
        const passOnOptions = _.pick(context.options, [
            '$skipModifiers',
            '$migration',
            '$variables',
            '$upsert',
            '$dryRun',
        ]);

        await eachAsync_(assocs, async (data, anchor) => {
            const assocMeta = meta[anchor];

            if (beforeEntityCreate && assocMeta.type !== 'refersTo' && assocMeta.type !== 'belongsTo') {
                pendingAssocs[anchor] = data;
                return;
            }

            const assocModel = this.db.entity(assocMeta.entity);

            if (assocMeta.list) {
                data = _.castArray(data);

                if (!assocMeta.field) {
                    throw new ApplicationError(
                        `Missing "field" property in the metadata of association "${anchor}" of entity "${this.meta.name}".`
                    );
                }

                return eachAsync_(data, (item) =>
                    assocModel.create_({ ...item, [assocMeta.field]: keyValue }, passOnOptions)
                );
            } else if (!isPlainObject(data)) {
                if (Array.isArray(data)) {
                    throw new ApplicationError(
                        `Invalid type of associated entity (${assocMeta.entity}) data triggered from "${this.meta.name}" entity. Singular value expected (${anchor}), but an array is given instead.`
                    );
                }

                if (!assocMeta.assoc) {
                    throw new ApplicationError(
                        `The associated field of relation "${anchor}" does not exist in the entity meta data.`
                    );
                }

                data = { [assocMeta.assoc]: data };
            }

            if (!beforeEntityCreate && assocMeta.field) {
                // hasMany or hasOne
                data = { ...data, [assocMeta.field]: keyValue };
            }

            let created = await assocModel.create_(data, passOnOptions, context.connOptions);

            if (created.affectedRows === 0 || (assocModel.hasAutoIncrement && created.insertId === 0)) {
                // insert ignored or upserted

                const assocQuery = assocModel.getUniqueKeyValuePairsFrom(data);

                created = await assocModel.findOne_({ $query: assocQuery }, context.connOptions);
                if (!created) {
                    throw new ApplicationError(
                        'The assoicated entity is duplicated on unique keys different from the pair of keys used to query',
                        {
                            query: assocQuery,
                            data,
                        }
                    );
                }
            }

            finished[anchor] = beforeEntityCreate ? created.data[assocMeta.field] : created.data[assocMeta.key];
        });

        if (beforeEntityCreate) {
            _.forOwn(finished, (refFieldValue, localField) => {
                context.raw[localField] = refFieldValue;
            });
        }

        return pendingAssocs;
    }

    async _updateAssocs_(context, assocs, beforeEntityUpdate, forSingleRecord) {
        const meta = this.meta.associations;

        let currentKeyValue;

        if (!beforeEntityUpdate) {
            currentKeyValue = getValueFromAny([context.options.$query, context.return], this.meta.keyField);
            if (currentKeyValue == null) {
                // should have in updating
                throw new ApplicationError('Missing required primary key field value. Entity: ' + this.meta.name);
            }
        }

        const pendingAssocs = {};

        // todo: double check to ensure including all required options
        const passOnOptions = _.pick(context.options, ['$skipModifiers', '$migration', '$variables', '$upsert']);

        await eachAsync_(assocs, async (data, anchor) => {
            const assocMeta = meta[anchor];

            if (beforeEntityUpdate && assocMeta.type !== 'refersTo' && assocMeta.type !== 'belongsTo') {
                pendingAssocs[anchor] = data;
                return;
            }

            const assocModel = this.db.entity(assocMeta.entity);

            if (assocMeta.list) {
                data = _.castArray(data);

                if (!assocMeta.field) {
                    throw new ApplicationError(
                        `Missing "field" property in the metadata of association "${anchor}" of entity "${this.meta.name}".`
                    );
                }

                const assocKeys = mapFilter(
                    data,
                    (record) => record[assocMeta.key] != null,
                    (record) => record[assocMeta.key]
                );
                const assocRecordsToRemove = {
                    [assocMeta.field]: currentKeyValue,
                };
                if (assocKeys.length > 0) {
                    assocRecordsToRemove[assocMeta.key] = { $notIn: assocKeys };
                }

                await assocModel.deleteMany_(assocRecordsToRemove, context.connOptions);

                return eachAsync_(data, (item) =>
                    item[assocMeta.key] != null
                        ? assocModel.updateOne_(
                              {
                                  ..._.omit(item, [assocMeta.key]),
                                  [assocMeta.field]: currentKeyValue,
                              },
                              {
                                  $query: {
                                      [assocMeta.key]: item[assocMeta.key],
                                  },
                                  ...passOnOptions,
                              },
                              context.connOptions
                          )
                        : assocModel.create_(
                              { ...item, [assocMeta.field]: currentKeyValue },
                              passOnOptions,
                              context.connOptions
                          )
                );
            } else if (!isPlainObject(data)) {
                if (Array.isArray(data)) {
                    throw new ApplicationError(
                        `Invalid type of associated entity (${assocMeta.entity}) data triggered from "${this.meta.name}" entity. Singular value expected (${anchor}), but an array is given instead.`
                    );
                }

                if (!assocMeta.assoc) {
                    throw new ApplicationError(
                        `The associated field of relation "${anchor}" does not exist in the entity meta data.`
                    );
                }

                // connected by
                data = { [assocMeta.assoc]: data };
            }

            if (beforeEntityUpdate) {
                if (isEmpty(data)) return;

                // refersTo or belongsTo
                let destEntityId = getValueFromAny([context.existing, context.options.$query, context.raw], anchor);

                if (destEntityId == null) {
                    if (isEmpty(context.existing)) {
                        context.existing = await this.findOne_(context.options.$query, context.connOptions);
                        if (!context.existing) {
                            throw new ValidationError(`Specified "${this.meta.name}" not found.`, {
                                query: context.options.$query,
                            });
                        }
                        destEntityId = context.existing[anchor];
                    }

                    if (destEntityId == null) {
                        if (!(anchor in context.existing)) {
                            throw new ApplicationError(
                                'Existing entity record does not contain the referenced entity id.',
                                {
                                    anchor,
                                    data,
                                    existing: context.existing,
                                    query: context.options.$query,
                                    raw: context.raw,
                                }
                            );
                        }

                        // to create the associated, existing is null

                        let created = await assocModel.create_(data, passOnOptions, context.connOptions);

                        if (created.affectedRows === 0) {
                            // insert ignored

                            const assocQuery = assocModel.getUniqueKeyValuePairsFrom(data);
                            created = await assocModel.findOne_({ $query: assocQuery }, context.connOptions);
                            if (!created) {
                                throw new ApplicationError(
                                    'The assoicated entity is duplicated on unique keys different from the pair of keys used to query',
                                    {
                                        query: assocQuery,
                                        data,
                                    }
                                );
                            }
                        }

                        context.raw[anchor] = created[assocMeta.field];
                        return;
                    }
                }

                if (destEntityId) {
                    return assocModel.updateOne_(
                        data,
                        { [assocMeta.field]: destEntityId, ...passOnOptions },
                        context.connOptions
                    );
                }

                // nothing to do for null dest entity id
                return;
            }

            await assocModel.deleteMany_({ [assocMeta.field]: currentKeyValue }, context.connOptions);

            if (forSingleRecord) {
                return assocModel.create_(
                    { ...data, [assocMeta.field]: currentKeyValue },
                    passOnOptions,
                    context.connOptions
                );
            }

            throw new Error('update associated data for multiple records not implemented');

            // return assocModel.replaceOne_({ ...data, ...(assocMeta.field ? { [assocMeta.field]: keyValue } : {}) }, null, context.connOptions);
        });

        return pendingAssocs;
    }
}

export default RelationalEntityModel;
