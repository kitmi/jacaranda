import { _ } from '@kitmi/utils';
import Rules from '../Rules';

/**
 * A rule specifies the change of state will be tracked automatically.
 * @module EntityFeatureRuntime_AutoCreate
 */

export default {
    [Rules.RULE_AFTER_CREATE]: async (feature, entity, context) => {
        const RelatedEntity = entity.getRalatedEntity(feature.relation);
        const assocInfo = this.meta.associations[feature.relation];

        const data = {
            ...feature.initData,
        };

        if (!assocInfo.type) {
            data[assocInfo.field] = context.latest[assocInfo.key];
        }

        await RelatedEntity.create_(data);
    },
};
