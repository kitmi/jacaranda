import { _ } from '@kitmi/utils';
import Rules from '../Rules';

/**
 * A rule specifies the change of state will be tracked automatically.
 * @module EntityFeatureRuntime_AutoCreate
 */

export default {
    [Rules.RULE_AFTER_CREATE]: async (feature, entity, context) => {
        const RelatedEntity = entity.getRelatedEntity(feature.relation);
        const assocInfo = entity.meta.associations[feature.relation];
        const data = entity._translateValue(feature.initData, { $data: { this: context.latest } });

        if (!assocInfo.type) {
            data[assocInfo.field] = context.latest[entity.meta.keyField];
        }

        await RelatedEntity.create_(data);
    },
};
