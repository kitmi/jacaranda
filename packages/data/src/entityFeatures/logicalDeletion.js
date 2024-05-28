const Rules = require('../enum/Rules');
const { mergeCondition } = require('../utils/lang');
const Generators = require('../Generators');
const { _ } = require('@genx/july');

/**
 * A rule specifies the entity will not be deleted physically.
 * @module EntityFeatureRuntime_LogicalDeletion
 */

module.exports = {
    [Rules.RULE_BEFORE_FIND]: (feature, entityModel, context) => {
        const findOptions = context.options;
        if (!findOptions.$includeDeleted) {
            findOptions.$query = mergeCondition(findOptions.$query, {
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
                updateTo[timestampField] = Generators.default(
                    entityModel.meta.fields[timestampField],
                    context.i18n
                );
            }

            const updateOpts = {
                $query: options.$query,
                $retrieveUpdated: options.$retrieveDeleted,
                $bypassReadOnly: new Set([field, timestampField]),
                ..._.pick(options, ['$retrieveDeleted', '$retrieveDbResult']),
            };

            context.return = await entityModel._update_(
                updateTo,
                updateOpts,
                context.connOptions,
                context.forSingleRecord
            );

            if (options.$retrieveDbResult) {
                context.rawOptions.$result = updateOpts.$result;
            }

            return false;
        }

        return true;
    },
};
