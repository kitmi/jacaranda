import { _ } from '@kitmi/utils';
import Rules from '../Rules';

/**
 * A rule specifies the change of state will be tracked automatically.
 * @module EntityFeatureRuntime_AutoCreate
 */

export default {
    [Rules.RULE_BEFORE_CREATE]: async (feature, entity, context) => {
        const RelatedEntity = entity.getRalatedEntity(feature.relation);
        const result = await RelatedEntity.create_({
            ...feature.initData,
        });

        const assocInfo = this.meta.associations[feature.relation];

        // only belongsTo and refersTo has type
        if (assocInfo.type) {
            context.latest[feature.relation] = result.data[assocInfo.field];
        }
    },
};
