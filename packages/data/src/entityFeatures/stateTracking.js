import { isPlainObject } from '@kitmi/utils';
import Rules from '../Rules';
import defaultGenerator from '../TypeGenerators';

/**
 * A rule specifies the change of state will be tracked automatically.
 * @module EntityFeatureRuntime_StateTracking
 */

module.exports = {
    [Rules.RULE_AFTER_VALIDATION]: (feature, entityModel, context) => {
        feature.forEach((featureItem) => {
            if (featureItem.field in context.latest) {
                const targetState = context.latest[featureItem.field];

                if (isPlainObject(targetState) && targetState.$xr) {
                    return;
                }

                const timestampField = featureItem.stateMapping[targetState];
                if (!timestampField) {
                    throw new Error(
                        `State "${targetState}" is not one of the pre-defined states of field "${featureItem.field}" of entity "${entityModel.meta.name}".`
                    );
                }

                if (context.latest[timestampField] == null) {
                    context.latest[timestampField] = defaultGenerator(
                        entityModel.meta.fields[timestampField],
                        context.i18n
                    );
                }
            }
        });

        return true;
    },
};
