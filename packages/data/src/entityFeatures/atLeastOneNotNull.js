import { _, quote } from '@kitmi/utils';
import { ValidationError } from '@kitmi/types';
import Rules from '../Rules';

/**
 * A rule specifies at least one field not null, e.g. email or mobile.
 * @module EntityFeatureRuntime_AtLeastOneNotNull
 */

export default {
    [Rules.RULE_BEFORE_CREATE]: (feature, entityModel, context) => {
        _.each(feature, (item) => {
            if (_.every(item, (fieldName) => context.latest[fieldName] == null)) {
                throw new ValidationError(
                    `At least one of these fields ${item.map((f) => quote(f)).join(', ')} should not be null.`,
                    {
                        entity: entityModel.meta.name,
                        fields: feature,
                    }
                );
            }
        });
    },

    [Rules.RULE_BEFORE_UPDATE]: (feature, entityModel, context) => {
        _.each(feature, (item) => {
            if (
                _.every(item, (fieldName) =>
                    fieldName in context.latest
                        ? context.latest[fieldName] == null
                        : context.existing && context.existing[fieldName] == null
                )
            ) {
                console.log(context);

                throw new ValidationError(
                    `At least one of these fields ${item.map((f) => quote(f)).join(', ')} should not be null.`,
                    {
                        entity: entityModel.meta.name,
                        fields: feature,
                    }
                );
            }
        });
    },
};
