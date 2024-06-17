import { _ } from "@kitmi/utils";

import Rules from "../Rules";
import { mergeWhere } from "../helpers";
import defaultGenerator from "../TypeGenerators";

/**
 * A rule specifies the entity will not be deleted physically.
 * @module EntityFeatureRuntime_LogicalDeletion
 */

module.exports = {
    [Rules.RULE_BEFORE_FIND]: (feature, entityModel, context) => {
        const findOptions = context.options;
        if (!findOptions.$includeDeleted) {
            findOptions.$query = mergeWhere(findOptions.$query, {
                [feature.field]: { $ne: feature.value },
            });
        }

        return true;
    },
    [Rules.RULE_BEFORE_DELETE]: async (feature, entityModel, context) => {
        const options = context.options;
        if (!options.$physicalDeletion) {
            const { field, value, timestampField } = feature;
            const updateTo = {
                [field]: value,
            };

            if (timestampField) {
                updateTo[timestampField] = defaultGenerator(
                    entityModel.meta.fields[timestampField],
                    context.i18n
                );
            }

            const updateOpts = {
                $query: options.$query,
                $getUpdated: options.$getDeleted,
                $bypassReadOnly: new Set([field, timestampField]),
                ..._.pick(options, ['$getDeleted', '$fullResult']),
            };

            context.return = await entityModel._update_(
                updateTo,
                updateOpts,
                context.connOptions,
                context.forSingleRecord
            );

            return false;
        }

        return true;
    },
};
