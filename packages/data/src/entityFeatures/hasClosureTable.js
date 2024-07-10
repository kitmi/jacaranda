import { _, eachAsync_ } from '@kitmi/utils';
import { xrDataSet } from '../helpers';
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
    [Rules.RULE_BEFORE_DELETE]: async (feature, entity, context) => {
        if (!context.options.$dryRun) {
            await entity.ensureTransaction_();
        }

        const key = entity.meta.keyField;
        const RelatedEntity = entity.getRelatedEntity(feature.relation);

        const { data } = await entity.findMany_({ $select: [key], $where: context.options.$where });
        await eachAsync_(data, async (toDelete) => {
            const keyValue = toDelete[key];
            await RelatedEntity.deleteMany_({
                ancestorId: {
                    $in: xrDataSet(RelatedEntity.meta.name, {
                        $select: ['ancestorId'],
                        $where: { descendantId: keyValue, depth: { $gt: 0 } },
                    }),
                },           
                descendantId: {
                    $in: xrDataSet(RelatedEntity.meta.name, {
                        $select: ['descendantId'],
                        $where: { ancestorId: keyValue },
                    }),
                },
            });
        }); 
    },   
    /*
    [Rules.RULE_AFTER_DELETE]: async (feature, entity, context) => {
        const data = context.result.data;
        const RelatedEntity = entity.getRelatedEntity(feature.relation);

        if (data) {            
            await eachAsync_(data, async (deleted) => {
                const keyValue = entity.valueOfKey(deleted);
                await RelatedEntity.deleteMany_({ descendantId: keyValue });
                await RelatedEntity.deleteMany_({
                    descendantId: {
                        $in: xrDataSet(RelatedEntity.meta.name, {
                            $select: ['descendantId'],
                            $where: { ancestorId: keyValue },
                        }),
                    },
                });
            });
        }
    },
    */
};
