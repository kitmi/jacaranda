import { _ } from '@kitmi/utils';
import Rules from '../Rules';

/**
 * A rule specifies the change of state will be tracked automatically.
 * @module EntityFeatureRuntime_AutoCreate
 */

export default {
    [Rules.RULE_AFTER_CREATE]: async (feature, entity, context) => {
        const RelatedEntity = entity.getRelatedEntity(feature.relation);

        const keyValue = entity.valueOfKey(context.latest);

        const data = {
            ancestorId: keyValue,
            descendantId: keyValue,
            depth: 0,
        };

        await RelatedEntity.create_(data);
    },
};
