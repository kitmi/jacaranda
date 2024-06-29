import { _ } from '@kitmi/utils';

import Rules from '../Rules';
import { mergeWhere } from '../helpers';
import defaultGenerator from '../TypeGenerators';
import { OpCompleted } from '../utils/errors';

/**
 * A rule specifies the entity will not be deleted physically.
 * @module EntityFeatureRuntime_LogicalDeletion
 */

export default {
    [Rules.RULE_BEFORE_FIND]: (feature, entityModel, context) => {
        const findOptions = context.options;
        if (!findOptions.$includeDeleted) {            
            findOptions.$where = mergeWhere(findOptions.$where, {
                [feature.field]: { $ne: feature.value },
            });
        }
    },
    [Rules.RULE_BEFORE_DELETE]: async (feature, entityModel, context) => {
        const options = context.options;
        if (!options.$physical) {
            const { field, value, timestampField } = feature;
            const updateTo = {
                [field]: value,
            };

            if (timestampField) {
                updateTo[timestampField] = defaultGenerator(entityModel.meta.fields[timestampField], context.i18n);
            }

            const updateOpts = {
                $where: options.$where,
                $getUpdated: options.$getDeleted,
                $bypassReadOnly: new Set([field, timestampField]),
                ..._.pick(options, ['$getDeleted']),
            };

            if (context.isOne) {
                context.result = await entityModel.updateOne_(
                    updateTo,
                    updateOpts
                );
            } else {
                context.result = await entityModel.updateMany_(
                    updateTo,
                    updateOpts
                );
            }            

            throw new OpCompleted(context.result);
        }
    },
};
